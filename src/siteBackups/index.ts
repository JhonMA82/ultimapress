import { spawn } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'
import type { Readable } from 'stream'

import { migrations } from '@/migrations'
import { isNewer, upVersion } from '@/utilities/version'

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
  /** The UltimaPress version that made it. */
  version?: string
  /** Set when the backup came from an uploaded file. */
  uploaded?: boolean
  /** Accounts to remove after restoring (the demo's own login, for example). */
  removeUsers?: string[]
}

const dataDir = () =>
  process.env.UP_DATA_DIR || (fs.existsSync('/app/data') ? '/app/data' : path.join(process.cwd(), 'data'))
export const backupDir = () => process.env.UP_BACKUP_DIR || path.join(dataDir(), 'backups')
const mediaDir = () => process.env.MEDIA_DIR || path.join(process.cwd(), 'public', 'media')
const bin = (name: string) => (process.env.UP_PG_BIN ? path.join(process.env.UP_PG_BIN, name) : name)

const ID = /^\d{8}-\d{6}(-[a-z0-9]{1,12})?$/

/** Runs a command and returns what it printed. */
const output = (cmd: string, args: string[]) =>
  new Promise<string>((resolve, reject) => {
    const c = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    c.stdout.on('data', (d) => {
      out += d.toString()
      if (out.length > 5_000_000) c.kill()
    })
    c.stderr.on('data', (d) => (err = (err + d.toString()).slice(-2000)))
    c.on('error', (e) => reject(new Error(`${cmd}: ${e.message}`)))
    c.on('exit', (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} failed: ${err.trim() || `exit ${code}`}`))))
  })

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

const stampNow = () => new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)

export async function createBackup(
  payload: Payload,
  reason: string,
  extra: Pick<BackupInfo, 'removeUsers'> = {},
): Promise<BackupInfo> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.')
  if (!lock()) throw new Error('A backup is already running. Try again in a few minutes.')
  const settings = await settingsOf(payload)
  const stamp = stampNow()
  const id = fs.existsSync(path.join(backupDir(), stamp)) ? `${stamp}-${crypto.randomBytes(3).toString('hex')}` : stamp
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
      version: upVersion() || undefined,
      ...(extra.removeUsers?.length ? { removeUsers: extra.removeUsers } : {}),
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

/** Empties the database and loads a dump into it. */
async function loadDump(file: string) {
  const url = process.env.DATABASE_URL || ''
  // Start from an empty database, so tables added by a newer version do not get in the way of its migrations.
  await run(bin('psql'), ['-v', 'ON_ERROR_STOP=1', '-q', '-d', url, '-c', 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;'])
  await run(bin('pg_restore'), ['--no-owner', '--no-privileges', '--single-transaction', '-d', url, file])
}

type Account = Record<string, unknown> & { id: number | string; email: string }

/**
 * Puts a backup back: the database, and the media folder when asked. A safety backup is taken first,
 * and put back automatically if loading fails. `keepUserId` is the administrator doing the restore:
 * their account and password are kept, so they stay able to log in.
 */
export async function restoreBackup(payload: Payload, id: string, withMedia: boolean, keepUserId?: number | string) {
  const db = backupFile(id, 'db.dump')
  if (!db) throw new Error('That backup was not found.')
  const info = readInfo(id)
  const current = upVersion()
  if (info?.version && current && isNewer(info.version, current)) {
    throw new Error(`This backup is from UltimaPress ${info.version}. Update this site to ${info.version} or newer first.`)
  }
  const me = keepUserId
    ? ((await payload.db.findOne({ collection: 'users', where: { id: { equals: keepUserId } } })) as Account | null)
    : null

  const safety = await createBackup(payload, `Before restoring ${id}`)
  if (!lock()) throw new Error('A backup is running. Try again in a few minutes.')
  try {
    try {
      await loadDump(db)
    } catch (err) {
      const back = backupFile(safety.id, 'db.dump')
      if (back) await loadDump(back).catch(() => undefined)
      throw new Error(`The backup could not be loaded, so nothing was changed. ${err instanceof Error ? err.message : ''}`.trim())
    }
    const media = backupFile(id, 'media.tar.gz')
    if (withMedia && media) {
      fs.mkdirSync(mediaDir(), { recursive: true })
      await run('tar', ['-xzf', media, '-C', mediaDir()])
    }
  } finally {
    unlock()
  }

  // A backup from an older version gets this version's database changes (in development the schema is pushed on restart).
  if (process.env.NODE_ENV === 'production') await payload.db.migrate({ migrations: migrations as never })

  if (me?.email) await keepAccount(payload, me, info?.removeUsers || [])
}

/** After a restore: the administrator who restored keeps their login; listed accounts are removed. */
async function keepAccount(payload: Payload, me: Account, removeUsers: string[]) {
  const login = {
    hash: me.hash,
    salt: me.salt,
    role: 'admin',
    loginAttempts: 0,
    lockUntil: null,
    twoFactorEnabled: me.twoFactorEnabled ?? false,
    twoFactorSecret: me.twoFactorSecret ?? null,
  }
  const found = (await payload.db.findOne({ collection: 'users', where: { email: { equals: me.email } } })) as Account | null
  if (found) {
    await payload.db.updateOne({ collection: 'users', id: found.id, data: login })
  } else {
    const created = await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { email: me.email, name: String(me.name || me.email), role: 'admin', password: crypto.randomBytes(24).toString('hex') } as never,
    })
    await payload.db.updateOne({ collection: 'users', id: created.id, data: login })
  }
  for (const email of removeUsers) {
    if (email.toLowerCase() === me.email.toLowerCase()) continue
    await payload.delete({ collection: 'users', where: { email: { equals: email } }, overrideAccess: true }).catch(() => undefined)
  }
}

/** A backup as one file (info.json, db.dump and media.tar.gz in a tar), to move a site to another server. */
export function backupPackage(id: string): Readable | null {
  if (!ID.test(id)) return null
  const dir = path.join(backupDir(), id)
  if (!fs.existsSync(path.join(dir, 'db.dump')) || !fs.existsSync(path.join(dir, 'info.json'))) return null
  const files = ['info.json', 'db.dump', ...(fs.existsSync(path.join(dir, 'media.tar.gz')) ? ['media.tar.gz'] : [])]
  const c = spawn('tar', ['-cf', '-', '-C', dir, ...files], { stdio: ['ignore', 'pipe', 'ignore'] })
  return c.stdout
}

export const MAX_PACKAGE = 5 * 1024 * 1024 * 1024

const PACKAGE_FILES = new Set(['info.json', 'db.dump', 'media.tar.gz'])
const plain = (name: string) => name.replace(/^\.\//, '')

/** Only plain files and folders, with no path that leaves the folder they are unpacked into. */
async function safeArchive(file: string, gzip: boolean, only?: Set<string>) {
  const flag = gzip ? '-tzf' : '-tf'
  const names = (await output('tar', [flag, file])).split('\n').filter(Boolean)
  const long = (await output('tar', [gzip ? '-tzvf' : '-tvf', file])).split('\n').filter(Boolean)
  if (names.length !== long.length) return false
  if (!long.every((l) => (l[0] === '-' || l[0] === 'd') && !/ link to /.test(l))) return false
  return names.every((n) => {
    if (only) return only.has(plain(n))
    return !n.startsWith('/') && !n.split('/').includes('..') && !n.includes('\\')
  })
}

/**
 * Checks an uploaded site file (made by "Download as one file") and adds it to the backups list,
 * ready to restore. Nothing on the site changes until it is restored.
 */
export async function importPackage(file: string): Promise<BackupInfo> {
  const bad = () => new Error('This is not an UltimaPress site file. Use a file from Backups > Download as one file.')
  fs.mkdirSync(backupDir(), { recursive: true })
  const tmp = path.join(backupDir(), `.upload-${crypto.randomUUID()}`)
  try {
    if (!(await safeArchive(file, false, PACKAGE_FILES).catch(() => false))) throw bad()
    fs.mkdirSync(tmp)
    await run('tar', ['-xf', file, '-C', tmp])
    for (const name of fs.readdirSync(tmp)) {
      if (!PACKAGE_FILES.has(name) || !fs.lstatSync(path.join(tmp, name)).isFile()) throw bad()
    }
    const dump = path.join(tmp, 'db.dump')
    if (!fs.existsSync(dump)) throw bad()
    const head = Buffer.alloc(5)
    const fd = fs.openSync(dump, 'r')
    fs.readSync(fd, head, 0, 5, 0)
    fs.closeSync(fd)
    if (head.toString() !== 'PGDMP') throw bad()

    let from: Partial<BackupInfo> = {}
    try {
      from = JSON.parse(fs.readFileSync(path.join(tmp, 'info.json'), 'utf8'))
    } catch {
      throw bad()
    }
    const version = typeof from.version === 'string' && /^\d+\.\d+(\.\d+)?$/.test(from.version) ? from.version : undefined
    const current = upVersion()
    if (version && current && isNewer(version, current)) {
      throw new Error(`This file is from UltimaPress ${version}. Update this site to ${version} or newer first, then upload it again.`)
    }
    const media = path.join(tmp, 'media.tar.gz')
    if (fs.existsSync(media) && !(await safeArchive(media, true).catch(() => false))) {
      throw new Error('The images in this file could not be checked, so it was not added.')
    }
    const removeUsers = Array.isArray(from.removeUsers)
      ? from.removeUsers.filter((e): e is string => typeof e === 'string' && e.length < 200).slice(0, 20)
      : []
    const made = typeof from.createdAt === 'string' && !Number.isNaN(Date.parse(from.createdAt)) ? new Date(from.createdAt) : null

    const id = `${stampNow()}-upload`
    const info: BackupInfo = {
      id,
      createdAt: new Date().toISOString(),
      reason: made ? `Uploaded file (made ${made.toISOString().slice(0, 10)})` : 'Uploaded file',
      dbBytes: size(dump),
      mediaBytes: size(media),
      offsite: 'off',
      uploaded: true,
      ...(version ? { version } : {}),
      ...(removeUsers.length ? { removeUsers } : {}),
    }
    fs.writeFileSync(path.join(tmp, 'info.json'), JSON.stringify(info, null, 2))
    if (fs.existsSync(path.join(backupDir(), id))) throw new Error('Wait a few seconds and upload again.')
    fs.renameSync(tmp, path.join(backupDir(), id))
    return info
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
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
