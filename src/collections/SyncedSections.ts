import type { CollectionConfig } from 'payload'
import { revalidateTag, revalidatePath } from 'next/cache'

import { isAdminOrEditor } from '../access/roles'
import { cleanDesignHtml } from '../utilities/designSafety'

/**
 * Synced sections: designed once in the visual builder and used on many pages.
 * Changing one updates every page that shows it.
 */
export const SyncedSections: CollectionConfig = {
  slug: 'synced-sections',
  labels: { singular: 'Synced section', plural: 'Synced sections' },
  access: {
    // Shown on public pages, so anyone may read them; only editors change them.
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  admin: {
    group: 'Design',
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
    description: 'Sections used on several pages. Edit one in the visual builder and every page updates.',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'html',
      label: 'HTML',
      type: 'code',
      required: true,
      admin: { language: 'html' },
      hooks: { beforeChange: [({ value }) => cleanDesignHtml(value)] },
    },
    { name: 'css', label: 'CSS', type: 'code', admin: { language: 'css' } },
  ],
  hooks: {
    afterChange: [
      ({ doc, req: { context } }) => {
        if (!context.disableRevalidate) {
          // Every page may show it: refresh the whole site's pages.
          revalidatePath('/', 'layout')
          revalidateTag('global_header', 'max')
        }
        return doc
      },
    ],
  },
  timestamps: true,
}
