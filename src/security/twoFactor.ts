import { APIError, type CollectionAfterOperationHook, type CollectionBeforeLoginHook, type Endpoint } from 'payload'
import QRCode from 'qrcode'

import { clearMisses, markUsed, newSecret, otpauthURL, recordMiss, tooManyMisses, verifyCode } from './totp'

type TwoFactorUser = {
  id: number | string
  email?: string
  twoFactorEnabled?: boolean | null
  twoFactorSecret?: string | null
  twoFactorPending?: string | null
}

const codeFrom = (req: Parameters<CollectionBeforeLoginHook>[0]['req']) => {
  const fromBody = (req.data as { totp?: unknown } | undefined)?.totp
  const fromHeader = req.headers.get('x-up-2fa')
  return String(fromBody || fromHeader || '').replace(/\D/g, '')
}

/** At login: accounts with two-factor on need a valid 6-digit code as well as the password. */
export const requireTwoFactor: CollectionBeforeLoginHook = async ({ user, req }) => {
  const u = user as TwoFactorUser
  if (!u.twoFactorEnabled || !u.twoFactorSecret) return user
  if (tooManyMisses(u.id)) throw new APIError('Too many wrong codes. Try again in 15 minutes.', 429, null, true)
  const code = codeFrom(req)
  if (!code) throw new APIError('Enter the 6-digit code from your authenticator app.', 401, null, true)
  if (!verifyCode(u.twoFactorSecret, code) || !markUsed(u.id, code)) {
    recordMiss(u.id)
    throw new APIError('That code is not right. Use the newest code from your authenticator app.', 401, null, true)
  }
  clearMisses(u.id)
  return user
}

/** Resetting a password must not log straight in, or it would skip the two-factor code. */
export const noLoginAfterReset: CollectionAfterOperationHook = async ({ operation, result }) => {
  if (operation === 'resetPassword' && result && typeof result === 'object' && 'token' in result) {
    const r = result as { token?: string; user?: TwoFactorUser }
    if (r.user?.twoFactorEnabled) delete r.token
  }
  return result
}

const own = async (req: Parameters<Endpoint['handler']>[0]) => {
  if (!req.user || (req.user as { collection?: string }).collection !== 'users') return null
  return (await req.payload.findByID({
    collection: 'users',
    id: req.user.id,
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
  })) as unknown as TwoFactorUser
}

const json = async (req: Parameters<Endpoint['handler']>[0]) => {
  try {
    return (await req.json?.()) || {}
  } catch {
    return {}
  }
}

/** Set up, confirm and turn off two-factor login for your own account. */
export const twoFactorEndpoints: Endpoint[] = [
  {
    path: '/up/2fa/setup',
    method: 'post',
    handler: async (req) => {
      const me = await own(req)
      if (!me) return Response.json({ error: 'Log in first' }, { status: 401 })
      const secret = newSecret()
      await req.payload.update({
        collection: 'users',
        id: me.id,
        data: { twoFactorPending: secret },
        overrideAccess: true,
        depth: 0,
        req,
        context: { activityLog: false },
      })
      const url = otpauthURL(secret, me.email || String(me.id), req.payload.config.admin?.meta?.titleSuffix?.replace(/^[-\s]+/, '') || 'UltimaPress')
      const qr = await QRCode.toDataURL(url, { margin: 1, width: 220 })
      return Response.json({ qr, secret })
    },
  },
  {
    path: '/up/2fa/confirm',
    method: 'post',
    handler: async (req) => {
      const me = await own(req)
      if (!me) return Response.json({ error: 'Log in first' }, { status: 401 })
      const { code } = (await json(req)) as { code?: string }
      if (!me.twoFactorPending) return Response.json({ error: 'Start the setup again.' }, { status: 400 })
      if (!verifyCode(me.twoFactorPending, String(code || ''))) {
        return Response.json({ error: 'That code is not right. Check the time on your phone and try the newest code.' }, { status: 400 })
      }
      await req.payload.update({
        collection: 'users',
        id: me.id,
        data: { twoFactorEnabled: true, twoFactorSecret: me.twoFactorPending, twoFactorPending: null },
        overrideAccess: true,
        depth: 0,
        req,
        context: { activityAction: 'turned on two-factor login' },
      })
      return Response.json({ ok: true })
    },
  },
  {
    path: '/up/2fa/disable',
    method: 'post',
    handler: async (req) => {
      const me = await own(req)
      if (!me) return Response.json({ error: 'Log in first' }, { status: 401 })
      const { code, userId } = (await json(req)) as { code?: string; userId?: number | string }
      const isAdmin = (req.user as { role?: string }).role === 'admin'
      // An administrator can switch it off for someone who lost their phone.
      if (userId && String(userId) !== String(me.id)) {
        if (!isAdmin) return Response.json({ error: 'Administrators only' }, { status: 403 })
        await req.payload.update({
          collection: 'users',
          id: userId,
          data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorPending: null },
          overrideAccess: true,
          depth: 0,
          req,
          context: { activityAction: 'turned off two-factor login for another user' },
        })
        return Response.json({ ok: true })
      }
      if (!me.twoFactorSecret || !verifyCode(me.twoFactorSecret, String(code || ''))) {
        return Response.json({ error: 'Enter a current code from your authenticator app to turn it off.' }, { status: 400 })
      }
      await req.payload.update({
        collection: 'users',
        id: me.id,
        data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorPending: null },
        overrideAccess: true,
        depth: 0,
        req,
        context: { activityAction: 'turned off two-factor login' },
      })
      return Response.json({ ok: true })
    },
  },
]
