import React from 'react'

import { cleanDesignHtml, scopeDesignCss } from '@/utilities/designSafety'

/** A header or footer designed in the visual builder. */
export function DesignedChrome({ as, html, css }: { as: 'header' | 'footer'; html?: string | null; css?: string | null }) {
  const scope = `up-d-${as}`
  const Tag = as
  const style = scopeDesignCss(css, `.${scope}`)
  return (
    <Tag className={`up-design ${scope}${as === 'footer' ? ' mt-auto' : ''}`}>
      {style && <style dangerouslySetInnerHTML={{ __html: style }} />}
      <div dangerouslySetInnerHTML={{ __html: cleanDesignHtml(html) }} />
    </Tag>
  )
}
