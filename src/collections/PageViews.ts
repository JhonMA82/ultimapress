import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/roles'

/**
 * One row per page view, for the built-in analytics. No cookies and no personal data:
 * "visitor" is a code made from the day, the address and the browser that cannot be
 * turned back into either, and changes every day. Rows are deleted after the
 * retention period in Site Settings > Analytics.
 */
export const PageViews: CollectionConfig = {
  slug: 'page-views',
  labels: { singular: 'Page view', plural: 'Page views' },
  admin: { hidden: true, group: 'Grow' },
  access: {
    // Written only by the /api/up/hit endpoint (with overrideAccess).
    create: () => false,
    read: isAdmin,
    update: () => false,
    delete: isAdmin,
  },
  timestamps: true,
  fields: [
    { name: 'day', type: 'text', required: true, index: true },
    { name: 'path', type: 'text', required: true, index: true },
    { name: 'referrer', type: 'text', index: true },
    { name: 'device', type: 'text' },
    { name: 'browser', type: 'text' },
    { name: 'country', type: 'text' },
    { name: 'visitor', type: 'text', index: true },
  ],
}
