import type { GlobalConfig } from 'payload'

import { designedChromeFields } from '@/fields/designedChrome'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Header Menu',
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
        {
          name: 'children',
          label: 'Sub-menu items',
          type: 'array',
          fields: [
            link({
              appearances: false,
            }),
          ],
          admin: {
            initCollapsed: true,
          },
        },
      ],
      maxRows: 12,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
    {
      name: 'button',
      type: 'group',
      label: 'Header button',
      admin: { description: 'A highlighted button at the end of the menu, e.g. "Book now".' },
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text', admin: { description: 'e.g. /contact or /#book' } },
      ],
    },
    ...designedChromeFields('header'),
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
