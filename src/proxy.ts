import { NextResponse, type NextRequest } from 'next/server'

/**
 * Site-wide redirects (Redirects collection), including old WordPress
 * addresses like /2024/05/my-post/ created by the importer.
 * The list is cached in memory for a minute so pages stay fast.
 */

type RedirectDoc = {
  from: string
  type?: '301' | '302' | '307' | '308' | null
  to?: {
    type?: 'reference' | 'custom' | null
    url?: string | null
    reference?: {
      relationTo: 'pages' | 'posts'
      value: { slug?: string | null } | number | string
    } | null
  } | null
}

const normalise = (u: string) => (u.length > 1 ? u.replace(/\/+$/, '') : u)

let cache: { at: number; map: Map<string, { to: string; status: number }> } | null = null

async function loadRedirects(): Promise<Map<string, { to: string; status: number }>> {
  if (cache && Date.now() - cache.at < 60_000) return cache.map
  const map = new Map<string, { to: string; status: number }>()
  try {
    const port = process.env.PORT || '3000'
    const res = await fetch(`http://127.0.0.1:${port}/api/redirects?limit=0&depth=1`, {
      cache: 'no-store',
    })
    if (res.ok) {
      const { docs } = (await res.json()) as { docs: RedirectDoc[] }
      for (const r of docs) {
        let to: string | null = null
        if (r.to?.type === 'custom' && r.to.url) to = r.to.url
        const ref = r.to?.reference
        if (!to && ref && typeof ref.value === 'object' && ref.value?.slug) {
          to = ref.relationTo === 'posts' ? `/posts/${ref.value.slug}` : `/${ref.value.slug}`
        }
        if (to && r.from) map.set(normalise(r.from), { to, status: Number(r.type) || 301 })
      }
    }
  } catch {
    // Redirects are best effort; never break the page.
  }
  cache = { at: Date.now(), map }
  return map
}

const THEME_COOKIE = 'payload-theme'
/** Which page editor the person last chose: the visual builder (default) or the classic editor. */
const EDITOR_COOKIE = 'up-editor'
const PAGE_EDIT = /^\/admin\/collections\/pages\/([A-Za-z0-9_-]+)\/?$/
const YEAR = 60 * 60 * 24 * 365

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  if (pathname.startsWith('/admin')) {
    const cookies: { name: string; value: string }[] = []
    // Dark mode is the default until the owner picks Bright in the menu.
    if (!request.cookies.has(THEME_COOKIE)) {
      request.cookies.set(THEME_COOKIE, 'dark')
      cookies.push({ name: THEME_COOKIE, value: 'dark' })
    }

    // Pages open in the visual builder, unless the person switched to the classic editor.
    const choice = searchParams.get('editor')
    if (choice === 'classic' || choice === 'visual') cookies.push({ name: EDITOR_COOKIE, value: choice })
    const edit = PAGE_EDIT.exec(pathname)
    // editor=new: a brand new page, shown in the classic editor once without changing the choice.
    const classic = choice ? choice !== 'visual' : request.cookies.get(EDITOR_COOKIE)?.value === 'classic'
    let res: NextResponse
    if (edit && edit[1] !== 'create' && !classic) {
      const to = new URL(`/admin/visual-builder`, request.url)
      to.searchParams.set('page', edit[1])
      res = NextResponse.redirect(to, 307)
    } else {
      res = NextResponse.next({ request: { headers: request.headers } })
    }
    for (const c of cookies) res.cookies.set(c.name, c.value, { path: '/', maxAge: YEAR, sameSite: 'lax' })
    return res
  }

  const path = normalise(request.nextUrl.pathname)
  const map = await loadRedirects()
  const hit = map.get(path)
  if (hit && normalise(hit.to) !== path) {
    return NextResponse.redirect(new URL(hit.to, request.url), hit.status)
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/((?!api|admin|_next|next/|favicon|.*\\.(?:xml|txt|ico|png|jpg|jpeg|svg|webp|avif|gif|css|js|woff2?)$).*)',
  ],
}
