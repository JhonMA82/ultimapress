/** Turns any document into a card: title, picture, short text, price and link. */
export type GridCard = { id: string; title: string; href: string; image?: string; alt?: string; text?: string; price?: string }

type Doc = Record<string, unknown>
const media = (v: unknown): { url?: string; alt?: string } | null => {
  if (!v || typeof v !== 'object') return null
  const m = v as { url?: string; alt?: string; image?: unknown }
  if (m.url) return m
  return m.image ? media(m.image) : null
}
const firstMedia = (doc: Doc) => {
  for (const key of ['heroImage', 'image', 'photo', 'featuredImage', 'cover', 'thumbnail']) {
    const m = media(doc[key])
    if (m) return m
  }
  for (const key of ['photos', 'images', 'gallery']) {
    const list = doc[key]
    if (Array.isArray(list) && list.length) {
      const m = media(list[0])
      if (m) return m
    }
  }
  return media((doc.meta as Doc | undefined)?.image)
}

export const PUBLIC_PATH: Record<string, string> = { posts: '/posts' }

export function toCard(collection: string, doc: Doc): GridCard {
  const slug = typeof doc.slug === 'string' ? doc.slug : String(doc.id)
  const m = firstMedia(doc)
  const text =
    (typeof doc.excerpt === 'string' && doc.excerpt) ||
    (typeof doc.summary === 'string' && doc.summary) ||
    (typeof (doc.meta as Doc | undefined)?.description === 'string' && ((doc.meta as Doc).description as string)) ||
    ''
  const price =
    typeof doc.price === 'number'
      ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(doc.price)
      : typeof doc.price === 'string'
        ? doc.price
        : undefined
  return {
    id: String(doc.id),
    title: String(doc.title || doc.name || 'Untitled'),
    href: `${PUBLIC_PATH[collection] || `/${collection}`}/${slug}`,
    image: m?.url,
    alt: m?.alt || '',
    text: text.length > 160 ? `${text.slice(0, 157)}…` : text,
    price,
  }
}

/** Collections that make sense in a grid: they have pages of their own (a slug). */
export const NOT_GRIDDABLE = new Set([
  'pages', 'users', 'media', 'forms', 'form-submissions', 'search', 'redirects', 'comments',
  'categories', 'tags', 'section-templates', 'synced-sections',
])
