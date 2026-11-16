import { getSiteSettings } from '@/utilities/getSiteSettings'
import { fontsKey, googleFontsURL, localFontsCSS } from '@/utilities/localFonts'

/** The site's font stylesheet, served by the site itself (see src/utilities/localFonts.ts). */
export async function GET(req: Request) {
  const settings = await getSiteSettings()
  const fonts = [settings.headingFont || 'Manrope', settings.bodyFont || 'Inter']
  const css = await localFontsCSS(fonts)
  // Could not download the fonts yet: let the browser use Google Fonts this time.
  if (!css) return Response.redirect(googleFontsURL(fonts), 302)
  const current = new URL(req.url).searchParams.get('v') === fontsKey(fonts)
  return new Response(css, {
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': current ? 'public, max-age=31536000, immutable' : 'public, max-age=300',
    },
  })
}
