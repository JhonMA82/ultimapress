import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'

import { isAdmin } from '../access/roles'
import { forgetEmailSettings } from '../email/adapter'
import { forgetTurnstileKeys } from '../security/turnstile'

/**
 * Settings that hold passwords and keys: email (SMTP), spam protection and backups.
 * Administrators only, and never readable by visitors (unlike Site Settings).
 */
export const PrivateSettings: GlobalConfig = {
  slug: 'private-settings',
  label: 'Email, backups and keys',
  admin: {
    group: 'Settings',
    description: 'Passwords and keys stay on your server and are only visible to administrators.',
  },
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Email',
          description:
            'How the site sends email: password resets, form notifications, comment alerts. Use the SMTP details from your email provider (Hostinger Mail, Google Workspace, Brevo, Postmark…).',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'smtpHost', label: 'SMTP server', type: 'text', admin: { width: '50%', placeholder: 'smtp.hostinger.com' } },
                { name: 'smtpPort', label: 'Port', type: 'number', defaultValue: 465, admin: { width: '25%' } },
                {
                  name: 'smtpSecurity',
                  label: 'Security',
                  type: 'select',
                  defaultValue: 'auto',
                  options: [
                    { label: 'Automatic', value: 'auto' },
                    { label: 'SSL/TLS', value: 'ssl' },
                    { label: 'STARTTLS', value: 'starttls' },
                  ],
                  admin: { width: '25%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'smtpUser', label: 'Username', type: 'text', admin: { width: '50%' } },
                {
                  name: 'smtpPass',
                  label: 'Password',
                  type: 'text',
                  admin: { width: '50%', components: { Field: '@/components/admin/SecretField#SecretField' } },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'fromAddress', label: 'Send from (email)', type: 'email', admin: { width: '50%' } },
                { name: 'fromName', label: 'Send from (name)', type: 'text', admin: { width: '50%' } },
              ],
            },
            {
              name: 'emailTest',
              type: 'ui',
              admin: { components: { Field: '@/components/admin/EmailTest#EmailTest' } },
            },
          ],
        },
        {
          label: 'Spam protection',
          description:
            'Cloudflare Turnstile stops bots on your forms and comments without puzzles for real people. Free: create a widget at dash.cloudflare.com > Turnstile and paste both keys here.',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'turnstileSiteKey', label: 'Site key', type: 'text', admin: { width: '50%' } },
                {
                  name: 'turnstileSecret',
                  label: 'Secret key',
                  type: 'text',
                  admin: { width: '50%', components: { Field: '@/components/admin/SecretField#SecretField' } },
                },
              ],
            },
          ],
        },
        {
          label: 'Backups',
          description:
            'Your content and media are backed up every day on the server. See and restore them under Settings > Backups.',
          fields: [
            { name: 'backupsEnabled', label: 'Daily backups', type: 'checkbox', defaultValue: true },
            {
              type: 'row',
              fields: [
                {
                  name: 'backupHour',
                  label: 'Time of day (server time, 0-23)',
                  type: 'number',
                  defaultValue: 3,
                  min: 0,
                  max: 23,
                  admin: { width: '33%' },
                },
                { name: 'backupKeepDays', label: 'Keep for (days)', type: 'number', defaultValue: 30, min: 3, max: 365, admin: { width: '33%' } },
                { name: 'backupMedia', label: 'Include images and files', type: 'checkbox', defaultValue: true, admin: { width: '33%', style: { alignSelf: 'flex-end' } } },
              ],
            },
            {
              type: 'collapsible',
              label: 'Off-site copy (optional)',
              admin: {
                initCollapsed: true,
                description:
                  'Also send each backup to S3-compatible storage (Cloudflare R2, Backblaze B2, Amazon S3, Wasabi…), so a copy survives even if the server is lost.',
              },
              fields: [
                { name: 'offsiteEnabled', label: 'Send backups off-site', type: 'checkbox', defaultValue: false },
                {
                  type: 'row',
                  fields: [
                    { name: 's3Endpoint', label: 'Endpoint', type: 'text', admin: { width: '50%', placeholder: 'https://<account>.r2.cloudflarestorage.com' } },
                    { name: 's3Region', label: 'Region', type: 'text', defaultValue: 'auto', admin: { width: '25%' } },
                    { name: 's3Bucket', label: 'Bucket', type: 'text', admin: { width: '25%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 's3AccessKey', label: 'Access key ID', type: 'text', admin: { width: '50%' } },
                    {
                      name: 's3SecretKey',
                      label: 'Secret access key',
                      type: 'text',
                      admin: { width: '50%', components: { Field: '@/components/admin/SecretField#SecretField' } },
                    },
                  ],
                },
                { name: 's3Prefix', label: 'Folder in the bucket', type: 'text', defaultValue: 'ultimapress-backups' },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      ({ doc, req: { context } }) => {
        forgetEmailSettings()
        forgetTurnstileKeys()
        if (!context.disableRevalidate) revalidateTag('global_private-settings', 'max')
        return doc
      },
    ],
  },
}
