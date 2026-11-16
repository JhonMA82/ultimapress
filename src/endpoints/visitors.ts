import crypto from 'crypto'
import type { Endpoint, PayloadRequest } from 'payload'

import { getSiteSettings } from '@/utilities/getSiteSettings'

/**
 * Two public endpoints the site's pages call quietly:
 *   POST /api/up/hit   one page view, for the built-in analytics
 *   POST /api/up/404   an address that does not exist, for the broken links list
 * Neither sets cookies or stores an IP address.
 */

const BOTS =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|quora|pinterest|vkshare|w3c_validator|whatsapp|lighthouse|headless|phantom|puppeteer|playwright|curl|wget|python|axios|node-fetch|go-http|java\//i

const ipOf = (req: PayloadRequest) =>
  (req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    '') + ''

/** At most 120 calls a minute from one address; kept in memory only. */
const recent = new Map<string, { n: number; t: number }>()
const tooMany = (key: string) => {
  const now = Date.now()
  const r = recent.get(key)
  if (!r || now - r.t > 60_000) {
    recent.set(key, { n: 1, t: now })
    if (recent.size > 5000) recent.clear()
    return false
  }
  r.n++
  return r.n > 120
}

const cleanPath = (raw: unknown) => {
  if (typeof raw !== 'string') return null
  let p = raw.trim().slice(0, 300)
  if (!p.startsWith('/') || p.startsWith('//')) return null
  p = p.split('#')[0].split('?')[0]
  if (/^\/(admin|api|_next|next)(\/|$)/.test(p)) return null
  return p.replace(/\/+$/, '') || '/'
}

const refHost = (raw: unknown, own: string | null) => {
  if (typeof raw !== 'string' || !raw) return null
  try {
    const host = new URL(raw).hostname.replace(/^www\./, '').toLowerCase()
    if (!host || host === own) return null
    return host.slice(0, 100)
  } catch {
    return null
  }
}

const deviceOf = (ua: string) =>
  /ipad|tablet|kindle|silk|(android(?!.*mobile))/i.test(ua) ? 'Tablet' : /mobi|iphone|android/i.test(ua) ? 'Phone' : 'Desktop'

const browserOf = (ua: string) =>
  /edg\//i.test(ua)
    ? 'Edge'
    : /opr\/|opera/i.test(ua)
      ? 'Opera'
      : /samsungbrowser/i.test(ua)
        ? 'Samsung Internet'
        : /firefox|fxios/i.test(ua)
          ? 'Firefox'
          : /chrome|crios/i.test(ua)
            ? 'Chrome'
            : /safari/i.test(ua)
              ? 'Safari'
              : 'Other'

const countryOf = (req: PayloadRequest) => {
  const c =
    req.headers.get('cf-ipcountry') ||
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('x-country-code') ||
    req.headers.get('cloudfront-viewer-country') ||
    ''
  return /^[A-Z]{2}$/i.test(c) && c.toUpperCase() !== 'XX' ? c.toUpperCase() : null
}

const today = () => new Date().toISOString().slice(0, 10)

/** Old rows are deleted at most once an hour, while counting visits. */
let lastPurge = 0
async function purgeOld(req: PayloadRequest, days: number) {
  if (Date.now() - lastPurge < 3_600_000) return
  lastPurge = Date.now()
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
  await req.payload.delete({
    collection: 'page-views',
    where: { day: { less_than: cutoff } },
    overrideAccess: true,
    req,
  })
}

const body = async (req: PayloadRequest): Promise<Record<string, unknown>> => {
  try {
    const text = await req.text?.()
    return text ? JSON.parse(text.slice(0, 4000)) : {}
  } catch {
    return {}
  }
}

const accepted = () => new Response(null, { status: 204 })

/** These calls never fail loudly: a visitor's page must not care whether counting worked. */
const quiet =
  (fn: (req: PayloadRequest) => Promise<Response>) =>
  async (req: PayloadRequest): Promise<Response> => {
    try {
      return await fn(req)
    } catch (err) {
      req.payload.logger.warn({ msg: 'Visitor count skipped', err })
      return accepted()
    }
  }

export const visitorEndpoints: Endpoint[] = [
  {
    path: '/up/hit',
    method: 'post',
    handler: quiet(async (req) => {
      const ua = req.headers.get('user-agent') || ''
      // Bots, "do not track", and the site's own logged-in team are not counted.
      if (!ua || BOTS.test(ua) || req.headers.get('dnt') === '1' || req.user) return accepted()
      const settings = await getSiteSettings()
      if (settings.enableAnalytics === false || settings.maintenanceMode) return accepted()
      const ip = ipOf(req)
      if (tooMany(`hit:${ip}`)) return accepted()

      const data = await body(req)
      const path = cleanPath(data.path)
      if (!path) return accepted()
      const host = (req.headers.get('host') || '').replace(/^www\./, '').split(':')[0].toLowerCase()
      const utm = typeof data.source === 'string' ? data.source.slice(0, 60).toLowerCase() : null
      const day = today()
      const visitor = crypto
        .createHash('sha256')
        .update(`${process.env.PAYLOAD_SECRET}|${day}|${ip}|${ua}|${host}`)
        .digest('hex')
        .slice(0, 20)

      await req.payload.create({
        collection: 'page-views',
        data: {
          day,
          path,
          referrer: utm || refHost(data.referrer, host),
          device: deviceOf(ua),
          browser: browserOf(ua),
          country: countryOf(req),
          visitor,
        },
        overrideAccess: true,
        depth: 0,
        req,
        context: { disableRevalidate: true },
      })
      await purgeOld(req, Math.max(30, Number(settings.analyticsRetentionDays) || 395)).catch(() => {})
      return accepted()
    }),
  },
  {
    // up-security: public on purpose, visitors' browsers report missing pages; rate limited, bots ignored, only a cleaned path is stored
    path: '/up/404',
    method: 'post',
    handler: quiet(async (req) => {
      const ua = req.headers.get('user-agent') || ''
      if (!ua || BOTS.test(ua)) return accepted()
      if (tooMany(`404:${ipOf(req)}`)) return accepted()
      const data = await body(req)
      const path = cleanPath(data.path)
      if (!path) return accepted()
      const host = (req.headers.get('host') || '').replace(/^www\./, '').split(':')[0].toLowerCase()
      const referrer = typeof data.referrer === 'string' && data.referrer ? data.referrer.slice(0, 300) : null
      const fromSite = referrer ? refHost(referrer, host) === null : false

      const existing = await req.payload.find({
        collection: 'not-found-log',
        where: { path: { equals: path } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        req,
      })
      const now = new Date().toISOString()
      const lastReferrer = referrer ? (fromSite ? `Your site: ${referrer}` : referrer) : null
      if (existing.docs[0]) {
        await req.payload.update({
          collection: 'not-found-log',
          id: existing.docs[0].id,
          data: { hits: (existing.docs[0].hits || 0) + 1, lastSeen: now, ...(lastReferrer ? { lastReferrer } : {}) },
          overrideAccess: true,
          depth: 0,
          req,
        })
      } else {
        // A flood of new random addresses (scanners) is capped.
        const { totalDocs } = await req.payload.count({ collection: 'not-found-log', overrideAccess: true, req })
        if (totalDocs >= 5000) return accepted()
        await req.payload.create({
          collection: 'not-found-log',
          data: { path, hits: 1, lastSeen: now, lastReferrer },
          overrideAccess: true,
          depth: 0,
          req,
        })
      }
      return accepted()
    }),
  },
]
