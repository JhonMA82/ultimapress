'use client'

import React, { useState } from 'react'

type Result = {
  email: string
  comments: { id: number; comment: string; createdAt: string }[]
  formEntries: { id: number; createdAt: string }[]
  accounts: { id: number; name?: string; role?: string }[]
}

export function PersonalDataTool({ admin }: { admin: string }) {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const url = (e: string) => `/api/up/personal-data?email=${encodeURIComponent(e.trim())}`

  const search = async (ev?: React.FormEvent) => {
    ev?.preventDefault()
    setBusy(true)
    setMessage('')
    setConfirm(false)
    const res = await fetch(url(email), { credentials: 'include' })
    const body = await res.json().catch(() => null)
    setBusy(false)
    if (!res.ok) {
      setResult(null)
      setMessage(body?.error || 'Search failed')
      return
    }
    setResult(body)
  }

  const download = async () => {
    const res = await fetch(url(email), { credentials: 'include' })
    const blob = new Blob([JSON.stringify(await res.json(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `personal-data-${email.trim().replace(/[^a-z0-9@.]+/gi, '-')}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const erase = async () => {
    setBusy(true)
    const res = await fetch(url(email), { method: 'DELETE', credentials: 'include' })
    const body = await res.json().catch(() => null)
    setBusy(false)
    setConfirm(false)
    if (!res.ok) return setMessage(body?.error || 'Delete failed')
    setMessage(
      `Deleted ${body.deleted.comments} comment(s) and ${body.deleted.formEntries} form entr${body.deleted.formEntries === 1 ? 'y' : 'ies'}.` +
        (body.accounts ? ' This address also has a user account: remove it under Settings > Users if they asked for that too.' : ''),
    )
    search()
  }

  const total = result ? result.comments.length + result.formEntries.length : 0

  return (
    <div>
      <form onSubmit={search} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          style={{ flex: '1 1 320px', height: 42, padding: '0 12px', borderRadius: 6, border: '1px solid var(--theme-elevation-200)', background: 'var(--theme-input-bg)', color: 'inherit' }}
        />
        <button type="submit" className="btn btn--style-primary btn--size-medium" style={{ margin: 0 }} disabled={busy}>
          Find their data
        </button>
      </form>
      {message && <p style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--theme-elevation-100)' }}>{message}</p>}
      {result && (
        <div style={{ padding: 20, border: '1px solid var(--theme-elevation-150)', borderRadius: 10 }}>
          <h3 style={{ marginTop: 0 }}>Stored for {result.email}</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>{result.comments.length} comment(s)</li>
            <li>{result.formEntries.length} form entr{result.formEntries.length === 1 ? 'y' : 'ies'}</li>
            <li>
              {result.accounts.length} user account(s)
              {result.accounts.length > 0 && (
                <>
                  {' '}
                  (<a href={`${admin}/collections/users/${result.accounts[0].id}`}>open</a>)
                </>
              )}
            </li>
          </ul>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn--style-secondary btn--size-medium" style={{ margin: 0 }} onClick={download}>
              Download as a file
            </button>
            {total > 0 &&
              (confirm ? (
                <button type="button" className="btn btn--style-primary btn--size-medium" style={{ margin: 0, background: 'var(--theme-error-500)' }} disabled={busy} onClick={erase}>
                  Yes, delete {total} item(s) for good
                </button>
              ) : (
                <button type="button" className="btn btn--style-secondary btn--size-medium" style={{ margin: 0 }} onClick={() => setConfirm(true)}>
                  Delete their comments and form entries
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
