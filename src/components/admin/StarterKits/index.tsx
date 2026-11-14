import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { hasRole } from '@/access/roles'

import { StarterKitsClient } from './Kits.client'

/** Starter kits (/admin/starter-kits): a set of designed pages and a look, created in one go. */
export function StarterKitsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  const admin = req.payload.config.routes.admin || '/admin'
  if (!req.user) redirect(`${admin}/login`)

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <div style={{ maxWidth: 980, padding: '32px 0 64px' }}>
          <h1 style={{ margin: '0 0 8px' }}>Starter kits</h1>
          <p style={{ color: 'var(--up-muted)', margin: '0 0 32px', maxWidth: 640, lineHeight: 1.6 }}>
            Pick a kit to create a set of designed pages as drafts, ready to fill in with your own words and photos in the
            visual builder. Nothing is published until you publish it, and existing pages are never changed.
          </p>
          {hasRole(req.user, 'admin', 'editor') ? (
            <StarterKitsClient admin={admin} />
          ) : (
            <p>Starter kits are for administrators and editors.</p>
          )}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}

export default StarterKitsView
