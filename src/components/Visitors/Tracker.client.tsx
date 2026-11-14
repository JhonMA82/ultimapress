'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/** Counts a page view for the built-in analytics: no cookies, nothing stored in the browser. */
export function Tracker() {
  const path = usePathname()
  const first = useRef(true)
  useEffect(() => {
    if (!path) return
    const params = new URLSearchParams(window.location.search)
    const data = JSON.stringify({
      path,
      // The first page of a visit carries where the visitor came from.
      referrer: first.current ? document.referrer : '',
      source: first.current ? params.get('utm_source') || params.get('ref') || '' : '',
    })
    first.current = false
    fetch('/api/up/hit', { method: 'POST', body: data, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {})
  }, [path])
  return null
}

/** Reports a missing page so it shows up under Broken links (404). */
export function NotFoundReport() {
  useEffect(() => {
    const data = JSON.stringify({ path: window.location.pathname, referrer: document.referrer })
    fetch('/api/up/404', { method: 'POST', body: data, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {})
  }, [])
  return null
}
