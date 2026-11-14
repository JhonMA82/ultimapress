/** Turns a pasted link into a safe embed URL, like WordPress's oEmbed. */
export const toEmbedURL = (raw: string): string | null => {
  let url: URL
  try {
    const text = raw.trim()
    url = new URL(text.startsWith('//') ? `https:${text}` : text)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const host = url.hostname.toLowerCase()
  // Exact domains only, so a look-alike such as "evilyoutube.com" is never embedded.
  const is = (domain: string) => host === domain || host.endsWith(`.${domain}`)
  const safeId = (id?: string | null) => (id && /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : null)

  if (host === 'youtu.be') {
    const id = safeId(url.pathname.slice(1))
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
  }
  if (is('youtube.com') || is('youtube-nocookie.com')) {
    const id = safeId(
      url.searchParams.get('v') || url.pathname.match(/\/(embed|shorts|live)\/([^/?]+)/)?.[2],
    )
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
  }
  if (is('vimeo.com')) {
    const id = url.pathname.match(/(\d+)/)?.[1]
    return id ? `https://player.vimeo.com/video/${id}` : null
  }
  if (is('loom.com')) {
    const id = safeId(url.pathname.match(/\/(share|embed)\/([^/?]+)/)?.[2])
    return id ? `https://www.loom.com/embed/${id}` : null
  }
  if ((host === 'google.com' || host === 'www.google.com') && url.pathname.startsWith('/maps/embed')) {
    return `https://www.google.com${url.pathname}${url.search}`
  }
  // A map of an address: rebuilt from the address alone.
  if (['google.com', 'www.google.com', 'maps.google.com'].includes(host) && url.pathname === '/maps' && url.searchParams.get('q')) {
    const base = host === 'maps.google.com' ? 'https://maps.google.com' : 'https://www.google.com'
    return `${base}/maps?q=${encodeURIComponent(url.searchParams.get('q')!.slice(0, 200))}&output=embed`
  }
  return null
}

/** A Google map of an address, for the visual builder. */
export const mapEmbedURL = (address: string): string | null =>
  address.trim() ? toEmbedURL(`https://www.google.com/maps?q=${encodeURIComponent(address.trim())}`) : null
