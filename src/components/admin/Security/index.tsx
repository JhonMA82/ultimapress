import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { hasRole } from '@/access/roles'
import { securityState, type SecurityState } from '@/endpoints/security'

import { SecurityReport } from './Report.client'

/** Security (/admin/security): the security check of the site's code and packages. */
export async function SecurityView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  const admin = req.payload.config.routes.admin || '/admin'
  if (!req.user) redirect(`${admin}/login`)
  const allowed = hasRole(req.user, 'admin')
  let initial: SecurityState = { live: null, refused: null }
  let error = ''
  if (allowed) {
    try {
      initial = await securityState()
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }
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
        <div style={{ maxWidth: 1000, padding: '32px 0 64px' }}>
          <h1 style={{ margin: '0 0 8px' }}>Security</h1>
          <p style={{ color: 'var(--theme-elevation-600)', margin: '0 0 28px', lineHeight: 1.6, maxWidth: 720 }}>
            Every new version of your site’s code is checked for security problems before it goes live. A critical
            problem stops the update, and the current version keeps running. The live version and its packages are
            also checked once a day.
          </p>
          {allowed ? (
            <SecurityReport initial={initial} initialError={error} />
          ) : (
            <p>The security check is for administrators.</p>
          )}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}

export default SecurityView
