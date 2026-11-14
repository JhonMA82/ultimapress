import React from 'react'

import type { Footer, Media, Page, Post, SiteSetting, User } from '@/payload-types'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { getServerSideURL } from '@/utilities/getURL'
import { mediaURL } from '@/utilities/getSiteSettings'

type Json = Record<string, unknown>

/** A <script type="application/ld+json">, safe against "</script>" inside the data. */
export function JsonLd({ data }: { data: Json | Json[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}

const absolute = (url: string | null | undefined) => {
  if (!url) return undefined
  return /^https?:\/\//i.test(url) ? url : `${getServerSideURL()}${url.startsWith('/') ? '' : '/'}${url}`
}

const lines = (text?: string | null) =>
  (text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

/** The site owner as schema.org data: business details come from Site Settings and the footer. */
async function organisation(settings: SiteSetting): Promise<Json> {
  let footer: Partial<Footer> = {}
  try {
    footer = (await getCachedGlobal('footer', 1)()) as Footer
  } catch {
    /* no database while building: settings only */
  }
  const site = getServerSideURL()
  const type = settings.businessType || 'Organization'
  const isPerson = type === 'Person'
  const isLocal = !['Organization', 'Person'].includes(type)
  const address = lines(footer.address)
  const sameAs = (footer.social || []).map((s) => s.url).filter((u) => /^https?:\/\//i.test(u))
  const logo = absolute(mediaURL(settings.logo))

  const data: Json = {
    '@type': type,
    '@id': `${site}/#owner`,
    name: settings.businessName || settings.siteTitle,
    url: `${site}/`,
    ...(footer.about ? { description: footer.about } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }
  if (!isPerson) {
    if (logo) data.logo = logo
    if (footer.phone) data.telephone = footer.phone
    if (footer.email) data.email = footer.email
  }
  if (isLocal) {
    if (address.length) data.address = { '@type': 'PostalAddress', streetAddress: address.join(', ') }
    if (logo) data.image = logo
    if (settings.priceRange) data.priceRange = settings.priceRange
    // Opening hours are written freely ("Mon to Fri: 9am to 6pm"), so they go in as text.
    const hours = lines(footer.hours)
    if (hours.length) data.openingHours = hours
  }
  return data
}

/** Site-wide structured data: who runs the site, and the website itself (with its search). */
export async function SiteStructuredData({ settings }: { settings: SiteSetting }) {
  const site = getServerSideURL()
  const website: Json = {
    '@type': 'WebSite',
    '@id': `${site}/#website`,
    url: `${site}/`,
    name: settings.siteTitle,
    ...(settings.tagline ? { description: settings.tagline } : {}),
    publisher: { '@id': `${site}/#owner` },
    inLanguage: settings.language || 'en',
  }
  if (settings.enableSearch !== false) {
    website.potentialAction = {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${site}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    }
  }
  return <JsonLd data={{ '@context': 'https://schema.org', '@graph': [await organisation(settings), website] }} />
}

/** Breadcrumbs: Home > (Blog >) this page. */
export function BreadcrumbData({ trail }: { trail: { name: string; path: string }[] }) {
  const site = getServerSideURL()
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: trail.map((t, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: t.name,
          item: `${site}${t.path}`,
        })),
      }}
    />
  )
}

/** A blog post as an Article (BlogPosting). */
export function ArticleData({ post }: { post: Post }) {
  const site = getServerSideURL()
  const url = `${site}/posts/${post.slug}`
  const image = post.meta?.image || post.heroImage
  const imageURL = image && typeof image === 'object' ? absolute((image as Media).url) : undefined
  const authors = (post.populatedAuthors || post.authors || [])
    .map((a) => (a && typeof a === 'object' ? (a as Partial<User>).name : null))
    .filter(Boolean) as string[]
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        mainEntityOfPage: url,
        headline: (post.meta?.title || post.title || '').slice(0, 110),
        ...(post.meta?.description ? { description: post.meta.description } : {}),
        ...(imageURL ? { image: [imageURL] } : {}),
        ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
        dateModified: post.updatedAt,
        ...(authors.length ? { author: authors.map((name) => ({ '@type': 'Person', name })) } : {}),
        publisher: { '@id': `${site}/#owner` },
        isPartOf: { '@id': `${site}/#website` },
      }}
    />
  )
}

/** Breadcrumb trail for a page (home has none). */
export const pageTrail = (page: Pick<Page, 'title' | 'slug'>) =>
  page.slug === 'home'
    ? []
    : [
        { name: 'Home', path: '/' },
        { name: page.title, path: `/${page.slug}` },
      ]
