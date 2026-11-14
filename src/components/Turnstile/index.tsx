'use client'

import React, { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id: string) => void
    }
  }
}

let keyPromise: Promise<string | null> | null = null
const siteKey = () =>
  (keyPromise ||= fetch('/api/up/turnstile')
    .then((r) => (r.ok ? r.json() : { siteKey: null }))
    .then((b) => b.siteKey || null)
    .catch(() => null))

let scriptPromise: Promise<void> | null = null
const loadScript = () =>
  (scriptPromise ||= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Turnstile did not load'))
    document.head.appendChild(s)
  }))

/**
 * Cloudflare Turnstile spam check. Renders nothing unless the site has Turnstile keys.
 * Calls onToken with the token to send along with the form (as "turnstileToken").
 */
export function Turnstile({ onToken, resetKey }: { onToken: (token: string) => void; resetKey?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    let cancelled = false
    siteKey().then(async (key) => {
      if (!key || cancelled || !ref.current) return
      setOn(true)
      await loadScript()
      if (cancelled || !ref.current || !window.turnstile) return
      widget.current = window.turnstile.render(ref.current, {
        sitekey: key,
        callback: (t: string) => onToken(t),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      })
    })
    return () => {
      cancelled = true
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current)
      widget.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (resetKey && widget.current && window.turnstile) window.turnstile.reset(widget.current)
  }, [resetKey])

  return <div ref={ref} style={on ? { minHeight: 65 } : undefined} />
}
