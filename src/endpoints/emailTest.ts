import type { Endpoint } from 'payload'

import { hasRole } from '@/access/roles'
import { forgetEmailSettings } from '@/email/adapter'

/** POST /api/up/email-test: sends a test email to the logged-in administrator. */
export const emailTestEndpoint: Endpoint = {
  path: '/up/email-test',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user, 'admin')) return Response.json({ error: 'Administrators only' }, { status: 403 })
    const to = (req.user as { email?: string }).email
    if (!to) return Response.json({ error: 'Your account has no email address' }, { status: 400 })
    forgetEmailSettings()
    try {
      const result = (await req.payload.sendEmail({
        to,
        subject: 'Test email from your UltimaPress site',
        html: '<p>It works. Your site can send email.</p><p>This was sent from Settings &gt; Email, backups and keys.</p>',
      })) as { logged?: boolean } | undefined
      if (result && result.logged) {
        return Response.json({ error: 'No email server is set up yet, so nothing was sent. Fill in the SMTP details and save.' }, { status: 400 })
      }
      return Response.json({ message: `Sent to ${to}. Check your inbox (and spam folder).` })
    } catch (err) {
      return Response.json({ error: `Sending failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 502 })
    }
  },
}
