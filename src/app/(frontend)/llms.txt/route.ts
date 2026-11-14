import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { getServerSideURL } from '@/utilities/getURL'
import { getSiteSettings } from '@/utilities/getSiteSettings'

/**
 * /llms.txt: a plain summary of the site for AI assistants (the llms.txt convention):
 * what the site is, then its pages and recent posts, each with a one-line description.
 */
const build = unstable_cache(
  async () => {
    const settings = await getSiteSettings()
    if (settings.enableLlmsTxt === false) return null
    const payload = await getPayload({ config: configPromise })
    const site = getServerSideURL()
    const clean = (t?: string | null) => (t || '').replace(/\s+/g, ' ').trim()
    const visible = { _status: { equals: 'published' }, 'meta.noindex': { not_equals: true } } as const

    const [pages, posts] = await Promise.all([
      payload.find({
        collection: 'pages',
        where: visible,
        depth: 0,
        limit: 200,
        pagination: false,
        overrideAccess: false,
        select: { title: true, slug: true, meta: true },
      }),
      settings.enableBlog === false
        ? Promise.resolve({ docs: [] as { title: string; slug?: string | null; meta?: { description?: string | null } }[] })
        : payload.find({
            collection: 'posts',
            where: visible,
            depth: 0,
            limit: 50,
            sort: '-publishedAt',
            overrideAccess: false,
            select: { title: true, slug: true, meta: true },
          }),
    ])

    let about = ''
    try {
      const footer = await getCachedGlobal('footer', 0)()
      about = clean(footer.about)
      const contact = [footer.phone && `Phone: ${clean(footer.phone)}`, footer.email && `Email: ${clean(footer.email)}`, footer.address && `Address: ${clean(footer.address)}`]
        .filter(Boolean)
        .join('\n- ')
      if (contact) about += `${about ? '\n\n' : ''}## Contact\n\n- ${contact}`
    } catch {
      /* footer not set up */
    }

    const item = (title: string, path: string, desc?: string | null) =>
      `- [${clean(title)}](${site}${path})${clean(desc) ? `: ${clean(desc)}` : ''}`

    const out: string[] = [`# ${clean(settings.businessName || settings.siteTitle)}`]
    if (settings.tagline) out.push('', `> ${clean(settings.tagline)}`)
    if (about) out.push('', about)
    if (pages.docs.length) {
      out.push('', '## Pages', '')
      for (const p of pages.docs) if (p.slug) out.push(item(p.title, p.slug === 'home' ? '/' : `/${p.slug}`, p.meta?.description))
    }
    if (posts.docs.length) {
      out.push('', '## Blog', '')
      for (const p of posts.docs) if (p.slug) out.push(item(p.title, `/posts/${p.slug}`, p.meta?.description))
    }
    return out.join('\n') + '\n'
  },
  ['llms-txt'],
  { tags: ['llms-txt', 'pages-sitemap', 'posts-sitemap', 'global_site-settings', 'global_footer'], revalidate: 3600 },
)

export async function GET() {
  const body = await build()
  if (body === null) return new Response('Not found', { status: 404 })
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=600' },
  })
}
