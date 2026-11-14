import fs from 'fs'
import { revalidatePath } from 'next/cache'
import type { Endpoint, PayloadRequest } from 'payload'
import { Readable } from 'stream'

import { hasRole } from '@/access/roles'
import { backupFile, backupTick, createBackup, deleteBackup, listBackups, restoreBackup } from '@/siteBackups'

/**
 * /api/up/backups            GET list, POST back up now
 * /api/up/backups/:id/:file  GET download db.dump or media.tar.gz
 * /api/up/backups/:id/restore  POST { confirm: "RESTORE", media: boolean }
 * /api/up/backups/:id        DELETE
 * Administrators only.
 */

const deny = () => Response.json({ error: 'Administrators only' }, { status: 403 })
const admin = (req: PayloadRequest) => hasRole(req.user, 'admin')
const param = (req: PayloadRequest, key: string) => String((req.routeParams as Record<string, unknown> | undefined)?.[key] || '')

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
      if (file !== 'db.dump' && file !== 'media.tar.gz') return Response.json({ error: 'Unknown file' }, { status: 404 })
      const id = param(req, 'id')
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
    path: '/up/backups/:id/restore',
    method: 'post',
    handler: async (req) => {
      if (!admin(req)) return deny()
      const body = ((await req.json?.().catch(() => ({}))) || {}) as { confirm?: string; media?: boolean }
      if (body.confirm !== 'RESTORE') return Response.json({ error: 'Type RESTORE to confirm.' }, { status: 400 })
      try {
        await restoreBackup(req.payload, param(req, 'id'), Boolean(body.media))
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
