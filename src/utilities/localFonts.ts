import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

/**
 * Self-hosted Google Fonts.
 *
 * The site's heading and body fonts are downloaded once from Google Fonts and then served by
 * the site itself (/fonts/site and /fonts/f/<file>.woff2). Visitors' browsers never contact
 * Google, so no visitor IP address is sent to Google (GDPR), and no outside stylesheet is
 * loaded without an integrity check. If the download fails, the site falls back to Google
 * Fonts so pages always look right.
 */

const dataDir = () =>
  process.env.UP_DATA_DIR || (fs.existsSync('/app/data') ? '/app/data' : path.join(process.cwd(), 'data'))
export const fontsDir = () => path.join(dataDir(), 'fonts')

/** The Google Fonts stylesheet address for these families. */
export const googleFontsURL = (fonts: (string | null | undefined)[]) => {
  const families = Array.from(new Set(fonts.filter(Boolean) as string[]))
    .filter((f) => /^[A-Za-z0-9 ]{1,60}$/.test(f))
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700;800`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

const hash = (s: string, n: number) => crypto.createHash('sha256').update(s).digest('hex').slice(0, n)

/** A short key for a set of fonts, used to cache their stylesheet. */
export const fontsKey = (fonts: (string | null | undefined)[]) => hash(googleFontsURL(fonts), 16)

/** Safe name for a font file kept on the site. */
export const FONT_FILE = /^[a-f0-9]{24}\.woff2$/

// A browser that gets WOFF2 files from Google Fonts.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const working = new Map<string, Promise<string | null>>()

async function download(fonts: (string | null | undefined)[]): Promise<string | null> {
  const url = googleFontsURL(fonts)
  const key = hash(url, 16)
  const dir = fontsDir()
  const cssFile = path.join(dir, `${key}.css`)
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return null
    let css = await res.text()
    const files = Array.from(new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)\s'"]+\.woff2/g) || []))
    if (!files.length) return null
    fs.mkdirSync(path.join(dir, 'files'), { recursive: true })
    for (const remote of files) {
      const name = `${hash(remote, 24)}.woff2`
      const local = path.join(dir, 'files', name)
      if (!fs.existsSync(local)) {
        const f = await fetch(remote, { signal: AbortSignal.timeout(15_000) })
        if (!f.ok) return null
        const tmp = `${local}.tmp`
        fs.writeFileSync(tmp, Buffer.from(await f.arrayBuffer()))
        fs.renameSync(tmp, local)
      }
      css = css.split(remote).join(`/fonts/f/${name}`)
    }
    // Only fonts are allowed in the saved stylesheet: no other outside addresses.
    if (/https?:\/\//.test(css.replace(/\/\*[\s\S]*?\*\//g, ''))) return null
    fs.writeFileSync(`${cssFile}.tmp`, css)
    fs.renameSync(`${cssFile}.tmp`, cssFile)
    return css
  } catch {
    return null
  }
}

/** The site's font stylesheet, served from the site; null when it could not be downloaded. */
export async function localFontsCSS(fonts: (string | null | undefined)[]): Promise<string | null> {
  const key = fontsKey(fonts)
  const cssFile = path.join(fontsDir(), `${key}.css`)
  try {
    return fs.readFileSync(cssFile, 'utf8')
  } catch {
    /* not downloaded yet */
  }
  if (!working.has(key)) {
    working.set(
      key,
      download(fonts).finally(() => working.delete(key)),
    )
  }
  return working.get(key)!
}
