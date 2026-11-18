'use client'

import React, { useEffect, useRef, useState } from 'react'

type Step = { key: string; label: string; state: string }
type Job = { kind: string; state: 'running' | 'done' | 'failed'; steps: Step[]; code?: string }

/**
 * "Update to 1.1.x" on the dashboard: one click, the password, and the update runs here,
 * with its progress. Without Docker (pnpm dev) it links to the release notes instead.
 */
export function UpdateButton({ target, docker, href }: { target: string; docker: boolean; href: string }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [job, setJob] = useState<Job | null>(null)
  const [restarting, setRestarting] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (!started.current || (job && job.state !== 'running')) return
    const t = setInterval(async () => {
      try {
        const r = await fetch('/api/site-code/status', { credentials: 'include', cache: 'no-store' })
        if (!r.ok) throw new Error()
        const s = await r.json()
        setRestarting(false)
        if (s.job?.kind === 'upgrade') setJob(s.job)
      } catch {
        setRestarting(true) // the site restarts for a few seconds when the new version takes over
      }
    }, 2000)
    return () => clearInterval(t)
  }, [job])

  if (!docker) {
    return (
      <a className="up-dash__badge is-off" href={href} target="_blank" rel="noreferrer">
        {target} available
      </a>
    )
  }

  async function start(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    setBusy(true)
    setError('')
    try {
      const r = await fetch('/api/site-code/upgrade', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'That did not work.')
      started.current = true
      setJob(data.job)
      setOpen(false)
      setPassword('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (job) {
    const step = job.steps.find((s) => s.state === 'running')
    if (job.state === 'running') {
      return (
        <span className="up-dash__badge is-off" aria-live="polite">
          <i /> {restarting ? 'Restarting…' : `${step?.label || 'Updating'}…`}
        </span>
      )
    }
    if (job.state === 'done') {
      return (
        <a className="up-dash__badge is-live" href="/admin">
          <i /> Updated to {target}. Reload
        </a>
      )
    }
    return (
      <a className="up-dash__badge is-off" href="/admin/site-code">
        {job.code === 'conflicts' ? 'Update needs Claude: open Site code' : 'Update did not go live: see why'}
      </a>
    )
  }

  return (
    <span className="up-dash__update">
      <button type="button" className="up-dash__badge is-off up-dash__update-btn" onClick={() => setOpen((o) => !o)}>
        Update to {target}
      </button>
      {open && (
        <form className="up-dash__update-pop" onSubmit={start}>
          <strong>Update to UltimaPress {target}</strong>
          <span>
            Your content is backed up first and your own features are kept. The site only switches over
            if the new version starts. It takes a few minutes.
          </span>
          <label htmlFor="up-dash-update-password">Your password</label>
          <input
            id="up-dash-update-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <em>{error}</em>}
          <div>
            <button type="submit" disabled={busy || !password}>
              {busy ? 'Starting…' : 'Update'}
            </button>
            <button type="button" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </span>
  )
}
