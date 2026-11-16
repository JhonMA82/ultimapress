/**
 * @vitest-environment node
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'up-fonts-'))
process.env.UP_DATA_DIR = dir

const CSS = (host: string) => `/* latin */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/inter/v1/a.woff2) format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-weight: 700;
  src: url(https://fonts.gstatic.com/s/inter/v1/b.woff2) format('woff2');
}
${host}`

let extra = ''
beforeAll(() => {
  vi.stubGlobal('fetch', async (url: string) => {
    if (url.startsWith('https://fonts.googleapis.com/')) return new Response(CSS(extra))
    if (url.startsWith('https://fonts.gstatic.com/')) return new Response(new Uint8Array([119, 79, 70, 50]))
    return new Response('no', { status: 404 })
  })
})
afterAll(() => {
  vi.unstubAllGlobals()
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('self-hosted fonts', () => {
  it('downloads the fonts and points the stylesheet at the site itself', async () => {
    const { localFontsCSS, fontsDir, FONT_FILE } = await import('@/utilities/localFonts')
    const css = await localFontsCSS(['Inter', 'Manrope'])
    expect(css).toBeTruthy()
    expect(css).not.toMatch(/gstatic|googleapis/)
    const files = css!.match(/\/fonts\/f\/[a-f0-9]+\.woff2/g) || []
    expect(files.length).toBe(2)
    for (const f of files) {
      const name = f.split('/').pop()!
      expect(FONT_FILE.test(name)).toBe(true)
      expect(fs.existsSync(path.join(fontsDir(), 'files', name))).toBe(true)
    }
  })

  it('refuses a stylesheet that points anywhere else', async () => {
    extra = '@import url(https://evil.example/x.css);'
    const { localFontsCSS } = await import('@/utilities/localFonts')
    expect(await localFontsCSS(['Lora'])).toBeNull()
    extra = ''
  })

  it('only serves file names the site created', async () => {
    const { FONT_FILE } = await import('@/utilities/localFonts')
    expect(FONT_FILE.test('../../package.json')).toBe(false)
    expect(FONT_FILE.test('abc.woff2')).toBe(false)
  })
})
