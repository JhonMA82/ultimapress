import React from 'react'

import type { EmbedBlock as Props } from '@/payload-types'
import { toEmbedURL } from '@/utilities/embed'

export { toEmbedURL }

export const EmbedBlock: React.FC<Props> = ({ url, caption }) => {
  const src = url ? toEmbedURL(url) : null
  if (!src) return null
  return (
    <figure className="container max-w-4xl">
      <div className="relative w-full overflow-hidden rounded-[var(--radius)] aspect-video bg-card">
        <iframe
          src={src}
          title={caption || 'Embedded content'}
          className="absolute inset-0 w-full h-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  )
}
