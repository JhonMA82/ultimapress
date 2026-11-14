import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { hasRole } from '@/access/roles'
import { listBackups } from '@/siteBackups'

import { BackupList } from './List.client'

/** Backups (/admin/backups): daily backups of content and media, download and restore. */
export function BackupsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  const admin = req.payload.config.routes.admin || '/admin'
  if (!req.user) redirect(`${admin}/login`)
  const allowed = hasRole(req.user, 'admin')
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
        <div style={{ maxWidth: 1100, padding: '32px 0 64px' }}>
          <h1 style={{ margin: '0 0 8px' }}>Backups</h1>
          <p style={{ color: 'var(--theme-elevation-600)', margin: '0 0 28px', lineHeight: 1.6, maxWidth: 720 }}>
            Your content and images are backed up every day and kept on your server. Change the time, how long they are
            kept, or add an off-site copy in{' '}
            <a href={`${admin}/globals/private-settings`}>Email, backups and keys</a>.
          </p>
          {allowed ? <BackupList initial={listBackups()} /> : <p>Backups are for administrators.</p>}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}

export default BackupsView
