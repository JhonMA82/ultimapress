'use client'

import React, { useState } from 'react'
import { useAuth, useDocumentInfo, useFormFields } from '@payloadcms/ui'

/** On an account: turn two-factor login on (scan a QR code) or off. */
export function TwoFactorSetup() {
  const { id } = useDocumentInfo()
  const { user } = useAuth()
  const enabled = useFormFields(([f]) => Boolean(f.twoFactorEnabled?.value))
  const [qr, setQr] = useState<{ qr: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [on, setOn] = useState(enabled)
  const [busy, setBusy] = useState(false)
  const isMe = user && id && String(user.id) === String(id)
  const isAdmin = (user as { role?: string } | null)?.role === 'admin'

  const call = async (path: string, body?: object) => {
    setBusy(true)
    const res = await fetch(`/api/up/2fa/${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    return { ok: res.ok, json }
  }

  if (!id) return null

  return (
    <div style={{ margin: '24px 0', padding: 20, border: '1px solid var(--theme-elevation-150)', borderRadius: 10 }}>
      <h4 style={{ margin: '0 0 6px' }}>Two-factor login {on ? '(on)' : '(off)'}</h4>
      <p style={{ margin: '0 0 14px', color: 'var(--theme-elevation-600)', lineHeight: 1.55 }}>
        {on
          ? 'Logging in needs the password and a 6-digit code from an authenticator app.'
          : 'Protects the account even if the password leaks: logging in also needs a 6-digit code from an app like Google Authenticator, Microsoft Authenticator or 1Password.'}
      </p>

      {isMe && !on && !qr && (
        <button
          type="button"
          className="btn btn--style-primary btn--size-medium"
          style={{ margin: 0 }}
          disabled={busy}
          onClick={async () => {
            const r = await call('setup')
            if (r.ok) setQr(r.json)
            else setMessage(r.json.error || 'Could not start')
          }}
        >
          Turn on two-factor login
        </button>
      )}

      {isMe && !on && qr && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr.qr} alt="QR code to scan with your authenticator app" width={180} height={180} style={{ borderRadius: 8, background: '#fff' }} />
          <div style={{ flex: '1 1 260px' }}>
            <p style={{ margin: '0 0 8px' }}>1. Scan this with your authenticator app.</p>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--theme-elevation-600)' }}>
              Can&apos;t scan? Enter this key instead: <code style={{ wordBreak: 'break-all' }}>{qr.secret}</code>
            </p>
            <p style={{ margin: '12px 0 8px' }}>2. Type the 6-digit code it shows:</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                style={{ width: 140, height: 40, padding: '0 10px', fontSize: 18, letterSpacing: 4, borderRadius: 6, border: '1px solid var(--theme-elevation-200)', background: 'var(--theme-input-bg)', color: 'inherit' }}
              />
              <button
                type="button"
                className="btn btn--style-primary btn--size-medium"
                style={{ margin: 0 }}
                disabled={busy || code.length !== 6}
                onClick={async () => {
                  const r = await call('confirm', { code })
                  if (r.ok) {
                    setOn(true)
                    setQr(null)
                    setCode('')
                    setMessage('Two-factor login is on. You will need a code next time you log in.')
                  } else setMessage(r.json.error || 'Could not confirm')
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {isMe && on && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Current code"
            style={{ width: 160, height: 40, padding: '0 10px', borderRadius: 6, border: '1px solid var(--theme-elevation-200)', background: 'var(--theme-input-bg)', color: 'inherit' }}
          />
          <button
            type="button"
            className="btn btn--style-secondary btn--size-medium"
            style={{ margin: 0 }}
            disabled={busy || code.length !== 6}
            onClick={async () => {
              const r = await call('disable', { code })
              if (r.ok) {
                setOn(false)
                setCode('')
                setMessage('Two-factor login is off.')
              } else setMessage(r.json.error || 'Could not turn it off')
            }}
          >
            Turn off
          </button>
        </div>
      )}

      {!isMe && on && isAdmin && (
        <button
          type="button"
          className="btn btn--style-secondary btn--size-medium"
          style={{ margin: 0 }}
          disabled={busy}
          onClick={async () => {
            const r = await call('disable', { userId: id })
            if (r.ok) {
              setOn(false)
              setMessage('Two-factor login is off for this person. They can turn it on again from their account.')
            } else setMessage(r.json.error || 'Could not turn it off')
          }}
        >
          Turn off for this person (lost phone)
        </button>
      )}
      {!isMe && !on && <p style={{ margin: 0, fontSize: 13 }}>Only the account owner can turn it on, from their own account page.</p>}

      {message && <p style={{ margin: '12px 0 0' }}>{message}</p>}
    </div>
  )
}
