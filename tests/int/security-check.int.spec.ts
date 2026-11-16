/**
 * @vitest-environment node
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterAll, describe, expect, it } from 'vitest'

import { scanSecurity } from '../../docker/security-check.mjs'

type Finding = { rule: string; file: string; severity: string }
type Result = { ok: boolean; critical: Finding[]; warnings: Finding[]; markedSafe: Finding[] }

const dirs: string[] = []
const site = (files: Record<string, string>) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'up-sec-'))
  dirs.push(dir)
  for (const [name, text] of Object.entries(files)) {
    const file = path.join(dir, 'src', name)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, text)
  }
  return dir
}
const scan = async (files: Record<string, string>) =>
  (await scanSecurity(site(files), { packages: false })) as Result
const rules = (list: Finding[]) => list.map((f) => f.rule).sort()

afterAll(() => dirs.forEach((d) => fs.rmSync(d, { recursive: true, force: true })))

describe('security check', () => {
  it('blocks a feature with the usual holes', async () => {
    const r = await scan({
      'collections/Bookings.ts': `
        import type { CollectionConfig } from 'payload'
        export const Bookings: CollectionConfig = {
          slug: 'bookings',
          access: { read: () => true, create: () => true, update: () => true, delete: () => true },
          fields: [],
        }`,
      'endpoints/bookings.ts': `
        export const bookingEndpoints = [
          {
            path: '/bookings/cancel',
            method: 'post',
            handler: async (req) => {
              const { id } = await req.json()
              await db.execute(\`delete from bookings where id = \${id}\`)
              return Response.json({ ok: true })
            },
          },
        ]`,
      // The fake key is put together here so the test file itself contains no key-shaped text.
      'utilities/mail.ts': `const apiKey = '${['sk', 'live', '51HxQwErTyUiOpAsDfGhJkL1234'].join('_')}'\nexport const k = apiKey`,
      'components/Price.tsx': `export const P = ({ t }) => <div dangerouslySetInnerHTML={{ __html: t }} />\nconst esc = (s) => s.replace('<', '&lt;')`,
      'components/Pay.tsx': `const key = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY`,
      'run.ts': `export const run = (code) => eval(code)`,
    })
    expect(r.ok).toBe(false)
    expect(new Set(rules(r.critical))).toEqual(
      new Set(['open-access', 'unprotected-endpoint', 'raw-sql', 'secret-in-code', 'secret-sent-to-browser', 'code-from-text']),
    )
    expect(new Set(rules(r.warnings))).toEqual(new Set(['unescaped-html', 'incomplete-escaping']))
  })

  it('passes the same feature done safely', async () => {
    const r = await scan({
      'collections/Bookings.ts': `
        import type { CollectionConfig } from 'payload'
        import { adminOnly } from '@/access/roles'
        export const Bookings: CollectionConfig = {
          slug: 'bookings',
          access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
          fields: [],
        }`,
      'endpoints/bookings.ts': `
        export const bookingEndpoints = [
          {
            path: '/bookings/cancel',
            method: 'post',
            handler: async (req) => {
              if (!hasRole(req.user, 'admin')) return Response.json({ error: 'No' }, { status: 403 })
              await req.payload.delete({ collection: 'bookings', id: (await req.json()).id, req })
              return Response.json({ ok: true })
            },
          },
        ]`,
      'utilities/mail.ts': `const apiKey = process.env.MAIL_API_KEY\nconst example = { apiKey: 'your-api-key-goes-here' }`,
      'components/Price.tsx': `export const P = ({ t }) => <div dangerouslySetInnerHTML={{ __html: cleanDesignHtml(t) }} />\nconst esc = (s) => s.replace(/</g, '&lt;')`,
    })
    expect(r.critical).toEqual([])
    expect(r.warnings).toEqual([])
    expect(r.ok).toBe(true)
  })

  it('lists code marked safe, with its reason, instead of blocking', async () => {
    const r = await scan({
      'endpoints/ping.ts': `
        export const ping = [
          {
            // up-security: public on purpose, only counts a visit
            path: '/ping',
            method: 'post',
            handler: async () => Response.json({ ok: true }),
          },
        ]`,
    })
    expect(r.ok).toBe(true)
    expect(rules(r.markedSafe)).toEqual(['unprotected-endpoint'])
  })

  it('passes on the UltimaPress code itself', async () => {
    const r = (await scanSecurity(path.resolve(__dirname, '../..'), { packages: false })) as Result
    expect(r.critical).toEqual([])
  })
})
