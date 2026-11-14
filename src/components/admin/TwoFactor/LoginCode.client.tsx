'use client'

import React, { useEffect, useRef, useState } from 'react'

/**
 * On the login page: when an account has two-factor login, the server asks for a code.
 * This shows the code box and sends the code with the next login attempt.
 */
export function LoginCode() {
  const [needed, setNeeded] = useState(false)
  const codeRef = useRef('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState('')

  useEffect(() => {
    const original = window.fetch
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const isLogin = /\/api\/users\/login(\?|$)/.test(url) && (init?.method || 'GET').toUpperCase() === 'POST'
      if (isLogin && codeRef.current) {
        const headers = new Headers(init?.headers || {})
        headers.set('x-up-2fa', codeRef.current)
        init = { ...init, headers }
      }
      const res = await original(input, init)
      if (isLogin && !res.ok) {
        res
          .clone()
          .json()
          .then((b) => {
            const msg = JSON.stringify(b || '')
            if (/6-digit code|code is not right/i.test(msg)) {
              setNeeded(true)
              setTimeout(() => inputRef.current?.focus(), 50)
            }
          })
          .catch(() => {})
      }
      return res
    }
    return () => {
      window.fetch = original
    }
  }, [])

  if (!needed) return null
  return (
    <div style={{ margin: '0 0 20px', padding: 16, borderRadius: 10, border: '1px solid var(--theme-elevation-200)' }}>
      <label htmlFor="up-2fa-code" style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
        Two-factor code
      </label>
      <input
        id="up-2fa-code"
        ref={inputRef}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 6)
          setCode(v)
          codeRef.current = v
        }}
        placeholder="123456"
        style={{ width: '100%', height: 44, padding: '0 12px', fontSize: 20, letterSpacing: 6, borderRadius: 6, border: '1px solid var(--theme-elevation-200)', background: 'var(--theme-input-bg)', color: 'inherit' }}
      />
      <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--theme-elevation-600)' }}>
        Open your authenticator app, type the 6-digit code here, then press Login again.
      </p>
    </div>
  )
}
