import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access/roles'
import { cleanDesignHtml } from '../utilities/designSafety'

/** Sections saved from the visual builder, to reuse on other pages ("My templates"). */
export const SectionTemplates: CollectionConfig = {
  slug: 'section-templates',
  labels: { singular: 'Section template', plural: 'Section templates' },
  access: {
    read: isAdminOrEditor,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  admin: {
    group: 'Design',
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
    description: 'Sections you saved in the visual builder. They appear under Templates, My templates.',
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
  timestamps: true,
}
