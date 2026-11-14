import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../access/roles'

/** Addresses visitors tried that do not exist (404s), so they can be redirected. */
export const NotFoundLog: CollectionConfig = {
  slug: 'not-found-log',
  labels: { singular: 'Broken link', plural: 'Broken links (404)' },
  admin: {
    group: 'Grow',
    useAsTitle: 'path',
    defaultColumns: ['path', 'hits', 'lastSeen', 'lastReferrer', 'redirected'],
    description:
      'Addresses visitors tried that do not exist on your site. Open one to send its visitors to the right page.',
  },
  defaultSort: '-hits',
  access: {
    // Written only by the /api/up/404 endpoint (with overrideAccess).
    create: () => false,
    read: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  fields: [
    { name: 'path', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'hits', type: 'number', defaultValue: 1, admin: { readOnly: true } },
    { name: 'lastSeen', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'lastReferrer', label: 'Came from', type: 'text', admin: { readOnly: true } },
    { name: 'redirected', type: 'checkbox', defaultValue: false, admin: { readOnly: true } },
    {
      name: 'fix',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/NotFoundFix#NotFoundFix' } },
    },
  ],
}
