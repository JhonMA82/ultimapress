'use client'

import React, { useState } from 'react'

import type { BackupInfo } from '@/siteBackups'

const mb = (b: number) => (b > 1e9 ? `${(b / 1e9).toFixed(1)} GB` : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`)
const when = (iso: string) => new Date(iso).toLocaleString('en-IE', { dateStyle: 'medium', timeStyle: 'short' })

export function BackupList({ initial }: { initial: BackupInfo[] }) {
  const [list, setList] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [withMedia, setWithMedia] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')

  const refresh = async () => {
    const r = await fetch('/api/up/backups', { credentials: 'include' })
    if (r.ok) setList((await r.json()).backups)
  }

  const now = async () => {
    setBusy('now')
    setMessage({ text: 'Backing up… this can take a minute with lots of images.' })
    const r = await fetch('/api/up/backups', { method: 'POST', credentials: 'include' })
    const b = await r.json().catch(() => ({}))
    setBusy(null)
    setMessage(r.ok ? { text: 'Backup saved.' } : { text: b.error || 'Backup failed', bad: true })
    refresh()
  }

  const upload = async () => {
    if (!file) return
    setBusy('upload')
    setMessage({ text: 'Uploading and checking the file…' })
    const r = await fetch('/api/up/backups/upload', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/octet-stream', 'x-up-password': password },
      body: file,
    })
    const b = await r.json().catch(() => ({}))
    setBusy(null)
    setPassword('')
    if (!r.ok) {
      setMessage({ text: b.error || 'Upload failed', bad: true })
      return
    }
    setShowUpload(false)
    setFile(null)
    await refresh()
    setRestoring(b.backup.id)
    setMessage({ text: 'File checked and added to the list. Nothing has changed yet: restore it below.' })
  }

  const restore = async (id: string) => {
    setBusy(id)
    setMessage({ text: 'Restoring… a safety backup of the current site is taken first.' })
    const r = await fetch(`/api/up/backups/${id}/restore`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: typed, media: withMedia }),
    })
    const b = await r.json().catch(() => ({}))
    setBusy(null)
    setRestoring(null)
    setTyped('')
    setMessage(r.ok ? { text: 'Restored. Reload the admin to see it. If you are asked to log in, use your usual email and password.' } : { text: b.error || 'Restore failed', bad: true })
    refresh()
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this backup for good?')) return
    await fetch(`/api/up/backups/${id}`, { method: 'DELETE', credentials: 'include' })
    refresh()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        <button type="button" className="btn btn--style-primary btn--size-medium" style={{ margin: 0 }} disabled={Boolean(busy)} onClick={now}>
          {busy === 'now' ? 'Backing up…' : 'Back up now'}
        </button>
        <button type="button" className="btn btn--style-secondary btn--size-medium" style={{ margin: 0 }} disabled={Boolean(busy)} onClick={() => setShowUpload(!showUpload)}>
          Restore from a file
        </button>
        {message && <span style={{ color: message.bad ? 'var(--theme-error-500)' : 'inherit' }}>{message.text}</span>}
      </div>

      {showUpload && (
        <div style={{ padding: 16, borderRadius: 10, background: 'var(--theme-elevation-50)', border: '1px solid var(--theme-elevation-150)', marginBottom: 24, maxWidth: 720 }}>
          <p style={{ margin: '0 0 12px', lineHeight: 1.6 }}>
            Moving a site here, or keeping your demo site? Choose the file you got from <strong>Download</strong> on another
            UltimaPress site. It is checked and added to the list below, and nothing changes until you restore it.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="file" accept=".tar,application/x-tar" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              style={{ height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid var(--theme-elevation-300)' }}
            />
            <button type="button" className="btn btn--style-primary btn--size-small" style={{ margin: 0 }} disabled={!file || !password || Boolean(busy)} onClick={upload}>
              {busy === 'upload' ? 'Checking…' : 'Upload'}
            </button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <p>No backups yet. The first daily backup runs within a day, or press Back up now.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', fontSize: 13, color: 'var(--theme-elevation-600)' }}>
              <th style={{ padding: '8px 6px' }}>When</th>
              <th style={{ padding: '8px 6px' }}>Type</th>
              <th style={{ padding: '8px 6px' }}>Content</th>
              <th style={{ padding: '8px 6px' }}>Images and files</th>
              <th style={{ padding: '8px 6px' }}>Off-site</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <React.Fragment key={b.id}>
                <tr style={{ borderTop: '1px solid var(--theme-elevation-150)' }}>
                  <td style={{ padding: '10px 6px' }}>{when(b.createdAt)}</td>
                  <td style={{ padding: '10px 6px' }}>{b.reason}</td>
                  <td style={{ padding: '10px 6px' }}>
                    <a href={`/api/up/backups/${b.id}/db.dump`}>{mb(b.dbBytes)}</a>
                  </td>
                  <td style={{ padding: '10px 6px' }}>{b.mediaBytes ? <a href={`/api/up/backups/${b.id}/media.tar.gz`}>{mb(b.mediaBytes)}</a> : 'Not included'}</td>
                  <td style={{ padding: '10px 6px' }} title={b.offsiteError || ''}>
                    {b.offsite === 'sent' ? 'Copied' : b.offsite === 'failed' ? 'Failed' : 'Off'}
                  </td>
                  <td style={{ padding: '10px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <a className="btn btn--style-secondary btn--size-small" style={{ margin: '0 6px 0 0' }} href={`/api/up/backups/${b.id}/site`} title="Everything in one file, to move this site to another server">
                      Download
                    </a>
                    <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: '0 6px 0 0' }} disabled={Boolean(busy)} onClick={() => setRestoring(restoring === b.id ? null : b.id)}>
                      Restore
                    </button>
                    <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} disabled={Boolean(busy)} onClick={() => remove(b.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
                {restoring === b.id && (
                  <tr>
                    <td colSpan={6} style={{ padding: '4px 6px 18px' }}>
                      <div style={{ padding: 16, borderRadius: 10, background: 'var(--theme-warning-100)' }}>
                        <p style={{ margin: '0 0 10px' }}>
                          {b.uploaded ? 'This replaces all current content with the uploaded site.' : `This replaces all current content with the backup from ${when(b.createdAt)}. Anything added since is lost.`}{' '}
                          A safety backup of the site as it is now is taken first. Your login stays the same.
                        </p>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                          <input type="checkbox" checked={withMedia} onChange={(e) => setWithMedia(e.target.checked)} disabled={!b.mediaBytes} />
                          Also put back images and files
                        </label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type RESTORE" style={{ height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid var(--theme-elevation-300)' }} />
                          <button type="button" className="btn btn--style-primary btn--size-small" style={{ margin: 0 }} disabled={typed !== 'RESTORE' || Boolean(busy)} onClick={() => restore(b.id)}>
                            {busy === b.id ? 'Restoring…' : 'Restore this backup'}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
