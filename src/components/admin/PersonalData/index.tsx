import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { hasRole } from '@/access/roles'

import { PersonalDataTool } from './Tool.client'

/** Personal data requests (/admin/personal-data): GDPR export and deletion for one person. */
export function PersonalDataView({ initPageResult, params, searchParams }: AdminViewServerProps) {
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
        <div style={{ maxWidth: 820, padding: '32px 0 64px' }}>
          <h1 style={{ margin: '0 0 8px' }}>Personal data requests</h1>
          <p style={{ color: 'var(--theme-elevation-600)', margin: '0 0 28px', lineHeight: 1.6 }}>
            Under GDPR, anyone can ask what you hold about them, or ask you to delete it. Enter their email address to
            see their comments, form entries and account, download it all as a file to send them, or delete it.
          </p>
          {hasRole(req.user, 'admin') ? <PersonalDataTool admin={admin} /> : <p>This page is for administrators.</p>}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}

export default PersonalDataView
