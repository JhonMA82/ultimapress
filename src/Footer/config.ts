import type { GlobalConfig } from 'payload'

import { designedChromeFields } from '@/fields/designedChrome'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer Menu',
  admin: {
    group: 'Design',
    components: {
      elements: {
        beforeDocumentControls: ['@/components/admin/VisualBuilder/OpenButton#OpenButton'],
      },
    },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
    {
      name: 'about',
      type: 'textarea',
      admin: { description: 'One or two sentences about the business, shown under the logo.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'text' },
      ],
    },
    { name: 'address', type: 'textarea' },
    {
      name: 'hours',
      type: 'textarea',
      label: 'Opening hours',
      admin: { description: 'One line per day or range, e.g. Mon to Fri: 9am to 6pm' },
    },
    {
      name: 'social',
      type: 'array',
      label: 'Social links',
      maxRows: 6,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'platform',
              type: 'select',
              required: true,
              options: ['Facebook', 'Instagram', 'X', 'LinkedIn', 'YouTube', 'TikTok', 'WhatsApp'],
            },
            { name: 'url', type: 'text', required: true },
          ],
        },
      ],
    },
    ...designedChromeFields('footer'),
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
