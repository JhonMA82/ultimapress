'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import { BUILD_FEATURE_STARTER, CodingAgentSetup } from '../CodingAgentSetup'

type Step = { key: string; label: string; state: 'waiting' | 'running' | 'done' | 'failed' }
type Job = {
  id: string
  kind: 'deploy' | 'revert' | 'upgrade'
  state: 'running' | 'done' | 'failed'
  steps: Step[]
  error?: string
  code?: string
  security?: {
    problems?: { title: string; file: string; line: number; code: string; fix: string }[]
    forClaude?: string
  }
  upgrade?: {
    from: string
    to: string
    notes?: string[]
    conflicts?: { file: string; why: string }[]
    download?: string
    forClaude?: string
  }
  log?: string
  finishedAt?: string
}
type Upgrade = {
  available?: boolean
  custom?: boolean
  current?: string
  image?: string
  target?: string | null
  autoUpdate?: boolean
  lastAuto?: { at: string; from?: string | null; to?: string | null; ok: boolean; error?: string | null; needsClaude?: boolean } | null
}
type Status = {
  available: boolean
  site?: string
  active?: string | null
  hasPrevious?: boolean
  release?: { createdAt: string; by?: string; note?: string } | null
  job?: Job | null
  staged?: { name: string; size: number; at: string } | null
  deployKey?: { createdAt: string } | null
}
type Ask =
  | { kind: 'upload'; file: File }
  | { kind: 'staged' }
  | { kind: 'revert'; to: 'previous' | 'official'; restoreData?: boolean }
  | { kind: 'key' }
  | { kind: 'upgrade'; to: string }
  | { kind: 'auto'; enabled: boolean }

const when = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} at ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
}
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

const TITLES: Record<Ask['kind'], string> = {
  upload: 'Put this version live',
  staged: 'Put the update live',
  revert: 'Go back',
  key: 'Create a deploy key',
  upgrade: 'Update UltimaPress',
  auto: 'Automatic updates',
}
const JOB_TITLES: Record<Job['kind'], [string, string]> = {
  deploy: ['Putting your new version live', 'Your new version is live'],
  revert: ['Going back', 'Done: the site went back'],
  upgrade: ['Updating UltimaPress', 'UltimaPress is up to date'],
}

export function SiteCodeClient() {
  const [status, setStatus] = useState<Status | null>(null)
  const [update, setUpdate] = useState<Upgrade | null>(null)
  const [ask, setAsk] = useState<Ask | null>(null)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [restarting, setRestarting] = useState(false)
  const [key, setKey] = useState<{ key: string; site: string } | null>(null)
  const [copied, setCopied] = useState('')
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const sawRunning = useRef(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/site-code/status', { credentials: 'include', cache: 'no-store' })
      if (!res.ok) throw new Error()
      setStatus(await res.json())
      setRestarting(false)
      const u = await fetch('/api/site-code/upgrade', { credentials: 'include', cache: 'no-store' })
      if (u.ok) setUpdate(await u.json())
    } catch {
      // The site restarts for a few seconds when a new version takes over.
      if (sawRunning.current) setRestarting(true)
    }
  }, [])

  const running = status?.job?.state === 'running'
  if (running) sawRunning.current = true

  useEffect(() => {
    void load()
    const t = setInterval(load, running || restarting ? 2000 : 8000)
    return () => clearInterval(t)
  }, [load, running, restarting])

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const t = document.createElement('textarea')
      t.value = text
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      t.remove()
    }
    setCopied(what)
    setTimeout(() => setCopied(''), 1800)
  }

  const open = (next: Ask) => {
    setAsk(next)
    setPassword('')
    setError('')
  }
  const pick = (file?: File | null) => {
    if (!file) return
    if (!/\.(zip|tgz|tar\.gz)$/i.test(file.name)) {
      setAsk(null)
      setError('Choose a .zip of your site folder.')
      return
    }
    open({ kind: 'upload', file })
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault()
    if (!ask || !password) return
    setBusy(true)
    setError('')
    try {
      let res: Response
      if (ask.kind === 'upload') {
        const form = new FormData()
        form.append('password', password)
        form.append('file', ask.file)
        res = await fetch('/api/site-code/upload', { method: 'POST', body: form, credentials: 'include' })
      } else {
        const path = ask.kind === 'staged' ? 'deploy' : ask.kind === 'auto' ? 'auto-update' : ask.kind
        const extra =
          ask.kind === 'revert'
            ? { to: ask.to, restoreData: ask.restoreData === true }
            : ask.kind === 'auto'
              ? { enabled: ask.enabled }
              : {}
        res = await fetch(`/api/site-code/${path}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ password, ...extra }),
        })
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.code === 'needs_data' && ask.kind === 'revert') {
          setAsk({ ...ask, restoreData: true })
          setError(`${data.error} Enter your password again to confirm.`)
          setPassword('')
          return
        }
        throw new Error(data.error || 'That did not work.')
      }
      if (ask.kind === 'key') setKey(data)
      else if (ask.kind === 'auto') setUpdate(data)
      // An update started from this page: show how it ends, here, until the page is left.
      else sawRunning.current = true
      setAsk(null)
      setPassword('')
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!status) return <p className="up-build__sub">Loading…</p>

  if (!status.available) {
    return (
      <section className="up-build__card">
        <h2>Not available here</h2>
        <p className="up-build__sub up-code__plain">
          Site code updates work on a site installed with Docker: the Deploy on Hostinger button or{' '}
          <code>install.sh</code>. This site is running another way (for example <code>pnpm dev</code>
          ), where you change the files directly.
        </p>
      </section>
    )
  }

  const job = status.job
  const custom = Boolean(status.active)
  const shipLine = key ? `node scripts/ship.mjs --site ${key.site} --key ${key.key}` : ''

  return (
    <>
      <p className={`up-code__now${custom ? ' is-custom' : ''}`}>
        <i aria-hidden="true" />
        {custom ? (
          <span>
            Running <strong>your own version</strong>, live since {when(status.release?.createdAt)}.
          </span>
        ) : (
          <span>
            Running the <strong>official UltimaPress</strong>, as installed.
          </span>
        )}
      </p>

      {(job?.state === 'running' || restarting) && job && (
        <section className="up-build__card up-code__job" aria-live="polite">
          <h2>
            {JOB_TITLES[job.kind][0]}
            {job.upgrade && ` ${job.upgrade.from} to ${job.upgrade.to}`}
          </h2>
          <p className="up-build__sub">
            This takes a few minutes. Your site stays online until the last step. You can leave this
            page.
          </p>
          <ol className="up-code__progress">
            {job.steps.map((s) => (
              <li key={s.key} className={`is-${s.state}`}>
                <i aria-hidden="true" />
                {s.label}
              </li>
            ))}
          </ol>
          {restarting && <p className="up-build__sub">Restarting the site…</p>}
        </section>
      )}

      {/* The result only shows to whoever is watching the update; a refresh clears it. */}
      {job && job.state !== 'running' && !restarting && sawRunning.current && (
        <section className={`up-build__card up-code__result is-${job.state}`} aria-live="polite">
          {job.state === 'done' ? (
            <>
              <h2>{JOB_TITLES[job.kind][1]}</h2>
              {job.upgrade && (
                <p className="up-build__sub">
                  Your site now runs UltimaPress {job.upgrade.to}, with all your own features.
                </p>
              )}
              {(job.upgrade?.notes || []).length > 0 && (
                <ul className="up-code__notes">
                  {(job.upgrade?.notes || []).map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              )}
              <p className="up-build__sub">
                Finished {when(job.finishedAt)}.{' '}
                <a className="up-build__link" href="/admin/site-code">
                  Reload the admin
                </a>{' '}
                to see it.
              </p>
            </>
          ) : (
            <>
              <h2>{job.code === 'conflicts' ? 'This update needs attention' : 'That update did not go live'}</h2>
              <p className="up-build__sub">
                Your site is still running the version it had before. Nothing was lost.
              </p>
              <p className="up-code__error">{job.error}</p>
              {job.code === 'conflicts' && job.upgrade?.conflicts && (
                <div className="up-code__problems">
                  <ul>
                    {job.upgrade.conflicts.map((c, i) => (
                      <li key={i}>
                        <strong>{c.file}</strong>
                        <span>{c.why}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="up-code__row">
                    {job.upgrade.download && (
                      <a
                        className="up-code__primary"
                        href={`/api/site-code/upgrade-download?id=${encodeURIComponent(job.upgrade.download)}`}
                      >
                        Download the updated code
                      </a>
                    )}
                    {job.upgrade.forClaude && (
                      <button type="button" className="up-build__copy" onClick={() => copy(job.upgrade?.forClaude || '', 'repair')}>
                        {copied === 'repair' ? 'Copied' : 'Copy repair prompt'}
                      </button>
                    )}
                  </div>
                </div>
              )}
              {job.code === 'security' && (job.security?.problems || []).length > 0 && (
                <div className="up-code__problems">
                  <ul>
                    {(job.security?.problems || []).map((p, i) => (
                      <li key={i}>
                        <strong>{p.title}</strong>
                        <span>
                          {p.file}, line {p.line}
                        </span>
                        <code>{p.code}</code>
                        <span>How to fix: {p.fix}</span>
                      </li>
                    ))}
                  </ul>
                  {job.security?.forClaude && (
                    <button type="button" className="up-build__copy" onClick={() => copy(job.security?.forClaude || '', 'repair')}>
                      {copied === 'repair' ? 'Copied' : 'Copy repair prompt'}
                    </button>
                  )}
                </div>
              )}
              <details className="up-code__log">
                <summary>What happened (show this to your agent)</summary>
                <pre>{job.log}</pre>
                <button type="button" className="up-build__copy" onClick={() => copy(job.log || '', 'log')}>
                  {copied === 'log' ? 'Copied' : 'Copy'}
                </button>
              </details>
            </>
          )}
        </section>
      )}

      {update?.current && !running && (
        <section className={`up-build__card${update.available ? ' up-code__staged' : ''}`}>
          <h2>{update.available && update.target ? `UltimaPress ${update.target} is ready` : 'UltimaPress updates'}</h2>
          <p className="up-build__sub">
            Your site runs UltimaPress {update.current}.{' '}
            {update.available
              ? update.custom
                ? 'Your own features are kept: they are brought over to the new version, checked, and only go live if the site starts.'
                : 'Your content is backed up first, and the site only switches over if the new version starts.'
              : 'It is the newest version.'}
          </p>
          <div className="up-code__row">
            {update.available && update.target && (
              <button type="button" className="up-code__primary" onClick={() => open({ kind: 'upgrade', to: update.target || '' })}>
                Update to {update.target}
              </button>
            )}
            <button
              type="button"
              className="up-build__copy"
              aria-pressed={Boolean(update.autoUpdate)}
              onClick={() => open({ kind: 'auto', enabled: !update.autoUpdate })}
            >
              {update.autoUpdate ? 'Automatic updates: on' : 'Turn on automatic updates'}
            </button>
          </div>
          <p className="up-code__note">
            {update.autoUpdate
              ? 'New versions are installed at night (1 to 5 am, server time), with the same checks. Your features are kept.'
              : 'Or let your site install new versions on its own at night, with the same checks.'}
          </p>
          {update.lastAuto && (
            <p className={`up-code__note${update.lastAuto.ok ? '' : ' up-code__error'}`}>
              {update.lastAuto.ok
                ? `Updated automatically to ${update.lastAuto.to} on ${when(update.lastAuto.at)}.`
                : update.lastAuto.needsClaude
                  ? `The automatic update to ${update.lastAuto.to} needs attention (${when(update.lastAuto.at)}). Click Update to see which files.`
                  : `The automatic update to ${update.lastAuto.to} did not go live (${when(update.lastAuto.at)}): ${update.lastAuto.error || ''} Your site kept its version.`}
            </p>
          )}
        </section>
      )}

      {status.staged && !running && (
        <section className="up-build__card up-code__staged">
          <h2>An update is waiting</h2>
          <p className="up-build__sub">
            Received {when(status.staged.at)} ({mb(status.staged.size)}). It is not live yet.
          </p>
          <div className="up-code__row">
            <button type="button" className="up-code__primary" onClick={() => open({ kind: 'staged' })}>
              Put the update live
            </button>
            <button
              type="button"
              className="up-build__copy"
              onClick={async () => {
                await fetch('/api/site-code/discard', { method: 'POST', credentials: 'include' })
                await load()
              }}
            >
              Discard
            </button>
          </div>
        </section>
      )}

      <div className="up-code__steps">
        <section className="up-build__card">
          <span className="up-code__num">1</span>
          <h2>Download your site&apos;s code</h2>
          <p className="up-build__sub up-code__plain">
            A zip of the version that is live right now. Unzip it on your computer.
          </p>
          <a className="up-code__primary" href="/api/site-code/download">
            Download the code
          </a>
        </section>

        <section className="up-build__card">
          <span className="up-code__num">2</span>
          <h2>Change it with your agent</h2>
          <p className="up-build__sub up-code__plain">
            <CodingAgentSetup />
          </p>
          <p className="up-build__sub up-code__plain">Start your request like this:</p>
          <div className="up-build__prompt">
            <code>{BUILD_FEATURE_STARTER}</code>
            <button type="button" className="up-build__copy" onClick={() => copy(BUILD_FEATURE_STARTER, 'starter')}>
              {copied === 'starter' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </section>

        <section className="up-build__card">
          <span className="up-code__num">3</span>
          <h2>Put it live</h2>
          <p className="up-build__sub up-code__plain">
            Tell your agent &ldquo;put it live&rdquo;. It runs <code>pnpm ship</code>, which sends
            the folder; the update waits here until you confirm with your password. Or zip the
            folder and drop it here.
          </p>
          <label
            className={`up-code__drop${drag ? ' is-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDrag(true)
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDrag(false)
              pick(e.dataTransfer.files?.[0])
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".zip,.tgz,.gz"
              disabled={running}
              onChange={(e) => {
                pick(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <strong>{running ? 'An update is running' : 'Choose a zip or drop it here'}</strong>
            <span>Leave out node_modules and .next</span>
          </label>
        </section>
      </div>

      {error && !ask && <p className="up-code__error">{error}</p>}

      <div className="up-build__grid">
        <section className="up-build__card">
          <h2>Let your agent put it live</h2>
          <p className="up-build__sub up-code__plain">
            A deploy key lets your agent send your changes here when you say &ldquo;put it
            live&rdquo;. Nothing goes live until you confirm it on this page with your password.
          </p>
          {key ? (
            <>
              <p className="up-build__sub up-code__plain">
                Run this line once in the terminal of your site&apos;s folder. It is only shown now,
                and it works like a password. After this, <code>pnpm ship</code> is enough; do not
                paste the key into a chat.
              </p>
              <div className="up-build__prompt">
                <code title={shipLine}>{shipLine}</code>
                <button type="button" className="up-build__copy" onClick={() => copy(shipLine, 'ship')}>
                  {copied === 'ship' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </>
          ) : (
            <>
              <button type="button" className="up-build__copy" onClick={() => open({ kind: 'key' })}>
                {status.deployKey ? 'Create a new deploy key' : 'Create a deploy key'}
              </button>
              {status.deployKey && (
                <p className="up-code__note">
                  A key was created {when(status.deployKey.createdAt)}. A new one replaces it.
                </p>
              )}
            </>
          )}
        </section>

        <section className="up-build__card">
          <h2>Go back</h2>
          {custom ? (
            <>
              <p className="up-build__sub up-code__plain">
                Not happy with the version that is live? Switch back. Your content is backed up
                first.
              </p>
              <div className="up-code__row">
                {status.hasPrevious && (
                  <button
                    type="button"
                    className="up-build__copy"
                    disabled={running}
                    onClick={() => open({ kind: 'revert', to: 'previous' })}
                  >
                    Previous version
                  </button>
                )}
                <button
                  type="button"
                  className="up-build__copy"
                  disabled={running}
                  onClick={() => open({ kind: 'revert', to: 'official' })}
                >
                  Official UltimaPress
                </button>
              </div>
              <p className="up-code__note">
                New UltimaPress versions show at the top of this page, and Update in Docker Manager
                brings your version over automatically. Your features are kept either way.
              </p>
            </>
          ) : (
            <p className="up-build__sub up-code__plain">
              You are on the official version. Once you put your own version live, you can switch
              back here at any time.
            </p>
          )}
        </section>
      </div>

      {ask && (
        <div className="up-code__overlay" role="dialog" aria-modal="true" aria-labelledby="up-code-ask">
          <form className="up-code__dialog" onSubmit={confirm}>
            <h2 id="up-code-ask">{TITLES[ask.kind]}</h2>
            {ask.kind === 'upload' && (
              <p>
                {ask.file.name} ({mb(ask.file.size)}). Your content is backed up, then the site is
                rebuilt. It takes a few minutes.
              </p>
            )}
            {ask.kind === 'staged' && (
              <p>Your content is backed up, then the site is rebuilt. It takes a few minutes.</p>
            )}
            {ask.kind === 'revert' && (
              <p>
                {ask.to === 'official'
                  ? 'The site switches back to the official UltimaPress.'
                  : 'The site switches back to the version before this one.'}
                {ask.restoreData && ' Content added since that update will be lost.'}
              </p>
            )}
            {ask.kind === 'key' && <p>Any deploy key you created before stops working.</p>}
            {ask.kind === 'auto' && (
              <p>
                {ask.enabled
                  ? 'Your site will install new UltimaPress versions on its own at night. Your content is backed up first, your features are kept, and it only switches over if the new version starts.'
                  : 'New versions will wait for you to click Update.'}
              </p>
            )}
            {ask.kind === 'upgrade' && (
              <p>
                UltimaPress {ask.to} is brought in and your own features are kept. Your content is
                backed up, then the site is rebuilt. It takes a few minutes.
              </p>
            )}
            <label htmlFor="up-code-password">Your password</label>
            <input
              id="up-code-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="up-code__error">{error}</p>}
            <div className="up-code__row">
              <button type="submit" className="up-code__primary" disabled={busy || !password}>
                {busy ? 'Working…' : 'Confirm'}
              </button>
              <button type="button" className="up-build__copy" onClick={() => setAsk(null)} disabled={busy}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
