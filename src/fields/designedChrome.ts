import type { Field, FieldAccess } from 'payload'

import { hasRole } from '@/access/roles'
import { cleanDesignHtml } from '@/utilities/designSafety'

const editorsOnly: FieldAccess = ({ req: { user } }) => hasRole(user, 'admin', 'editor')

/** A header or footer designed in the visual builder, used instead of the standard one when switched on. */
export const designedChromeFields = (what: 'header' | 'footer'): Field[] => [
  {
    name: 'designed',
    label: `Use the ${what} designed in the visual builder`,
    type: 'checkbox',
    defaultValue: false,
    admin: {
      description: `Open the visual builder from this screen to design your own ${what}. Untick to go back to the standard one.`,
    },
  },
  {
    name: 'designHtml',
    label: `Designed ${what}: HTML`,
    type: 'code',
    admin: { language: 'html', condition: (data) => Boolean(data?.designed) },
    access: { create: editorsOnly, update: editorsOnly },
    hooks: { beforeChange: [({ value }) => cleanDesignHtml(value)] },
  },
  {
    name: 'designCss',
    label: `Designed ${what}: CSS`,
    type: 'code',
    admin: { language: 'css', condition: (data) => Boolean(data?.designed) },
    access: { create: editorsOnly, update: editorsOnly },
  },
]
