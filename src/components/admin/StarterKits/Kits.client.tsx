'use client'

import React, { useState } from 'react'

import { STARTER_KITS, TEMPLATES, PAGE_TEMPLATES } from '../VisualBuilder/library'

type Result = { title: string; id?: string; slug: string; note?: string }

export function StarterKitsClient({ admin }: { admin: string }) {
  const [busy, setBusy] = useState('')
  const [withLook, setWithLook] = useState(true)
  const [done, setDone] = useState<{ kit: string; pages: Result[]; look: boolean } | null>(null)
  const [error, setError] = useState('')

  const apply = async (key: string) => {
    const kit = STARTER_KITS.find((k) => k.key === key)
    if (!kit || busy) return
    setBusy(key)
    setError('')
    setDone(null)
    const pages: Result[] = []
    try {
      for (const pg of kit.pages) {
        const tpl = PAGE_TEMPLATES.find((p) => p.key === pg.template)
        const layout = (tpl?.sections || [])
          .map((k) => TEMPLATES.find((t) => t.key === k))
          .filter(Boolean)
          .map((t) => ({ blockType: 'design', blockName: t!.key, fullWidth: true, html: t!.html, css: t!.css }))
        // Never overwrite: if the address is taken, the new page gets its own.
        let slug = pg.slug
        const taken = await fetch(`/api/pages?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0&draft=true`, { credentials: 'include' })
          .then((r) => r.json())
          .then((d) => (d.totalDocs || 0) > 0)
          .catch(() => false)
        if (taken) slug = `${pg.slug}-${kit.key}`
        const res = await fetch('/api/pages?depth=0&draft=true', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title: pg.title, slug, hero: { type: 'none' }, layout, _status: 'draft' }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.doc) throw new Error(data?.errors?.[0]?.message || `"${pg.title}" could not be created.`)
        pages.push({ title: pg.title, id: String(data.doc.id), slug, note: taken ? `"/${pg.slug}" already existed, so this one is at "/${slug}".` : undefined })
      }
      if (withLook) {
        const res = await fetch('/api/globals/site-settings?depth=0', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(kit.look),
        })
        if (!res.ok) throw new Error('The pages were created, but the colours and fonts could not be applied.')
      }
      setDone({ kit: kit.name, pages, look: withLook })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      if (pages.length) setDone({ kit: kit.name, pages, look: false })
    } finally {
      setBusy('')
    }
  }

  return (
    <div>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24 }}>
        <input type="checkbox" checked={withLook} onChange={(e) => setWithLook(e.target.checked)} />
        Also use the kit&apos;s colours, fonts and site template (you can change them later in Site Settings)
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        {STARTER_KITS.map((k) => (
          <div key={k.key} style={{ border: '1px solid var(--up-line)', borderRadius: 16, overflow: 'hidden', background: 'var(--up-card)' }}>
            <div style={{ height: 96, background: `linear-gradient(120deg, ${k.look.primaryColor}, ${k.look.accentColor})` }} />
            <div style={{ padding: 20 }}>
              <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>{k.name}</h2>
              <p style={{ margin: '0 0 12px', color: 'var(--up-muted)', lineHeight: 1.5 }}>{k.description}</p>
              <p style={{ margin: '0 0 16px', fontSize: 13 }}>
                Pages: {k.pages.map((p) => p.title).join(', ')}
                <br />
                Fonts: {k.look.headingFont} and {k.look.bodyFont}
              </p>
              <button type="button" className="btn btn--style-primary btn--size-medium" onClick={() => apply(k.key)} disabled={Boolean(busy)} style={{ margin: 0 }}>
                {busy === k.key ? 'Creating pages…' : 'Use this kit'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {error && <p role="alert" style={{ marginTop: 24, color: '#ff4d4d' }}>{error}</p>}
      {done && (
        <div role="status" style={{ marginTop: 28, padding: 20, borderRadius: 14, border: '1px solid var(--up-accent)', background: 'var(--up-card)' }}>
          <strong>{done.kit}: {done.pages.length} pages created as drafts{done.look ? ', with its colours and fonts' : ''}.</strong>
          <ul style={{ margin: '12px 0 0', paddingLeft: 20, lineHeight: 1.9 }}>
            {done.pages.map((p) => (
              <li key={p.slug}>
                {p.title}: <a href={`${admin}/visual-builder?page=${p.id}`}>open in the visual builder</a>
                {p.note && <span style={{ color: 'var(--up-muted)' }}> ({p.note})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
