/**
 * Update UltimaPress on a site that runs its own version (Build > Site code > Update UltimaPress).
 *
 * A site with its own features is built on one UltimaPress version (the "base"). To move it to
 * a newer one, three copies of the code are compared, file by file, the way developers merge:
 *   base    the official UltimaPress the site was built on
 *   ours    the site's own code (base plus its features)
 *   theirs  the new official UltimaPress
 * What only UltimaPress changed is taken from theirs, what only the site changed is kept, and
 * where both changed the same file the changes are combined line by line (git merge-file).
 * Lines changed on both sides are left marked for Claude, and nothing goes live.
 *
 * Official sources come from this image (/app), from a copy kept on the data volume, or from
 * the version's tag on GitHub. Run by docker/supervisor.mjs. Plain Node, no dependencies.
 */
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const SOURCE_REPO = process.env.UP_SOURCE_REPO || 'mrwebtv/ultimapress'
/** Versions released before tags existed: their commit on main. */
const COMMITS = { '1.1.3': '49c3eb3ac4e3c0215a888dadc5145dea6048def4' }

/** Folders and files that are never part of a site's source (same list as the code download). */
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'data', 'media', 'backups', 'test-results', 'playwright-report'])
const SKIP_PATHS = new Set(['public/media'])
const SKIP_FILE = /^(\.env(\..+)?|\.ultimapress-deploy\.json|tsconfig\.tsbuildinfo|.*\.(zip|tgz))$/

const LOCKFILE = 'pnpm-lock.yaml'
const PACKAGE = 'package.json'
const MIGRATIONS_DIR = 'src/migrations'
const MIGRATIONS_INDEX = 'src/migrations/index.ts'
/** Made again during the build, so the new version is always right. */
const REGENERATED = new Set(['src/app/(payload)/admin/importMap.js'])
const TYPES = 'src/payload-types.ts'

export const readJSON = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

export const versionOf = (dir) => String(readJSON(path.join(dir, PACKAGE), {}).version || '')

/** True when version a is newer than b (1.2.0 > 1.1.10). */
export const isNewer = (a, b) => {
  const pa = String(a).replace(/^v/, '').split('.').map(Number)
  const pb = String(b).replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0)
  return false
}
const validVersion = (v) => /^\d+\.\d+\.\d+$/.test(String(v))

/** Every source file of a site, as paths relative to its folder. */
export const sourceFiles = (root) => {
  const out = []
  const walk = (rel) => {
    let entries = []
    try {
      entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const p = rel ? `${rel}/${e.name}` : e.name
      if (e.isSymbolicLink()) continue
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name) && !SKIP_PATHS.has(p)) walk(p)
      } else if (e.isFile() && !SKIP_FILE.test(e.name)) out.push(p)
    }
  }
  walk('')
  return out
}

const read = (root, rel) => {
  try {
    return fs.readFileSync(path.join(root, rel))
  } catch {
    return null
  }
}
const same = (a, b) => (a === null || b === null ? a === b : a.equals(b))
const isBinary = (buf) => buf !== null && buf.subarray(0, 8000).includes(0)
const write = (root, rel, buf) => {
  const file = path.join(root, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, buf)
}

/** Copies a site's source (no node_modules, builds or data) into an empty folder. */
export const copySource = (from, to) => {
  fs.mkdirSync(to, { recursive: true })
  for (const rel of sourceFiles(from)) write(to, rel, fs.readFileSync(path.join(from, rel)))
}

// ---------------------------------------------------------------- special files

const sameJSON = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/** package.json: the new UltimaPress's, plus the packages and scripts the site added or changed. */
export const mergePackageJson = (b, o, t, notes) => {
  const base = JSON.parse(b || '{}')
  const ours = JSON.parse(o || '{}')
  const theirs = JSON.parse(t || '{}')
  const out = { ...theirs }
  for (const key of new Set([...Object.keys(base), ...Object.keys(ours)])) {
    if (key === 'version') continue
    const bv = base[key]
    const ov = ours[key]
    const tv = theirs[key]
    if (sameJSON(ov, bv) || sameJSON(ov, tv)) continue
    if (ov && tv && typeof ov === 'object' && !Array.isArray(ov) && typeof tv === 'object' && !Array.isArray(tv)) {
      // dependencies, devDependencies, scripts…: entry by entry.
      const section = { ...tv }
      const bs = bv && typeof bv === 'object' ? bv : {}
      for (const k of new Set([...Object.keys(bs), ...Object.keys(ov)])) {
        if (sameJSON(ov[k], bs[k]) || sameJSON(ov[k], tv[k])) continue
        if (!sameJSON(tv[k], bs[k])) {
          // Both changed it: the new UltimaPress needs its own version.
          notes.push(`package.json: kept UltimaPress's ${key}.${k} (${tv[k] ?? 'removed'}); your site had ${ov[k] ?? 'removed'}.`)
          continue
        }
        if (ov[k] === undefined) delete section[k]
        else section[k] = ov[k]
      }
      out[key] = section
    } else if (sameJSON(tv, bv)) {
      if (ov === undefined) delete out[key]
      else out[key] = ov
    }
  }
  return `${JSON.stringify(out, null, 2)}\n`
}

/** src/migrations/index.ts, listing every migration file in the folder, in date order. */
export const migrationsIndex = (dir) => {
  const names = fs
    .readdirSync(path.join(dir, MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .map((f) => f.slice(0, -3))
    .sort()
  const id = (n) => `migration_${n.replace(/[^\w]/g, '_')}`
  return [
    ...names.map((n) => `import * as ${id(n)} from './${n}';`),
    '',
    'export const migrations = [',
    ...names.map((n) => `  {\n    up: ${id(n)}.up,\n    down: ${id(n)}.down,\n    name: '${n}',\n  },`),
    '];',
    '',
  ].join('\n')
}

/** Combines both sets of changes with git merge-file. Returns { text, conflicts }. */
const mergeText = (b, o, t, { labels }) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'up-merge-'))
  try {
    const [fo, fb, ft] = ['ours', 'base', 'theirs'].map((n) => path.join(tmp, n))
    fs.writeFileSync(fo, o ?? '')
    fs.writeFileSync(fb, b ?? '')
    fs.writeFileSync(ft, t ?? '')
    const args = ['merge-file', '-p', '-L', labels[0], '-L', labels[1], '-L', labels[2], fo, fb, ft]
    const r = spawnSync('git', args, { maxBuffer: 64 * 1024 * 1024 })
    if (r.error) throw new Error(`git is needed to combine changes (${r.error.message}).`)
    if (r.status === null || r.status < 0 || r.status > 127) throw new Error(`git merge-file failed: ${String(r.stderr)}`)
    return { text: r.stdout, conflicts: r.status }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

/**
 * Writes the merged site into `out` (an empty folder).
 * Returns { conflicts: [{ file, why }], notes: [], typesMerged, lockChanged }.
 */
export const mergeSites = ({ base, ours, theirs, out, baseVersion, newVersion }) => {
  const labels = ['your site', `UltimaPress ${baseVersion}`, `UltimaPress ${newVersion}`]
  const conflicts = []
  const notes = []
  let typesMerged = false
  let indexChanged = false
  const all = new Set([...sourceFiles(base), ...sourceFiles(ours), ...sourceFiles(theirs)])
  fs.mkdirSync(out, { recursive: true })

  for (const rel of [...all].sort()) {
    const b = read(base, rel)
    const o = read(ours, rel)
    const t = read(theirs, rel)
    const keep = (buf) => buf !== null && write(out, rel, buf)

    if (same(o, t)) keep(o)
    else if (same(o, b)) keep(t) // only UltimaPress changed it (or removed it)
    else if (same(t, b)) keep(o) // only the site changed it (or added or removed it)
    else if (rel === PACKAGE) write(out, rel, mergePackageJson(b?.toString(), o?.toString(), t?.toString(), notes))
    else if (rel === LOCKFILE) keep(t) // rebuilt from package.json when the packages are installed
    else if (rel === MIGRATIONS_INDEX) indexChanged = true
    else if (REGENERATED.has(rel)) keep(t)
    else if (o === null || t === null) {
      // One side removed a file the other side changed: keep the changed one and ask.
      keep(o ?? t)
      conflicts.push({ file: rel, why: o === null ? 'Your site removed this file, but UltimaPress changed it.' : 'UltimaPress removed this file, but your site changed it.' })
    } else if (isBinary(o) || isBinary(t) || (b && isBinary(b))) {
      keep(o)
      conflicts.push({ file: rel, why: 'Both changed this file, and it is not text. Your version was kept.' })
    } else if (rel === TYPES) {
      // Generated from the collections: made again from the merged config after installing.
      keep(t)
      typesMerged = true
    } else {
      const r = mergeText(b, o, t, { labels })
      keep(r.text)
      if (r.conflicts > 0) conflicts.push({ file: rel, why: `Both changed the same lines (${r.conflicts} place${r.conflicts === 1 ? '' : 's'}, marked <<<<<<< your site).` })
    }
  }
  if (fs.existsSync(path.join(out, MIGRATIONS_DIR)) && (indexChanged || !fs.existsSync(path.join(out, MIGRATIONS_INDEX)))) {
    write(out, MIGRATIONS_INDEX, migrationsIndex(out))
  }
  const lockChanged = !same(read(out, LOCKFILE), read(theirs, LOCKFILE)) || !same(read(out, PACKAGE), read(theirs, PACKAGE))
  return { conflicts, notes, typesMerged, lockChanged }
}

/** The text to paste into a coding agent when some changes could not be combined. */
export const conflictsForClaude = ({ conflicts, baseVersion, newVersion }) => {
  const agentsConflicted = conflicts.some((c) => c.file === 'AGENTS.md')
  return [
    `I'm updating my UltimaPress site from ${baseVersion} to ${newVersion}. The update combined my site's own changes with the new UltimaPress, but these files were changed on both sides and need you:`,
    '',
    ...conflicts.map((c) => `- ${c.file}: ${c.why}`),
    '',
    'Read AGENTS.md first. ' +
      (agentsConflicted
        ? 'AGENTS.md is one of the files above: resolve its markers first, keeping both the Next.js block the tool writes and the site-specific rules, then follow the guide. '
        : '') +
      'In each file, the parts between <<<<<<< your site and >>>>>>> are the two versions. Combine them so my features keep working with the new UltimaPress, and remove every marker. Then run `npx tsc --noEmit` and `node docker/security-check.mjs`, fix anything they report, and put it live (or zip the folder for Site code).',
  ].join('\n')
}

// ---------------------------------------------------------------- official sources

/**
 * The official UltimaPress source for `version`, as a folder:
 * this image's own code, a copy kept on the data volume, or a download of the version's tag.
 */
export const createSources = ({ appDir, cacheDir, download, log = () => {} }) => {
  fs.mkdirSync(cacheDir, { recursive: true })
  const cached = (v) => path.join(cacheDir, v)

  /** Keeps a copy of this image's code, so later updates can compare against it. */
  const keepImage = () => {
    const v = versionOf(appDir)
    if (!validVersion(v) || fs.existsSync(path.join(cached(v), PACKAGE))) return
    const tmp = `${cached(v)}.copy`
    fs.rmSync(tmp, { recursive: true, force: true })
    copySource(appDir, tmp)
    fs.renameSync(tmp, cached(v))
    // The five newest versions are enough.
    const old = fs
      .readdirSync(cacheDir)
      .filter(validVersion)
      .sort((a, b) => (isNewer(a, b) ? -1 : 1))
      .slice(5)
    for (const o of old) fs.rmSync(cached(o), { recursive: true, force: true })
    log(`kept a copy of UltimaPress ${v}`)
  }

  const untar = (file, dest) =>
    new Promise((resolve, reject) => {
      const p = spawn('tar', ['-xzf', file, '-C', dest, '--no-same-owner'], { stdio: 'ignore' })
      p.on('error', reject)
      p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('The download could not be unpacked.'))))
    })

  const get = async (version) => {
    if (!validVersion(version)) throw new Error(`"${version}" is not an UltimaPress version.`)
    if (versionOf(appDir) === version) return appDir
    if (fs.existsSync(path.join(cached(version), PACKAGE))) return cached(version)
    const tmp = `${cached(version)}.download`
    fs.rmSync(tmp, { recursive: true, force: true })
    fs.mkdirSync(tmp, { recursive: true })
    try {
      const file = path.join(tmp, 'source.tar.gz')
      const ref = COMMITS[version] || `refs/tags/v${version}`
      await download(`https://github.com/${SOURCE_REPO}/archive/${ref}.tar.gz`, file).catch(() => {
        throw new Error(
          `UltimaPress ${version} could not be downloaded from GitHub (${SOURCE_REPO}). Check that the server can reach github.com.`,
        )
      })
      await untar(file, tmp)
      fs.rmSync(file)
      const inner = fs.readdirSync(tmp).map((d) => path.join(tmp, d)).find((d) => fs.existsSync(path.join(d, PACKAGE)))
      if (!inner || versionOf(inner) !== version) throw new Error(`The download of UltimaPress ${version} was not that version.`)
      fs.renameSync(inner, cached(version))
      return cached(version)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  }

  let latest = null
  /** The newest release on GitHub, checked at most every six hours (null if unknown). */
  const latestRelease = async () => {
    if (latest && Date.now() - latest.at < 6 * 3_600_000) return latest.version
    let version = null
    try {
      const r = await fetch(`https://api.github.com/repos/${SOURCE_REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(8000),
      })
      if (r.ok) version = String((await r.json()).tag_name || '').replace(/^v/, '') || null
    } catch {
      /* offline or rate limited */
    }
    latest = { at: Date.now(), version: validVersion(version) ? version : null }
    return latest.version
  }

  return { get, keepImage, latestRelease }
}
