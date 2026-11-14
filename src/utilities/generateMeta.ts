import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'
import { getSiteSettings } from './getSiteSettings'

const imageURL = (image?: Media | Config['db']['defaultIDType'] | null): string | null => {
  if (image && typeof image === 'object' && 'url' in image) {
    const url = image.sizes?.og?.url || image.url
    if (!url) return null
    return /^https?:\/\//i.test(url) ? url : getServerSideURL() + url
  }
  return null
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
  /** Path of the document on the site, e.g. "/about" or "/posts/hello". */
  path?: string
}): Promise<Metadata> => {
  const { doc } = args
  const settings = await getSiteSettings()
  const meta = doc?.meta

  const ogImage =
    imageURL(meta?.image) ||
    imageURL(settings.defaultShareImage as Media | null) ||
    getServerSideURL() + '/og-default.webp'

  // The site name is appended by the title template in the root layout.
  const title = meta?.title || doc?.title || undefined
  // The homepage keeps the layout's default "Site title | Tagline".
  const isHome = doc?.slug === 'home'
  const path = args.path ?? (isHome ? '/' : doc?.slug ? `/${doc.slug}` : '/')
  const description = meta?.description || undefined

  const canonical = meta?.canonicalURL?.trim() || path
  const hidden = Boolean(meta?.noindex) || Boolean(settings.discourageSearchEngines)

  return {
    ...(description ? { description } : {}),
    alternates: { canonical },
    ...(hidden ? { robots: { index: false, follow: true } } : {}),
    openGraph: mergeOpenGraph({
      description: meta?.ogDescription || description || '',
      images: [{ url: ogImage }],
      ...(meta?.ogTitle || title ? { title: meta?.ogTitle || title } : {}),
      url: path,
      ...(doc && 'content' in doc ? { type: 'article' } : {}),
    }),
    twitter: {
      card: 'summary_large_image',
      ...(meta?.ogTitle || title ? { title: meta?.ogTitle || title } : {}),
      ...(meta?.ogDescription || description ? { description: meta?.ogDescription || description } : {}),
      images: [ogImage],
    },
    ...(title && !isHome ? { title } : {}),
  }
}
