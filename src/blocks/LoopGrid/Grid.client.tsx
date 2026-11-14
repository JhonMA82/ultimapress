'use client'

import React, { useState } from 'react'

import { toCard, type GridCard } from './cards'

type Props = {
  collection: string
  limit: number
  initial: GridCard[]
  hasMore: boolean
  loadMore: boolean
  categories: { id: string; title: string }[]
}

export function GridClient({ collection, limit, initial, hasMore, loadMore, categories }: Props) {
  const [cards, setCards] = useState(initial)
  const [page, setPage] = useState(1)
  const [more, setMore] = useState(hasMore)
  const [cat, setCat] = useState('')
  const [busy, setBusy] = useState(false)

  const fetchPage = async (n: number, category: string) => {
    const q = new URLSearchParams({ limit: String(limit), page: String(n), depth: '1', sort: '-createdAt' })
    if (category) q.set('where[categories][in]', category)
    const res = await fetch(`/api/${encodeURIComponent(collection)}?${q}`)
    const data = await res.json()
    return { docs: (data.docs || []).map((d: Record<string, unknown>) => toCard(collection, d)), more: Boolean(data.hasNextPage) }
  }

  const choose = async (id: string) => {
    setCat(id)
    setBusy(true)
    try {
      const r = await fetchPage(1, id)
      setCards(r.docs)
      setMore(r.more)
      setPage(1)
    } finally {
      setBusy(false)
    }
  }
  const next = async () => {
    setBusy(true)
    try {
      const r = await fetchPage(page + 1, cat)
      setCards((c) => [...c, ...r.docs])
      setMore(r.more)
      setPage(page + 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {[{ id: '', title: 'All' }, ...categories].map((c) => (
            <button
              key={c.id || 'all'}
              type="button"
              aria-pressed={cat === c.id}
              onClick={() => choose(c.id)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${cat === c.id ? 'border-transparent text-white' : 'border-border hover:border-[var(--up-primary)]'}`}
              style={cat === c.id ? { background: 'var(--up-primary)' } : undefined}
            >
              {c.title}
            </button>
          ))}
        </div>
      )}
      <ul className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${busy ? 'opacity-60' : ''}`}>
        {cards.map((c) => (
          <li key={c.id}>
            <a href={c.href} className="group block h-full overflow-hidden rounded-[var(--radius)] border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg">
              {c.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt={c.alt || ''} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              )}
              <div className="p-5">
                {c.price && <p className="mb-1 text-sm font-bold" style={{ color: 'var(--up-primary)' }}>{c.price}</p>}
                <h3 className="text-lg font-semibold leading-snug group-hover:underline">{c.title}</h3>
                {c.text && <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>}
              </div>
            </a>
          </li>
        ))}
      </ul>
      {cards.length === 0 && <p className="text-muted-foreground">Nothing here yet.</p>}
      {loadMore && more && (
        <div className="mt-10 text-center">
          <button type="button" onClick={next} disabled={busy} className="up-btn">
            {busy ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </>
  )
}
