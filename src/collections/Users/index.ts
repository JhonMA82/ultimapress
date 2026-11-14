import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { isAdmin, isAdminFieldLevel, isAdminOrSelf } from '../../access/roles'
import { noLoginAfterReset, requireTwoFactor } from '../../security/twoFactor'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    // The very first user (created on the setup screen) is always allowed and becomes admin.
    create: async ({ req }) => {
      if (req.user) return isAdmin({ req })
      const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true })
      return totalDocs === 0
    },
    delete: isAdmin,
    read: authenticated,
    update: isAdminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
    group: 'Settings',
  },
  auth: {
    // Five wrong passwords lock the account for 15 minutes.
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'author',
      saveToJWT: true,
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Author', value: 'author' },
      ],
      access: {
        update: isAdminFieldLevel,
      },
      admin: {
        position: 'sidebar',
        description:
          'Administrator: everything. Editor: all content. Author: their own posts and media.',
      },
    },
    {
      name: 'photo',
      label: 'Profile photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'menuStyle',
      label: 'Menu style',
      type: 'select',
      defaultValue: 'spine',
      options: [
        { label: 'Spine', value: 'spine' },
        { label: 'Sidebar', value: 'sidebar' },
      ],
      admin: {
        position: 'sidebar',
        isClearable: false,
        description: 'How your admin menu looks. Spine is the line with a point per section; Sidebar is the classic list down the left.',
      },
    },
    // Two-factor login: changed only through /api/up/2fa/*, never through a normal save.
    {
      name: 'twoFactorEnabled',
      type: 'checkbox',
      defaultValue: false,
      access: { create: () => false, update: () => false },
      admin: { hidden: true },
    },
    {
      name: 'twoFactorSecret',
      type: 'text',
      hidden: true,
      access: { read: () => false, create: () => false, update: () => false },
    },
    {
      name: 'twoFactorPending',
      type: 'text',
      hidden: true,
      access: { read: () => false, create: () => false, update: () => false },
    },
    {
      name: 'twoFactor',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/TwoFactor/Setup.client#TwoFactorSetup' } },
    },
  ],
  hooks: {
    beforeLogin: [requireTwoFactor],
    afterOperation: [noLoginAfterReset],
    beforeChange: [
      // The first account ever created is the site administrator.
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({
            collection: 'users',
            overrideAccess: true,
          })
          if (totalDocs === 0) data.role = 'admin'
        }
        return data
      },
    ],
  },
  timestamps: true,
}
