import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { revalidatePath } from 'next/cache'
import type { Endpoint, PayloadRequest } from 'payload'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

import { hasRole } from '@/access/roles'
import {
  backupFile,
  backupPackage,
  backupTick,
  createBackup,
  deleteBackup,
  importPackage,
  listBackups,
  MAX_PACKAGE,
  restoreBackup,
} from '@/siteBackups'

/**
 * /api/up/backups            GET list, POST back up now
 * /api/up/backups/:id/:file  GET download db.dump, media.tar.gz, or site (everything as one file)
 * /api/up/backups/upload     POST a site file (body: the file, header x-up-password), added to the list
 * /api/up/backups/:id/restore  POST { confirm: "RESTORE", media: boolean }
 * /api/up/backups/:id        DELETE
 * Administrators only.
 */

const deny = () => Response.json({ error: 'Administrators only' }, { status: 403 })
const admin = (req: PayloadRequest) => hasRole(req.user, 'admin')
const param = (req: PayloadRequest, key: string) => String((req.routeParams as Record<string, unknown> | undefined)?.[key] || '')

/** True when `password` is the logged-in administrator's password. */
async function passwordOk(req: PayloadRequest, password: unknown): Promise<boolean> {
  const email = (req.user as { email?: string } | null)?.email
  if (!email || typeof password !== 'string' || !password || password.length > 500) return false
  try {
    await req.payload.login({ collection: 'users', data: { email, password } })
    return true
  } catch {
    return false
  }
}

export const backupEndpoints: Endpoint[] = [
  {
    // Called by the server itself every 10 minutes (src/instrumentation.ts).
    path: '/up/backups/tick',
    method: 'post',
    handler: async (req) => {
      const secret = process.env.CRON_SECRET
      if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return deny()
      try {
        return Response.json({ result: await backupTick(req.payload) })
      } catch (err) {
        req.payload.logger.error({ msg: 'Daily backup failed', err })
        return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
      }
    },
  },
  {
    path: '/up/backups',
    method: 'get',
    handler: async (req) => (admin(req) ? Response.json({ backups: listBackups() }) : deny()),
  },
  {
    path: '/up/backups',
    method: 'post',
    handler: async (req) => {
      if (!admin(req)) return deny()
      try {
        const info = await createBackup(req.payload, `Manual, by ${(req.user as { name?: string; email?: string }).name || (req.user as { email?: string }).email}`)
        return Response.json({ backup: info })
      } catch (err) {
        return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
      }
    },
  },
  {
    path: '/up/backups/:id/:file',
    method: 'get',
    handler: async (req) => {
      if (!admin(req)) return deny()
      const file = param(req, 'file')
      const id = param(req, 'id')
      if (file === 'site') {
        const tar = backupPackage(id)
        if (!tar) return Response.json({ error: 'Not found' }, { status: 404 })
        return new Response(Readable.toWeb(tar) as unknown as ReadableStream, {
          headers: {
            'Content-Type': 'application/x-tar',
            'Content-Disposition': `attachment; filename="ultimapress-site-${id}.tar"`,
          },
        })
      }
      if (file !== 'db.dump' && file !== 'media.tar.gz') return Response.json({ error: 'Unknown file' }, { status: 404 })
      const f = backupFile(id, file)
      if (!f) return Response.json({ error: 'Not found' }, { status: 404 })
      const stream = Readable.toWeb(fs.createReadStream(f)) as unknown as ReadableStream
      return new Response(stream, {
        headers: {
          'Content-Type': file === 'db.dump' ? 'application/octet-stream' : 'application/gzip',
          'Content-Length': String(fs.statSync(f).size),
          'Content-Disposition': `attachment; filename="ultimapress-${id}-${file}"`,
        },
      })
    },
  },
  {
    path: '/up/backups/upload',
    method: 'post',
    handler: async (req) => {
      if (!admin(req)) return deny()
      if (!(await passwordOk(req, req.headers.get('x-up-password')))) {
        return Response.json({ error: 'Wrong password.' }, { status: 403 })
      }
      const length = Number(req.headers.get('content-length') || 0)
      if (length > MAX_PACKAGE) return Response.json({ error: 'That file is too big (over 5 GB).' }, { status: 413 })
      if (!req.body) return Response.json({ error: 'Choose a site file.' }, { status: 400 })
      const tmp = path.join(os.tmpdir(), `up-site-${crypto.randomUUID()}.tar`)
      try {
        let seen = 0
        const limit = new TransformStream<Uint8Array, Uint8Array>({
          transform(chunk, ctrl) {
            seen += chunk.byteLength
            if (seen > MAX_PACKAGE) ctrl.error(new Error('That file is too big (over 5 GB).'))
            else ctrl.enqueue(chunk)
          },
        })
        await pipeline(
          Readable.fromWeb((req.body as ReadableStream<Uint8Array>).pipeThrough(limit) as never),
          fs.createWriteStream(tmp),
        )
        const backup = await importPackage(tmp)
        return Response.json({ backup })
      } catch (err) {
        return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 })
      } finally {
        fs.rmSync(tmp, { force: true })
      }
    },
  },
  {
    path: '/up/backups/:id/restore',
    method: 'post',
    handler: async (req) => {
      if (!admin(req)) return deny()
      const body = ((await req.json?.().catch(() => ({}))) || {}) as { confirm?: string; media?: boolean }
      if (body.confirm !== 'RESTORE') return Response.json({ error: 'Type RESTORE to confirm.' }, { status: 400 })
      try {
        await restoreBackup(req.payload, param(req, 'id'), Boolean(body.media), (req.user as { id: number | string }).id)
        revalidatePath('/', 'layout')
        return Response.json({ ok: true })
      } catch (err) {
        return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
      }
    },
  },
  {
    path: '/up/backups/:id',
    method: 'delete',
    handler: async (req) => {
      if (!admin(req)) return deny()
      try {
        deleteBackup(param(req, 'id'))
        return Response.json({ ok: true })
      } catch (err) {
        return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 })
      }
    },
  },
]
