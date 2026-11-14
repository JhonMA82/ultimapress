'use client'

import React, { useEffect, useState } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

type Option = { label: string; path: string }

/** On a broken link: pick where its visitors should go, and a permanent redirect is made. */
export function NotFoundFix() {
  const { id } = useDocumentInfo()
  const path = useFormFields(([f]) => f.path?.value as string | undefined)
  const done = useFormFields(([f]) => Boolean(f.redirected?.value))
  const [to, setTo] = useState('')
  const [options, setOptions] = useState<Option[]>([])
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>(done ? 'saved' : 'idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      const [pages, posts] = await Promise.all(
        ['pages', 'posts'].map((c) =>
          fetch(`/api/${c}?limit=300&depth=0&select[title]=true&select[slug]=true`, { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : { docs: [] }))
            .catch(() => ({ docs: [] })),
        ),
      )
      setOptions([
        ...pages.docs.map((d: { title: string; slug: string }) => ({ label: d.title, path: d.slug === 'home' ? '/' : `/${d.slug}` })),
        ...posts.docs.map((d: { title: string; slug: string }) => ({ label: `Post: ${d.title}`, path: `/posts/${d.slug}` })),
      ])
    }
    load()
  }, [])

  const save = async () => {
    const target = to.trim()
    if (!path || !target) return
    if (!/^(\/|https?:\/\/)/i.test(target)) {
      setState('error')
      setMessage('Use a path starting with / or a full address starting with https://')
      return
    }
    setState('saving')
    const res = await fetch('/api/redirects', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: path, to: { type: 'custom', url: target }, type: '301' }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setState('error')
      setMessage(body?.errors?.[0]?.message || 'The redirect could not be saved. Does one already exist for this address?')
      return
    }
    await fetch(`/api/not-found-log/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirected: true }),
    })
    setState('saved')
    setMessage(`Visitors to ${path} now go to ${target}.`)
  }

  if (!id) return null

  return (
    <div style={{ margin: '24px 0', padding: 20, border: '1px solid var(--theme-elevation-150)', borderRadius: 10 }}>
      <h4 style={{ margin: '0 0 6px' }}>Fix this broken link</h4>
      {state === 'saved' ? (
        <p style={{ margin: 0 }}>{message || 'A redirect is in place for this address.'}</p>
      ) : (
        <>
          <p style={{ margin: '0 0 12px', color: 'var(--theme-elevation-600)' }}>
            Send visitors who land on <code>{path}</code> to another page. This makes a permanent (301) redirect, which
            also keeps its Google ranking.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              list="up-404-targets"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="/new-page or pick one"
              style={{ flex: '1 1 280px', height: 40, padding: '0 12px', borderRadius: 6, border: '1px solid var(--theme-elevation-200)', background: 'var(--theme-input-bg)', color: 'inherit' }}
            />
            <datalist id="up-404-targets">
              {options.map((o) => (
                <option key={o.path} value={o.path}>
                  {o.label}
                </option>
              ))}
            </datalist>
            <button type="button" className="btn btn--style-primary btn--size-medium" style={{ margin: 0 }} disabled={state === 'saving' || !to.trim()} onClick={save}>
              {state === 'saving' ? 'Saving…' : 'Make redirect'}
            </button>
          </div>
          {state === 'error' && <p style={{ margin: '10px 0 0', color: 'var(--theme-error-500)' }}>{message}</p>}
        </>
      )}
    </div>
  )
}
