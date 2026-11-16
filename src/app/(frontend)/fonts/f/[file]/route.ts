import fs from 'fs'
import path from 'path'

import { FONT_FILE, fontsDir } from '@/utilities/localFonts'

/** A font file downloaded by the site (see src/utilities/localFonts.ts). */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  // Only names the site itself created: no paths, nothing outside the fonts folder.
  if (!FONT_FILE.test(file)) return new Response('Not found', { status: 404 })
  try {
    const data = fs.readFileSync(path.join(fontsDir(), 'files', file))
    return new Response(new Uint8Array(data), {
      headers: { 'Content-Type': 'font/woff2', 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
