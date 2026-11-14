import React from 'react'

import type { DesignBlock as Props } from '@/payload-types'
import { cleanDesignHtml, scopeDesignCss } from '@/utilities/designSafety'

export const DesignBlock: React.FC<Props> = ({ id, html: ownHtml, css: ownCss, fullWidth, synced }) => {
  // A synced section shows the shared version, so one change updates every page.
  const shared = synced && typeof synced === 'object' ? synced : null
  const html = shared?.html ?? ownHtml
  const css = shared ? shared.css : ownCss
  const scopeClass = `up-d-${String(id || 'x').replace(/[^a-zA-Z0-9_-]/g, '')}`
  const style = scopeDesignCss(css, `.${scopeClass}`)
  const body = cleanDesignHtml(html)
  return (
    <section className={fullWidth === false ? 'container' : undefined}>
      {style && <style dangerouslySetInnerHTML={{ __html: style }} />}
      <div className={`up-design ${scopeClass}`} dangerouslySetInnerHTML={{ __html: body }} />
    </section>
  )
}
