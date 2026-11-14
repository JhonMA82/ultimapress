import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import fs from 'fs'
import path from 'path'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps, Payload } from 'payload'
import React from 'react'

import { hasRole } from '@/access/roles'
import { backupDir, listBackups } from '@/siteBackups'
import { getServerSideURL } from '@/utilities/getURL'

type Status = 'good' | 'warn' | 'bad'
type Check = { status: Status; title: string; detail: string; href?: string; action?: string }

const count = async (payload: Payload, collection: string, where: Record<string, unknown>) => {
  try {
    const r = await payload.count({ collection: collection as 'pages', where: where as never, overrideAccess: true })
    return r.totalDocs
  } catch {
    return 0
  }
}

/** The newest UltimaPress release on GitHub, checked at most every six hours. */
let release: { at: number; tag: string | null } | null = null
async function latestRelease() {
  if (release && Date.now() - release.at < 6 * 3_600_000) return release.tag
  let tag: string | null = null
  try {
    const r = await fetch('https://api.github.com/repos/mrwebtv/ultimapress/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(5000),
    })
    if (r.ok) tag = ((await r.json()) as { tag_name?: string }).tag_name || null
  } catch {
    /* offline or rate limited */
  }
  release = { at: Date.now(), tag }
  return tag
}

const newer = (a: string, b: string) => {
  const pa = a.replace(/^v/, '').split('.').map(Number)
  const pb = b.replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0)
  return false
}

async function runChecks(payload: Payload, admin: string): Promise<Check[]> {
  const checks: Check[] = []
  const settings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true, depth: 0 })
  const priv = await payload.findGlobal({ slug: 'private-settings', overrideAccess: true, depth: 0 }).catch(() => null)

  // Backups
  const backups = listBackups()
  const last = backups[0]
  const ageH = last ? (Date.now() - Date.parse(last.createdAt)) / 3_600_000 : Infinity
  if (priv?.backupsEnabled === false) {
    checks.push({ status: 'bad', title: 'Daily backups are off', detail: 'If something goes wrong, there is nothing to restore.', href: `${admin}/globals/private-settings`, action: 'Turn on' })
  } else if (!last) {
    checks.push({ status: 'warn', title: 'No backup yet', detail: 'The first daily backup runs within a day.', href: `${admin}/backups`, action: 'Back up now' })
  } else if (ageH > 36) {
    checks.push({ status: 'bad', title: 'The last backup is old', detail: `It is from ${Math.round(ageH / 24)} days ago. Check the server log for errors.`, href: `${admin}/backups`, action: 'Open backups' })
  } else {
    checks.push({ status: 'good', title: 'Backups are running', detail: `Last one ${Math.max(1, Math.round(ageH))} hour(s) ago. ${backups.length} kept.` })
  }
  if (last && priv?.offsiteEnabled && last.offsite === 'failed') {
    checks.push({ status: 'bad', title: 'The off-site backup copy failed', detail: last.offsiteError || 'Check the storage keys.', href: `${admin}/globals/private-settings`, action: 'Check settings' })
  } else if (!priv?.offsiteEnabled) {
    checks.push({ status: 'warn', title: 'Backups are only on this server', detail: 'Add an off-site copy so they survive if the server is lost.', href: `${admin}/globals/private-settings`, action: 'Set up' })
  }

  // Disk space where backups live
  try {
    const st = fs.statfsSync(fs.existsSync(backupDir()) ? backupDir() : process.cwd())
    const freeGB = (st.bavail * st.bsize) / 1e9
    const pct = (st.bavail / st.blocks) * 100
    checks.push(
      pct < 10
        ? { status: 'bad', title: 'The server is nearly full', detail: `${freeGB.toFixed(1)} GB free (${pct.toFixed(0)}%). Delete old backups or media, or upgrade the plan.` }
        : { status: 'good', title: 'Disk space', detail: `${freeGB.toFixed(1)} GB free.` },
    )
  } catch {
    /* not available on this system */
  }

  // Email
  const emailSet = Boolean(priv?.smtpHost || process.env.SMTP_HOST)
  const failed = await count(payload, 'email-log', {
    and: [{ status: { equals: 'failed' } }, { createdAt: { greater_than: new Date(Date.now() - 7 * 86_400_000).toISOString() } }],
  })
  if (!emailSet) {
    checks.push({ status: 'bad', title: 'Email is not set up', detail: 'Password resets and form notifications are not being sent.', href: `${admin}/globals/private-settings`, action: 'Set up email' })
  } else if (failed) {
    checks.push({ status: 'bad', title: `${failed} email(s) failed this week`, detail: 'See the reason in the email log.', href: `${admin}/collections/email-log?where[status][equals]=failed`, action: 'Open email log' })
  } else {
    checks.push({ status: 'good', title: 'Email is set up', detail: 'No failed emails this week.' })
  }

  // HTTPS
  const url = getServerSideURL()
  checks.push(
    url.startsWith('https://')
      ? { status: 'good', title: 'Secure connection (HTTPS)', detail: url }
      : { status: 'bad', title: 'The site address is not HTTPS', detail: `The site thinks its address is ${url}. Set DOMAIN or SITE_URL on the server.` },
  )

  // Visibility
  if (settings.discourageSearchEngines) {
    checks.push({ status: 'bad', title: 'Search engines are blocked', detail: 'Google will not list the site.', href: `${admin}/globals/site-settings`, action: 'Change' })
  }
  if (settings.maintenanceMode) {
    checks.push({ status: 'warn', title: 'Maintenance mode is on', detail: 'Visitors see a holding page.', href: `${admin}/globals/site-settings`, action: 'Change' })
  }

  // Security
  const admins = await payload.find({ collection: 'users', where: { role: { equals: 'admin' } }, limit: 100, depth: 0, overrideAccess: true })
  const without = admins.docs.filter((u) => !(u as { twoFactorEnabled?: boolean }).twoFactorEnabled).length
  checks.push(
    without
      ? { status: 'warn', title: `${without} administrator(s) without two-factor login`, detail: 'Turn it on from each account page: it stops anyone with a leaked password.', href: `${admin}/account`, action: 'My account' }
      : { status: 'good', title: 'Every administrator uses two-factor login', detail: '' },
  )
  if (!priv?.turnstileSiteKey || !priv?.turnstileSecret) {
    checks.push({ status: 'warn', title: 'No spam protection on forms', detail: 'Add free Cloudflare Turnstile keys to block bots.', href: `${admin}/globals/private-settings`, action: 'Add keys' })
  }

  // Content
  const broken = await count(payload, 'not-found-log', { and: [{ redirected: { not_equals: true } }, { hits: { greater_than: 1 } }] })
  if (broken) {
    checks.push({ status: 'warn', title: `${broken} broken link(s) visitors keep hitting`, detail: 'Send them to the right page with a redirect.', href: `${admin}/collections/not-found-log`, action: 'Fix' })
  }
  const noAlt = await count(payload, 'media', { and: [{ mimeType: { contains: 'image' } }, { or: [{ alt: { exists: false } }, { alt: { equals: '' } }] }] })
  if (noAlt) {
    checks.push({ status: 'warn', title: `${noAlt} image(s) without alt text`, detail: 'Alt text describes images to blind visitors and to Google.', href: `${admin}/collections/media?where[or][0][alt][exists]=false&where[or][1][alt][equals]=`, action: 'Show them' })
  }
  const noDesc = await count(payload, 'pages', {
    and: [{ _status: { equals: 'published' } }, { or: [{ 'meta.description': { exists: false } }, { 'meta.description': { equals: '' } }] }],
  })
  if (noDesc) {
    checks.push({ status: 'warn', title: `${noDesc} published page(s) without a meta description`, detail: 'Google then picks text itself, often badly.', href: `${admin}/collections/pages`, action: 'Open pages' })
  }

  // Updates
  let current = ''
  try {
    current = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')).version || ''
  } catch {
    /* unknown version */
  }
  const latest = await latestRelease()
  if (latest && current && newer(latest, current)) {
    checks.push({ status: 'warn', title: `UltimaPress ${latest.replace(/^v/, '')} is available`, detail: `You have ${current}.`, href: 'https://github.com/mrwebtv/ultimapress/releases', action: 'See what is new' })
  } else if (latest) {
    checks.push({ status: 'good', title: 'UltimaPress is up to date', detail: current ? `Version ${current}.` : '' })
  }

  return checks
}

const DOT: Record<Status, string> = { good: '#22a06b', warn: '#e2a400', bad: '#e5484d' }

/** Site health (/admin/site-health): one page that says what needs fixing. */
export async function SiteHealthView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  const admin = req.payload.config.routes.admin || '/admin'
  if (!req.user) redirect(`${admin}/login`)
  const allowed = hasRole(req.user, 'admin')
  const checks = allowed ? await runChecks(req.payload, admin) : []
  const order: Status[] = ['bad', 'warn', 'good']
  checks.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
  const problems = checks.filter((c) => c.status !== 'good').length

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <div style={{ maxWidth: 900, padding: '32px 0 64px' }}>
          <h1 style={{ margin: '0 0 8px' }}>Site health</h1>
          <p style={{ color: 'var(--theme-elevation-600)', margin: '0 0 28px', lineHeight: 1.6 }}>
            {allowed ? (problems ? `${problems} thing(s) to look at.` : 'Everything looks good.') : 'Site health is for administrators.'}
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            {checks.map((c, i) => (
              <div
                key={i}
                style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px', border: '1px solid var(--theme-elevation-150)', borderRadius: 10 }}
              >
                <span style={{ flex: 'none', width: 12, height: 12, marginTop: 5, borderRadius: '50%', background: DOT[c.status] }} aria-label={c.status} />
                <div style={{ flex: 1 }}>
                  <strong>{c.title}</strong>
                  {c.detail && <div style={{ color: 'var(--theme-elevation-600)', fontSize: 13, marginTop: 2 }}>{c.detail}</div>}
                </div>
                {c.href && (
                  <a href={c.href} className="btn btn--style-secondary btn--size-small" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                    {c.action || 'Open'}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}

export default SiteHealthView
