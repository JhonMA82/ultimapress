import { APIError, type Endpoint, type Payload, type PayloadRequest } from 'payload'

/** Cloudflare Turnstile: bot protection on forms and comments, when keys are set. */

let cached: { at: number; site: string | null; secret: string | null } | null = null
export const forgetTurnstileKeys = () => {
  cached = null
}

export async function turnstileKeys(payload: Payload) {
  if (cached && Date.now() - cached.at < 60_000) return cached
  let site: string | null = null
  let secret: string | null = null
  try {
    const s = await payload.findGlobal({ slug: 'private-settings', overrideAccess: true, depth: 0 })
    site = s?.turnstileSiteKey?.trim() || null
    secret = s?.turnstileSecret?.trim() || null
  } catch {
    /* not set up yet */
  }
  cached = { at: Date.now(), site: site && secret ? site : null, secret: site && secret ? secret : null }
  return cached
}

/** Throws when Turnstile is on and the visitor's token is missing or wrong. Staff are never checked. */
export async function checkTurnstile(req: PayloadRequest) {
  if (req.user) return
  const { secret } = await turnstileKeys(req.payload)
  if (!secret) return
  const token = String(((req.data || {}) as Record<string, unknown>).turnstileToken || '')
  if (!token) throw new APIError('Please complete the spam check and try again.', 400, null, true)
  const body = new URLSearchParams({ secret, response: token })
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]
  if (ip) body.set('remoteip', ip.trim())
  let ok = false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(8000),
    })
    ok = Boolean(((await res.json()) as { success?: boolean }).success)
  } catch {
    throw new APIError('The spam check could not be reached. Please try again in a moment.', 503, null, true)
  }
  if (!ok) throw new APIError('The spam check failed. Please try again.', 400, null, true)
}

/** GET /api/up/turnstile: the public site key (never the secret), or null when it is off. */
export const turnstileKeyEndpoint: Endpoint = {
  path: '/up/turnstile',
  method: 'get',
  handler: async (req) => {
    const { site } = await turnstileKeys(req.payload)
    return Response.json({ siteKey: site }, { headers: { 'Cache-Control': 'public, max-age=60' } })
  },
}
