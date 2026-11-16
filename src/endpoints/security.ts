import { execFile } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import type { Endpoint, PayloadRequest } from 'payload'

import { hasRole } from '@/access/roles'
import { siteCodeAvailable, supervisor } from '@/siteCode/supervisor'

/**
 * Settings > Security.
 *   GET  /api/up/security   the last check of the live version, and the last update it refused
 *   POST /api/up/security   check now
 * Administrators only. In Docker the supervisor runs the check (docker/security-check.mjs,
 * its own copy) and checks again once a day. Outside Docker (pnpm dev) the check runs here.
 */

export type SecurityFinding = {
  rule: string
  severity: 'critical' | 'warning'
  title: string
  why: string
  fix: string
  file: string
  line: number
  code: string
  reason?: string
}
export type SecurityResult = {
  ok: boolean
  scannedAt: string
  version?: string
  files: number
  critical: SecurityFinding[]
  warnings: SecurityFinding[]
  markedSafe: SecurityFinding[]
  packages: {
    checked: boolean
    reason?: string
    counts?: { critical: number; high: number; moderate: number; low: number }
    items?: { package: string; severity: string; title: string; fixedIn: string; url: string }[]
  }
  forClaude?: string
  deep?: SecurityResultDeep
}
export type SecurityResultDeep = { ran: boolean; error?: string; hints: number; sameAsOfficial: number } | null
export type AddonState = {
  id: 'deep-check'
  available: boolean
  enabled: boolean
  version: string | null
  installedAt: string | null
  installing: boolean
  error: string | null
}
export type SecurityState = {
  live: SecurityResult | null
  refused: SecurityResult | null
  local?: boolean
  addons?: AddonState[]
}

const localFile = () => path.join(os.tmpdir(), 'ultimapress-security.json')

const runLocally = () =>
  new Promise<SecurityResult>((resolve, reject) => {
    const script = path.join(process.cwd(), 'docker', 'security-check.mjs')
    if (!fs.existsSync(script)) return reject(new Error('The security check is not part of this installation.'))
    execFile(
      process.execPath,
      [script, process.cwd(), '--json'],
      { cwd: process.cwd(), timeout: 120_000, maxBuffer: 20 * 1024 * 1024 },
      (_err, stdout) => {
        // Exit code 1 only means critical problems were found.
        try {
          const result = JSON.parse(stdout) as SecurityResult
          fs.writeFileSync(localFile(), JSON.stringify({ ...result, version: 'this folder' }))
          resolve({ ...result, version: 'this folder' })
        } catch {
          reject(new Error('The security check could not run.'))
        }
      },
    )
  })

export async function securityAddons(): Promise<AddonState[] | undefined> {
  if (!siteCodeAvailable()) return undefined
  const res = await supervisor('/addons')
  return res.ok ? (res.data.addons as AddonState[]) : undefined
}

export async function securityState(check = false): Promise<SecurityState> {
  if (siteCodeAvailable()) {
    const res = await supervisor('/security', check ? {} : undefined)
    if (!res.ok) throw new Error(String(res.data.error || 'The security check is not available right now.'))
    return { ...(res.data as unknown as SecurityState), addons: await securityAddons() }
  }
  if (check) return { live: await runLocally(), refused: null, local: true }
  try {
    return { live: JSON.parse(fs.readFileSync(localFile(), 'utf8')), refused: null, local: true }
  } catch {
    return { live: null, refused: null, local: true }
  }
}

const deny = () => Response.json({ error: 'Administrators only' }, { status: 403 })
const admin = (req: PayloadRequest) => hasRole(req.user, 'admin')
const fail = (err: unknown) =>
  Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })

export const securityEndpoints: Endpoint[] = [
  {
    // Add-ons: GET their state, POST { id: 'deep-check', enabled: boolean } to turn one on or off.
    path: '/up/security/addons',
    method: 'get',
    handler: async (req) => {
      if (!admin(req)) return deny()
      const addons = await securityAddons().catch(() => undefined)
      return Response.json({ addons: addons || [], available: siteCodeAvailable() })
    },
  },
  {
    path: '/up/security/addons',
    method: 'post',
    handler: async (req) => {
      if (!admin(req)) return deny()
      if (!siteCodeAvailable()) {
        return Response.json({ error: 'Add-ons are installed on your server, so they are not available here.' }, { status: 400 })
      }
      const body = ((await req.json?.().catch(() => ({}))) || {}) as { id?: unknown; enabled?: unknown }
      if (body.id !== 'deep-check' || typeof body.enabled !== 'boolean') {
        return Response.json({ error: 'Unknown add-on.' }, { status: 400 })
      }
      const res = await supervisor('/addons', { id: body.id, enabled: body.enabled })
      return Response.json(res.data, { status: res.ok ? 200 : res.status })
    },
  },
  {
    path: '/up/security',
    method: 'get',
    handler: async (req) => {
      if (!admin(req)) return deny()
      try {
        return Response.json(await securityState())
      } catch (err) {
        return fail(err)
      }
    },
  },
  {
    path: '/up/security',
    method: 'post',
    handler: async (req) => {
      if (!admin(req)) return deny()
      try {
        return Response.json(await securityState(true))
      } catch (err) {
        return fail(err)
      }
    },
  },
]
