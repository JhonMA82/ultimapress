'use client'

import { useConfig, useDocumentInfo } from '@payloadcms/ui'
import React from 'react'

/** "Visual builder" button next to Save/Publish on a page, the header and the footer. */
export function OpenButton() {
  const { id, globalSlug } = useDocumentInfo()
  const { config } = useConfig()
  const admin = config.routes?.admin || '/admin'
  const target = globalSlug
    ? globalSlug === 'header' || globalSlug === 'footer'
      ? `global=${globalSlug}`
      : null
    : id
      ? `page=${encodeURIComponent(String(id))}`
      : null
  if (!target) return null
  return (
    <a
      href={`${admin}/visual-builder?${target}`}
      className="btn btn--style-secondary btn--size-medium"
      style={{ marginRight: 8, textDecoration: 'none' }}
      title="Edit visually: drag and drop, click to edit, style anything"
    >
      Visual builder
    </a>
  )
}

export default OpenButton
