import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/roles'

/** Who changed what and when, kept 180 days. Written by src/security/activityLog.ts. */
export const ActivityLog: CollectionConfig = {
  slug: 'activity-log',
  labels: { singular: 'Activity', plural: 'Activity log' },
  admin: {
    group: 'Settings',
    useAsTitle: 'summary',
    defaultColumns: ['summary', 'who', 'createdAt'],
    description: 'Logins and changes from the last 180 days.',
  },
  defaultSort: '-createdAt',
  access: { create: () => false, read: isAdmin, update: () => false, delete: () => false },
  fields: [
    { name: 'summary', type: 'text' },
    { name: 'who', type: 'text' },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    {
      name: 'action',
      type: 'select',
      options: ['created', 'updated', 'deleted', 'published', 'logged in', 'security'].map((v) => ({ label: v, value: v })),
    },
    { name: 'area', type: 'text' },
    { name: 'docId', type: 'text' },
    { name: 'ip', type: 'text', admin: { description: 'Only for logins.' } },
  ],
}
