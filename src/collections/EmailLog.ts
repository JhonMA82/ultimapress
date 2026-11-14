import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/roles'

/** Every email the site tried to send, kept 90 days: shows when form notifications fail. */
export const EmailLog: CollectionConfig = {
  slug: 'email-log',
  labels: { singular: 'Email', plural: 'Email log' },
  admin: {
    group: 'Settings',
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'to', 'status', 'createdAt'],
    description: 'Emails the site sent in the last 90 days. Set up sending under Email, backups and keys.',
  },
  defaultSort: '-createdAt',
  access: { create: () => false, read: isAdmin, update: () => false, delete: isAdmin },
  fields: [
    { name: 'subject', type: 'text' },
    { name: 'to', type: 'text' },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
        { label: 'Not sent (no email set up)', value: 'logged' },
      ],
    },
    { name: 'error', type: 'textarea' },
  ],
}
