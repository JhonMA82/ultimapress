import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'

import { putObject } from './s3'

/**
 * Daily backups of the database (pg_dump) and the media folder (tar.gz), kept on the
 * server's data volume, optionally copied to S3-compatible storage. Managed from
 * Settings > Backups. Each backup is a folder: backups/<id>/{db.dump, media.tar.gz, info.json}.
 */

export type BackupInfo = {
  id: string
  createdAt: string
  reason: string
  dbBytes: number
  mediaBytes: number
  offsite?: 'sent' | 'failed' | 'off'
  offsiteError?: string
}

const dataDir = () =>
  process.env.UP_DATA_DIR || (fs.existsSync('/app/data') ? '/app/data' : path.join(process.cwd(), 'data'))
export const backupDir = () => process.env.UP_BACKUP_DIR || path.join(dataDir(), 'backups')
const mediaDir = () => process.env.MEDIA_DIR || path.join(process.cwd(), 'public', 'media')
const bin = (name: string) => (process.env.UP_PG_BIN ? path.join(process.env.UP_PG_BIN, name) : name)

const ID = /^\d{8}-\d{6}(-[a-z0-9]{1,12})?$/

const run = (cmd: string, args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const c = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let err = ''
    c.stderr.on('data', (d) => (err = (err + d.toString()).slice(-2000)))
    c.on('error', (e) => reject(new Error(`${cmd}: ${e.message}`)))
    c.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} failed: ${err.trim() || `exit ${code}`}`))))
  })

const size = (f: string) => {
  try {
    return fs.statSync(f).size
  } catch {
    return 0
  }
}

const readInfo = (id: string): BackupInfo | null => {
  try {
    return JSON.parse(fs.readFileSync(path.join(backupDir(), id, 'info.json'), 'utf8'))
  } catch {
    return null
  }
}

export function listBackups(): BackupInfo[] {
  const dir = backupDir()
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((d) => ID.test(d))
    .map(readInfo)
    .filter((b): b is BackupInfo => Boolean(b))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const backupFile = (id: string, file: 'db.dump' | 'media.tar.gz') => {
  if (!ID.test(id)) return null
  const f = path.join(backupDir(), id, file)
  return fs.existsSync(f) ? f : null
}

/** One backup at a time, across processes (a lock file older than 2 hours is stale). */
const lockFile = () => path.join(backupDir(), '.running')
function lock() {
  fs.mkdirSync(backupDir(), { recursive: true })
  try {
    const t = fs.statSync(lockFile()).mtimeMs
    if (Date.now() - t < 2 * 3_600_000) return false
  } catch {
    /* no lock */
  }
  fs.writeFileSync(lockFile(), String(process.pid))
  return true
}
const unlock = () => fs.rmSync(lockFile(), { force: true })

type Settings = {
  backupsEnabled?: boolean | null
  backupHour?: number | null
  backupKeepDays?: number | null
  backupMedia?: boolean | null
  offsiteEnabled?: boolean | null
  s3Endpoint?: string | null
  s3Region?: string | null
  s3Bucket?: string | null
  s3AccessKey?: string | null
  s3SecretKey?: string | null
  s3Prefix?: string | null
}

const settingsOf = async (payload: Payload): Promise<Settings> => {
  try {
    return (await payload.findGlobal({ slug: 'private-settings', overrideAccess: true, depth: 0 })) as Settings
  } catch {
    return {}
  }
}

export async function createBackup(payload: Payload, reason: string): Promise<BackupInfo> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.')
  if (!lock()) throw new Error('A backup is already running. Try again in a few minutes.')
  const settings = await settingsOf(payload)
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)
  const id = fs.existsSync(path.join(backupDir(), stamp)) ? `${stamp}-${Math.random().toString(36).slice(2, 6)}` : stamp
  const dir = path.join(backupDir(), id)
  const tmp = `${dir}.tmp`
  try {
    fs.rmSync(tmp, { recursive: true, force: true })
    fs.mkdirSync(tmp, { recursive: true })
    await run(bin('pg_dump'), ['-Fc', '--no-owner', '--no-privileges', '-d', process.env.DATABASE_URL, '-f', path.join(tmp, 'db.dump')])
    const media = mediaDir()
    if (settings.backupMedia !== false && fs.existsSync(media)) {
      await run('tar', ['-czf', path.join(tmp, 'media.tar.gz'), '-C', media, '.'])
    }
    const info: BackupInfo = {
      id,
      createdAt: new Date().toISOString(),
      reason,
      dbBytes: size(path.join(tmp, 'db.dump')),
      mediaBytes: size(path.join(tmp, 'media.tar.gz')),
      offsite: 'off',
    }
    fs.writeFileSync(path.join(tmp, 'info.json'), JSON.stringify(info, null, 2))
    fs.renameSync(tmp, dir)
    payload.logger.info(`Backup ${id} saved (${reason})`)

    // Old backups go, but the three newest always stay.
    const keepDays = Math.max(3, Number(settings.backupKeepDays) || 30)
    const all = listBackups()
    for (const b of all.slice(3)) {
      if (Date.now() - Date.parse(b.createdAt) > keepDays * 86_400_000) {
        fs.rmSync(path.join(backupDir(), b.id), { recursive: true, force: true })
      }
    }

    if (settings.offsiteEnabled && settings.s3Endpoint && settings.s3Bucket && settings.s3AccessKey && settings.s3SecretKey) {
      const target = {
        endpoint: settings.s3Endpoint,
        region: settings.s3Region || 'auto',
        bucket: settings.s3Bucket,
        accessKey: settings.s3AccessKey,
        secretKey: settings.s3SecretKey,
        prefix: settings.s3Prefix || 'ultimapress-backups',
      }
      try {
        await putObject(target, `${id}/db.dump`, path.join(dir, 'db.dump'))
        if (info.mediaBytes) await putObject(target, `${id}/media.tar.gz`, path.join(dir, 'media.tar.gz'), 'application/gzip')
        info.offsite = 'sent'
      } catch (err) {
        info.offsite = 'failed'
        info.offsiteError = err instanceof Error ? err.message : String(err)
        payload.logger.error({ msg: 'Off-site backup copy failed', err })
      }
      fs.writeFileSync(path.join(dir, 'info.json'), JSON.stringify(info, null, 2))
    }
    return info
  } catch (err) {
    fs.rmSync(tmp, { recursive: true, force: true })
    throw err
  } finally {
    unlock()
  }
}

/** Puts a backup back: the database, and the media folder when asked. A safety backup is taken first. */
export async function restoreBackup(payload: Payload, id: string, withMedia: boolean) {
  const db = backupFile(id, 'db.dump')
  if (!db) throw new Error('That backup was not found.')
  await createBackup(payload, `Before restoring ${id}`)
  if (!lock()) throw new Error('A backup is running. Try again in a few minutes.')
  try {
    await run(bin('pg_restore'), ['--clean', '--if-exists', '--no-owner', '--no-privileges', '--single-transaction', '-d', process.env.DATABASE_URL || '', db])
    const media = backupFile(id, 'media.tar.gz')
    if (withMedia && media) {
      fs.mkdirSync(mediaDir(), { recursive: true })
      await run('tar', ['-xzf', media, '-C', mediaDir()])
    }
  } finally {
    unlock()
  }
}

export function deleteBackup(id: string) {
  if (!ID.test(id)) throw new Error('Unknown backup')
  fs.rmSync(path.join(backupDir(), id), { recursive: true, force: true })
}

/** Runs today's backup if it is due. Called every 10 minutes (src/instrumentation.ts). */
export async function backupTick(payload: Payload) {
  if (process.env.UP_DISABLE_BACKUPS === '1') return 'off'
  const s = await settingsOf(payload)
  if (s.backupsEnabled === false) return 'off'
  const last = listBackups().find((b) => b.reason === 'Daily' || b.reason.startsWith('Manual'))
  const hour = Math.min(23, Math.max(0, Number(s.backupHour ?? 3)))
  const now = new Date()
  const age = last ? Date.now() - Date.parse(last.createdAt) : Infinity
  const doneToday = last ? new Date(last.createdAt).toDateString() === now.toDateString() : false
  // Due at the chosen hour once a day, or any time if the last one is over 26 hours old.
  if (age > 26 * 3_600_000 || (now.getHours() >= hour && !doneToday && age > 6 * 3_600_000)) {
    await createBackup(payload, 'Daily')
    return 'done'
  }
  return 'not due'
}
