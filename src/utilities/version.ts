import fs from 'fs'
import path from 'path'

import { siteCodeAvailable, supervisor } from '../siteCode/supervisor'

/** The installed UltimaPress version, from package.json (read once). */
let installed: string | null = null
export function upVersion(): string {
  if (installed === null) {
    try {
      installed = String(JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')).version || '')
    } catch {
      installed = ''
    }
  }
  return installed
}

/** The newest UltimaPress release on GitHub (without the "v"), checked at most every six hours. */
let release: { at: number; version: string | null } | null = null
export async function latestRelease(): Promise<string | null> {
  if (release && Date.now() - release.at < 6 * 3_600_000) return release.version
  let version: string | null = null
  try {
    const r = await fetch('https://api.github.com/repos/mrwebtv/ultimapress/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(5000),
    })
    if (r.ok) version = (((await r.json()) as { tag_name?: string }).tag_name || '').replace(/^v/, '') || null
  } catch {
    /* offline or rate limited */
  }
  release = { at: Date.now(), version }
  return version
}

/** True when version a is newer than b (1.2.0 > 1.1.10). */
export const isNewer = (a: string, b: string) => {
  const pa = a.replace(/^v/, '').split('.').map(Number)
  const pb = b.replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0)
  return false
}

/**
 * An update to show, or null. On a Docker install the server also knows about a newer
 * version already on the server (after Update in Docker Manager) while the site runs its own.
 */
export async function availableUpdate(): Promise<string | null> {
  if (siteCodeAvailable()) {
    const res = await supervisor('/upgrade').catch(() => null)
    if (res?.ok) return res.data.available ? String(res.data.target || '') || null : null
  }
  const latest = await latestRelease()
  const current = upVersion()
  return latest && current && isNewer(latest, current) ? latest : null
}

/** The last automatic update (Site code > automatic updates), for the dashboard. */
export async function lastAutoUpdate(): Promise<{ at: string; to?: string; ok: boolean } | null> {
  if (!siteCodeAvailable()) return null
  const res = await supervisor('/upgrade').catch(() => null)
  return (res?.ok && (res.data.lastAuto as { at: string; to?: string; ok: boolean } | null)) || null
}

export { siteCodeAvailable }

/** Where an update is installed: Site code on a Docker install, otherwise the releases page. */
export const updateHref = () => (siteCodeAvailable() ? '/admin/site-code' : RELEASES_URL)

export const RELEASES_URL = 'https://github.com/mrwebtv/ultimapress/releases'
