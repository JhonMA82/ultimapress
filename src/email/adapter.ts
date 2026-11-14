import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import type { EmailAdapter, Payload, SendEmailOptions } from 'payload'

/**
 * Email that follows Settings > Email, backups and keys, so owners set up SMTP in the
 * admin instead of in server files. Falls back to the SMTP_* environment variables,
 * then to writing the email to the server log. Every attempt goes in the Email log.
 */

type Smtp = {
  host: string
  port: number
  secure: boolean
  user?: string
  pass?: string
  fromAddress: string
  fromName: string
}

let cached: { at: number; smtp: Smtp | null } | null = null
export const forgetEmailSettings = () => {
  cached = null
}

async function smtpSettings(payload: Payload): Promise<Smtp | null> {
  if (cached && Date.now() - cached.at < 60_000) return cached.smtp
  let smtp: Smtp | null = null
  try {
    const s = await payload.findGlobal({ slug: 'private-settings', overrideAccess: true, depth: 0 })
    if (s?.smtpHost) {
      const port = Number(s.smtpPort) || 465
      smtp = {
        host: s.smtpHost.trim(),
        port,
        secure: s.smtpSecurity === 'ssl' || (s.smtpSecurity !== 'starttls' && port === 465),
        user: s.smtpUser || undefined,
        pass: s.smtpPass || undefined,
        fromAddress: s.fromAddress || s.smtpUser || 'no-reply@example.com',
        fromName: s.fromName || 'UltimaPress',
      }
    }
  } catch {
    /* settings table not there yet (first start) */
  }
  if (!smtp && process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587)
    smtp = {
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      user: process.env.SMTP_USER || undefined,
      pass: process.env.SMTP_PASS || undefined,
      fromAddress: process.env.SMTP_FROM_ADDRESS || 'no-reply@example.com',
      fromName: process.env.SMTP_FROM_NAME || 'UltimaPress',
    }
  }
  cached = { at: Date.now(), smtp }
  return smtp
}

const addresses = (to: SendEmailOptions['to']): string => {
  const list = Array.isArray(to) ? to : to ? [to] : []
  return list
    .map((t) => (typeof t === 'string' ? t : t && 'address' in t ? t.address : ''))
    .filter(Boolean)
    .join(', ')
    .slice(0, 300)
}

async function logEmail(payload: Payload, message: SendEmailOptions, status: 'sent' | 'failed' | 'logged', error?: string) {
  try {
    await payload.create({
      collection: 'email-log',
      data: { subject: String(message.subject || '(no subject)').slice(0, 200), to: addresses(message.to), status, error: error?.slice(0, 2000) },
      overrideAccess: true,
      depth: 0,
    })
    // Keep 90 days.
    if (Math.random() < 0.05) {
      await payload.delete({
        collection: 'email-log',
        where: { createdAt: { less_than: new Date(Date.now() - 90 * 86_400_000).toISOString() } },
        overrideAccess: true,
      })
    }
  } catch {
    /* logging must never stop an email */
  }
}

export const settingsEmailAdapter = (): EmailAdapter => ({ payload }) => ({
  name: 'ultimapress-email',
  defaultFromAddress: process.env.SMTP_FROM_ADDRESS || 'no-reply@example.com',
  defaultFromName: process.env.SMTP_FROM_NAME || 'UltimaPress',
  sendEmail: async (message: SendEmailOptions) => {
    const smtp = await smtpSettings(payload)
    if (!smtp) {
      payload.logger.info({ msg: 'Email not sent (no email set up). It would have been:', to: addresses(message.to), subject: message.subject })
      await logEmail(payload, message, 'logged')
      return { logged: true }
    }
    try {
      const adapter = await nodemailerAdapter({
        defaultFromAddress: smtp.fromAddress,
        defaultFromName: smtp.fromName,
        skipVerify: true,
        transportOptions: {
          host: smtp.host,
          port: smtp.port,
          secure: smtp.secure,
          auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
          connectionTimeout: 15_000,
          greetingTimeout: 15_000,
        },
      })
      const from = message.from || `"${smtp.fromName.replace(/"/g, '')}" <${smtp.fromAddress}>`
      const result = await adapter({ payload }).sendEmail({ ...message, from })
      await logEmail(payload, message, 'sent')
      return result
    } catch (err) {
      await logEmail(payload, message, 'failed', err instanceof Error ? err.message : String(err))
      throw err
    }
  },
})
