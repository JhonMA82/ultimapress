import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import type { LoopGridBlock as Props } from '@/payload-types'

import { NOT_GRIDDABLE, toCard } from './cards'
import { GridClient } from './Grid.client'

export const LoopGridBlock: React.FC<Props> = async ({ heading, collection, limit, showFilter, loadMore }) => {
  const payload = await getPayload({ config: configPromise })
  const config = payload.config.collections.find((c) => c.slug === collection)
  if (!config || NOT_GRIDDABLE.has(config.slug)) return null

  const perPage = Math.min(Math.max(Number(limit) || 6, 1), 48)
  const result = await payload
    .find({ collection: config.slug as 'posts', limit: perPage, depth: 1, sort: '-createdAt', overrideAccess: false })
    .catch(() => null)
  if (!result) return null

  const hasCategories = config.fields.some((f) => 'name' in f && f.name === 'categories')
  const categories =
    showFilter && hasCategories
      ? await payload
          .find({ collection: 'categories', limit: 50, depth: 0, overrideAccess: false })
          .then((r) => r.docs.map((c) => ({ id: String(c.id), title: String(c.title) })))
          .catch(() => [])
      : []

  return (
    <section className="container">
      {heading && <h2 className="up-heading mb-8 text-3xl font-bold md:text-4xl">{heading}</h2>}
      <GridClient
        collection={config.slug}
        limit={perPage}
        initial={result.docs.map((d) => toCard(config.slug, d as unknown as Record<string, unknown>))}
        hasMore={result.hasNextPage}
        loadMore={loadMore !== false}
        categories={categories}
      />
    </section>
  )
}
