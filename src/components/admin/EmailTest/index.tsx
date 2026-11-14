'use client'

import React, { useState } from 'react'
import { useFormModified } from '@payloadcms/ui'

/** "Send a test email" button under the email settings. */
export function EmailTest() {
  const modified = useFormModified()
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const send = async () => {
    setState('sending')
    const res = await fetch('/api/up/email-test', { method: 'POST', credentials: 'include' })
    const body = await res.json().catch(() => null)
    setState(res.ok ? 'ok' : 'error')
    setMessage(body?.message || body?.error || (res.ok ? 'Sent.' : 'Sending failed.'))
  }
  return (
    <div style={{ margin: '8px 0 24px', padding: 16, border: '1px solid var(--theme-elevation-150)', borderRadius: 10 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn--style-secondary btn--size-medium" style={{ margin: 0 }} disabled={modified || state === 'sending'} onClick={send}>
          {state === 'sending' ? 'Sending…' : 'Send a test email to me'}
        </button>
        <span style={{ color: 'var(--theme-elevation-600)', fontSize: 13 }}>
          {modified ? 'Save your changes first.' : 'Every email the site sends is listed under Settings > Email log.'}
        </span>
      </div>
      {message && (
        <p style={{ margin: '12px 0 0', color: state === 'error' ? 'var(--theme-error-500)' : 'var(--theme-success-500)' }}>{message}</p>
      )}
    </div>
  )
}
