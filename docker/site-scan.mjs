/**
 * "Scan my site" add-on (Settings > Security > Add-ons).
 *
 * Tests the running site from the outside, the way a visitor or an attacker would see it:
 *   - OWASP ZAP: follows the site's pages and forms and reports unsafe responses
 *     (passive checks only: it reads what the site sends back and never submits forms,
 *     so a scan cannot create posts, comments or form entries)
 *   - Nuclei: checks for known problems and misconfigurations (exposed files, outdated
 *     software, wrong server settings), without its intrusive, fuzzing or DoS checks
 *
 * It only ever scans this site's own address, worked out on the server. No address is
 * ever taken from a request, so it cannot be pointed at someone else's site.
 *
 * The tools are downloaded only when an administrator turns the add-on on: pinned
 * versions from their official GitHub releases, each checked against its SHA-256 before
 * use, kept on the data volume so they survive image updates, and deleted when it is
 * turned off. Run by docker/supervisor.mjs. Plain Node, no dependencies.
 */
import { spawn, spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const TOOLS = {
  zap: {
    version: '2.17.0',
    any: {
      url: 'https://github.com/zaproxy/zaproxy/releases/download/v2.17.0/ZAP_2.17.0_Linux.tar.gz',
      sha256: 'efe799aaa3627db683b43f00c9c210aea0b75c00cc8f0a0f0434d12bb3ddde5a',
    },
  },
  // ZAP needs Java. Temurin JRE built for Alpine Linux, which the UltimaPress image uses.
  java: {
    version: '21.0.13+9',
    x64: {
      url: 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13%2B9/OpenJDK21U-jre_x64_alpine-linux_hotspot_21.0.13_9.tar.gz',
      sha256: '9138eab0f7d230e17163953f015ec9ae2431dbc49069c658b7f991e45b54fb9b',
    },
    arm64: {
      url: 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13%2B9/OpenJDK21U-jre_aarch64_alpine-linux_hotspot_21.0.13_9.tar.gz',
      sha256: '382633eb2ba28cc5b97be1446eb1dd8d2a60a3795be0166a030e4cda338c490e',
    },
  },
  nuclei: {
    version: '3.11.1',
    x64: {
      url: 'https://github.com/projectdiscovery/nuclei/releases/download/v3.11.1/nuclei_3.11.1_linux_amd64.zip',
      sha256: 'ea63d4ae232808cd7c6bc00d0142428e231fab59dae01042246097d195835ab6',
    },
    arm64: {
      url: 'https://github.com/projectdiscovery/nuclei/releases/download/v3.11.1/nuclei_3.11.1_linux_arm64.zip',
      sha256: '8044e3d9768ba0a744b2872c1a87e813006f013da97ca9f50f7661a4203bec07',
    },
  },
}

const asset = (tool) => TOOLS[tool][process.arch] || TOOLS[tool].any

// ---------------------------------------------------------------- helpers

const readJSON = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}
const writeJSON = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 2))
  fs.renameSync(`${file}.tmp`, file)
}

const DOWNLOADER = fileURLToPath(new URL('./download.mjs', import.meta.url))

/** Downloads in a separate process and checks the SHA-256 before anything is used. */
const download = async (url, file, sha256) => {
  const r = await run(process.execPath, [DOWNLOADER, url, file], { env: {}, timeoutMs: 25 * 60_000 })
  if (r.code !== 0) throw new Error(`A download failed. ${r.err}`.trim())
  if (r.out.trim() !== sha256) {
    fs.rmSync(file, { force: true })
    throw new Error('A downloaded tool did not match its checksum, so nothing was installed.')
  }
}

const untar = (file, dir) => {
  fs.mkdirSync(dir, { recursive: true })
  const r = spawnSync('tar', ['-xzf', file, '-C', dir, '--strip-components=1'], { timeout: 10 * 60_000 })
  if (r.status !== 0) throw new Error('A downloaded tool could not be unpacked.')
}

/** Extracts one file from a zip (the nuclei binary), without needing unzip. */
const unzipOne = (zipFile, name, outFile) => {
  const buf = fs.readFileSync(zipFile)
  let eocd = buf.length - 22
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--
  if (eocd < 0) throw new Error('A downloaded tool could not be unpacked.')
  let p = buf.readUInt32LE(eocd + 16)
  const count = buf.readUInt16LE(eocd + 10)
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break
    const method = buf.readUInt16LE(p + 10)
    const size = buf.readUInt32LE(p + 20)
    const nameLen = buf.readUInt16LE(p + 28)
    const extraLen = buf.readUInt16LE(p + 30)
    const commentLen = buf.readUInt16LE(p + 32)
    const local = buf.readUInt32LE(p + 42)
    const entry = buf.toString('utf8', p + 46, p + 46 + nameLen)
    if (entry === name) {
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
      const data = buf.subarray(start, start + size)
      fs.writeFileSync(outFile, method === 8 ? zlib.inflateRawSync(data) : data, { mode: 0o755 })
      return
    }
    p += 46 + nameLen + extraLen + commentLen
  }
  throw new Error('A downloaded tool was not complete.')
}

const run = (cmd, args, { env, timeoutMs, cwd }) =>
  new Promise((resolve) => {
    let out = ''
    let err = ''
    let p
    try {
      p = spawn(cmd, args, { env: { ...process.env, ...env }, cwd })
    } catch (e) {
      return resolve({ code: -1, out: '', err: e.message })
    }
    const timer = setTimeout(() => p.kill('SIGKILL'), timeoutMs)
    p.stdout.on('data', (d) => (out = (out + d).slice(-4_000_000)))
    p.stderr.on('data', (d) => (err = (err + d).slice(-4000)))
    p.on('error', (e) => {
      clearTimeout(timer)
      resolve({ code: -1, out, err: e.message })
    })
    p.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, out, err })
    })
  })

/** How many checks Nuclei has (its templates are .yaml files). */
const countTemplates = (dir) => {
  let n = 0
  const walk = (d) => {
    let entries = []
    try {
      entries = fs.readdirSync(d, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (n >= 1000) return
      if (e.isDirectory()) walk(path.join(d, e.name))
      else if (e.name.endsWith('.yaml')) n++
    }
  }
  walk(dir)
  return n
}

/**
 * Results that are known not to be problems on UltimaPress.
 *   hide:   false alarms, not shown at all
 *   accept: true, but a choice UltimaPress makes on purpose; shown collapsed with the reason
 */
const ACCEPTED_CSP =
  'Script and style rules are kept open on purpose so your embeds, analytics, Turnstile and own code snippets keep working. The policy still blocks other sites from framing your pages, plugins, and changes to the page address.'
const triage = (alert, instances) => {
  const name = String(alert.name || alert.alert || '')
  // Ordinary numbers inside the site's own JavaScript files, not dates that leak anything.
  if (/^Timestamp Disclosure/i.test(name) && instances.every((i) => /\/_next\/static\//.test(i.uri || ''))) return { hide: true }
  // The admin's light or dark mode setting, which the page has to read.
  if (/Cookie No HttpOnly Flag/i.test(name) && instances.every((i) => /payload-theme/.test(i.evidence || ''))) return { hide: true }
  if (/^CSP:/i.test(name)) return { accept: ACCEPTED_CSP }
  return {}
}

const plain = (html) =>
  String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// ---------------------------------------------------------------- the add-on

/**
 * @param {{ dataDir: string, target: () => string, busy: () => boolean, log: (m: string) => void }} o
 */
export function createSiteScan({ dataDir, target, busy, log }) {
  const DIR = path.join(dataDir, 'addons', 'site-scan')
  const STATE = path.join(DIR, 'state.json')
  const LAST = path.join(DIR, 'last-scan.json')
  const JAVA = path.join(DIR, 'java', 'bin', 'java')
  const ZAP = path.join(DIR, 'zap')
  const NUCLEI = path.join(DIR, 'nuclei')
  const HOME = path.join(DIR, 'home') // nuclei keeps its templates and settings here
  const javaEnv = () => ({
    JAVA_HOME: path.join(DIR, 'java'),
    PATH: `${path.join(DIR, 'java', 'bin')}:${process.env.PATH || ''}`,
    JAVA_TOOL_OPTIONS: '',
  })

  let install = null // { state: 'installing' | 'failed', step?, error? }
  let scan = null // { state: 'running', step, startedAt }

  const available = Boolean(TOOLS.java[process.arch] && TOOLS.nuclei[process.arch])

  const state = () => {
    const s = readJSON(STATE, null)
    const installed = Boolean(s?.enabled) && fs.existsSync(NUCLEI) && fs.existsSync(path.join(ZAP, `zap-${TOOLS.zap.version}.jar`))
    return {
      id: 'site-scan',
      available,
      enabled: installed,
      version: installed ? `ZAP ${TOOLS.zap.version}, Nuclei ${TOOLS.nuclei.version}` : null,
      installedAt: installed ? s.installedAt : null,
      installing: install?.state === 'installing',
      step: install?.state === 'installing' ? install.step : null,
      error: install?.state === 'failed' && !installed ? install.error : null,
      scanning: Boolean(scan),
      scanStep: scan?.step || null,
      target: installed ? target() : null,
    }
  }

  const doInstall = async () => {
    fs.rmSync(DIR, { recursive: true, force: true })
    fs.mkdirSync(HOME, { recursive: true })
    const tmp = path.join(DIR, 'downloads')
    fs.mkdirSync(tmp, { recursive: true })
    try {
      install.step = 'Downloading Java'
      const java = asset('java')
      await download(java.url, path.join(tmp, 'java.tar.gz'), java.sha256)
      untar(path.join(tmp, 'java.tar.gz'), path.join(DIR, 'java'))

      install.step = 'Downloading ZAP'
      const zap = asset('zap')
      await download(zap.url, path.join(tmp, 'zap.tar.gz'), zap.sha256)
      untar(path.join(tmp, 'zap.tar.gz'), ZAP)

      install.step = 'Downloading Nuclei'
      const nuclei = asset('nuclei')
      await download(nuclei.url, path.join(tmp, 'nuclei.zip'), nuclei.sha256)
      unzipOne(path.join(tmp, 'nuclei.zip'), 'nuclei', NUCLEI)
      fs.rmSync(tmp, { recursive: true, force: true })

      install.step = 'Checking the tools work on this server'
      const j = spawnSync(JAVA, ['-version'], { timeout: 60_000, env: { ...process.env, ...javaEnv() } })
      if (j.status !== 0) throw new Error('Java was downloaded but does not run on this server.')
      const n = spawnSync(NUCLEI, ['-version', '-disable-update-check'], { timeout: 60_000, env: { ...process.env, HOME } })
      if (n.status !== 0) throw new Error('Nuclei was downloaded but does not run on this server.')

      install.step = 'Downloading the Nuclei checks'
      // No -disable-update-check here: with it, Nuclei skips downloading its checks altogether.
      const t = await run(NUCLEI, ['-update-templates', '-silent'], {
        env: { HOME },
        timeoutMs: 10 * 60_000,
      })
      if (t.code !== 0 || countTemplates(path.join(HOME, 'nuclei-templates')) < 1000) {
        throw new Error('The Nuclei checks could not be downloaded. Try again in a few minutes.')
      }
    } catch (e) {
      fs.rmSync(DIR, { recursive: true, force: true })
      throw e
    }
    writeJSON(STATE, { enabled: true, installedAt: new Date().toISOString() })
    log('site scan installed')
  }

  const set = (enabled) => {
    if (!available) throw new Error('Scan my site is not available for this type of server.')
    if (enabled) {
      if (install?.state === 'installing' || state().enabled) return state()
      install = { state: 'installing', step: 'Starting' }
      doInstall()
        .then(() => (install = null))
        .catch((e) => {
          install = { state: 'failed', error: e.message }
          log(`site scan install failed: ${e.message}`)
        })
    } else {
      if (install?.state === 'installing' || scan) {
        throw new Error('Scan my site is busy. Try again when it has finished.')
      }
      install = null
      fs.rmSync(DIR, { recursive: true, force: true })
      log('site scan removed')
    }
    return state()
  }

  // ---------------------------------------------------------------- scanning

  const zapScan = async (url) => {
    const work = path.join(DIR, 'zap-run')
    fs.rmSync(work, { recursive: true, force: true })
    fs.mkdirSync(work, { recursive: true })
    const report = path.join(work, 'report.json')
    // Spider, then passive checks only (no active scan): reads responses, never attacks.
    const plan = [
      'env:',
      '  contexts:',
      '    - name: site',
      `      urls: ["${url}"]`,
      // Single quotes: YAML keeps the backslashes of the pattern as they are.
      `      includePaths: ['${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*']`,
      '  parameters:',
      '    failOnError: false',
      '    progressToStdout: false',
      'jobs:',
      '  - type: spider',
      // Never fill in or send the site's forms, so a scan cannot create entries or comments.
      '    parameters: { context: site, maxDuration: 3, maxChildren: 50, processForm: false, postForm: false }',
      '  - type: passiveScan-wait',
      '    parameters: { maxDuration: 5 }',
      '  - type: report',
      `    parameters: { template: traditional-json, reportDir: "${work}", reportFile: report.json }`,
      '',
    ].join('\n')
    fs.writeFileSync(path.join(work, 'plan.yaml'), plan)
    // Java runs ZAP directly: its zap.sh start script needs bash, which the UltimaPress image
    // (Alpine Linux) does not have.
    const r = await run(
      JAVA,
      [
        '-Xmx768m',
        '-jar', path.join(ZAP, `zap-${TOOLS.zap.version}.jar`),
        '-cmd', '-silent',
        '-dir', path.join(work, 'home'),
        '-autorun', path.join(work, 'plan.yaml'),
      ],
      { env: javaEnv(), timeoutMs: 15 * 60_000, cwd: ZAP },
    )
    const data = readJSON(report, null)
    if (!data) return { ran: false, error: `ZAP did not finish. ${r.err.trim().split('\n').pop() || ''}`.trim() }
    const risk = (rd) => String(rd || '').split(' ')[0].toLowerCase() // "High (Medium)" -> "high"
    const findings = []
    const accepted = []
    let hidden = 0
    for (const site of data.site || []) {
      for (const a of site.alerts || []) {
        const level = risk(a.riskdesc)
        if (level === 'informational') continue
        const t = triage(a, a.instances || [])
        if (t.hide) {
          hidden++
          continue
        }
        if (t.accept) {
          accepted.push({ tool: 'ZAP', severity: level, title: a.name || a.alert, reason: t.accept })
          continue
        }
        findings.push({
          tool: 'ZAP',
          severity: level,
          title: a.name || a.alert,
          detail: plain(a.desc).slice(0, 600),
          fix: plain(a.solution).slice(0, 600),
          where: (a.instances || []).slice(0, 3).map((i) => i.uri),
          count: Number(a.count || (a.instances || []).length || 1),
          ref: a.cweid && a.cweid !== '-1' ? `CWE-${a.cweid}` : '',
        })
      }
    }
    return { ran: true, findings, accepted, hidden }
  }

  const nucleiScan = async (url) => {
    // Get the newest checks first (new known problems are added every week). If that fails,
    // the checks already on the server are used.
    await run(NUCLEI, ['-update-templates', '-silent'], { env: { HOME }, timeoutMs: 5 * 60_000 })
    const r = await run(
      NUCLEI,
      [
        '-u', url,
        '-jsonl', '-silent', '-nc',
        '-disable-update-check',
        '-ni', // no outside callback server
        // Automatic scan: Nuclei first works out what the site runs on, then only uses the
        // checks that apply to it, so a scan takes minutes instead of hours.
        '-as',
        '-rl', '30', '-c', '10', '-timeout', '10', '-mhe', '30',
        '-severity', 'low,medium,high,critical',
        '-etags', 'intrusive,dos,fuzz,bruteforce,osint',
      ],
      { env: { HOME }, timeoutMs: 20 * 60_000 },
    )
    if (r.code !== 0 && !r.out) return { ran: false, error: `Nuclei did not finish. ${r.err.trim().split('\n').pop() || ''}`.trim() }
    const findings = []
    const seen = new Set()
    for (const line of r.out.split('\n')) {
      if (!line.trim()) continue
      let f
      try {
        f = JSON.parse(line)
      } catch {
        continue
      }
      const key = `${f['template-id']}|${f['matched-at']}`
      if (seen.has(key)) continue
      seen.add(key)
      findings.push({
        tool: 'Nuclei',
        severity: String(f.info?.severity || 'low'),
        title: f.info?.name || f['template-id'],
        detail: plain(f.info?.description).slice(0, 600),
        fix: plain(f.info?.remediation).slice(0, 600),
        where: [f['matched-at']].filter(Boolean),
        count: 1,
        ref: (f.info?.classification?.['cve-id'] || [])[0] || '',
      })
    }
    return { ran: true, findings }
  }

  const order = { critical: 0, high: 1, medium: 2, low: 3 }

  const start = () => {
    if (!state().enabled) throw new Error('Turn on Scan my site first.')
    if (scan) return state()
    if (busy()) throw new Error('An update is running. Scan again when it has finished.')
    const url = target()
    scan = { step: 'Looking through your site with ZAP', startedAt: new Date().toISOString() }
    ;(async () => {
      const zap = await zapScan(url)
      scan.step = 'Checking for known problems with Nuclei'
      const nuclei = await nucleiScan(url)
      const findings = [...(zap.findings || []), ...(nuclei.findings || [])].sort(
        (a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9),
      )
      const count = (s) => findings.filter((f) => f.severity === s).length
      writeJSON(LAST, {
        target: url,
        startedAt: scan.startedAt,
        finishedAt: new Date().toISOString(),
        tools: {
          zap: { ran: zap.ran, error: zap.error || null, version: TOOLS.zap.version },
          nuclei: { ran: nuclei.ran, error: nuclei.error || null, version: TOOLS.nuclei.version },
        },
        counts: { critical: count('critical'), high: count('high'), medium: count('medium'), low: count('low') },
        findings: findings.slice(0, 200),
        accepted: zap.accepted || [],
        hidden: zap.hidden || 0,
      })
      log(`site scan finished: ${findings.length} findings`)
    })()
      .catch((e) => log(`site scan failed: ${e.message}`))
      .finally(() => {
        scan = null
        fs.rmSync(path.join(DIR, 'zap-run'), { recursive: true, force: true })
      })
    return state()
  }

  const result = () => readJSON(LAST, null)

  return { state, set, start, result }
}
