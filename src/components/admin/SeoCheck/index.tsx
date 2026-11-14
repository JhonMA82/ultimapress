'use client'

import React, { useMemo } from 'react'
import { useAllFormFields } from '@payloadcms/ui'

import './seo-check.scss'

type Status = 'good' | 'ok' | 'bad'
type Check = { status: Status; text: string }

/** Every piece of visible text and every heading in a page's blocks or a post's content. */
function collect(value: unknown, out: { text: string[]; headings: number[] }) {
  if (!value) return
  if (Array.isArray(value)) {
    for (const v of value) collect(v, out)
    return
  }
  if (typeof value !== 'object') return
  const node = value as Record<string, unknown>
  // Rich text (Lexical): headings carry a tag, text nodes carry text.
  if (node.type === 'heading' && typeof node.tag === 'string') {
    const level = Number(node.tag.replace('h', ''))
    if (level) out.headings.push(level)
  }
  if (node.type === 'text' && typeof node.text === 'string') out.text.push(node.text)
  // Designed sections: HTML.
  if (typeof node.html === 'string') {
    for (const m of node.html.matchAll(/<h([1-6])\b/gi)) out.headings.push(Number(m[1]))
    out.text.push(node.html.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === 'html' || k === 'id' || k === 'blockType') continue
    if (typeof v === 'string' && ['heading', 'title', 'subheading', 'text', 'body', 'description', 'question', 'answer'].includes(k)) {
      out.text.push(v)
    } else if (typeof v === 'object') collect(v, out)
  }
}

const TEXT_FIELDS = ['heading', 'title', 'subheading', 'text', 'body', 'description', 'question', 'answer', 'label']

const has = (haystack: string, needle: string) => haystack.toLowerCase().includes(needle.toLowerCase())

/** A live SEO check in the SEO tab, like Yoast: updates as you type. */
export function SeoCheck() {
  const [fields] = useAllFormFields()
  const val = (path: string) => fields[path]?.value

  const checks = useMemo<Check[]>(() => {
    const title = String(val('meta.title') || val('title') || '')
    const description = String(val('meta.description') || '')
    const slug = String(val('slug') || '')
    const keyword = String(val('meta.focusKeyword') || '').trim()
    const noindex = Boolean(val('meta.noindex'))

    // Rebuild the content from the form state (blocks for pages, rich text for posts).
    // Form state is flat ("layout.0.html", "content"), so each value is read by its field name.
    const found = { text: [] as string[], headings: [] as number[] }
    for (const [path, f] of Object.entries(fields)) {
      if (!/^(layout|content|hero)(\.|$)/.test(path)) continue
      const v = f?.value
      const name = path.split('.').pop() || ''
      if (typeof v === 'string') {
        if (name === 'html') collect({ html: v }, found)
        else if (TEXT_FIELDS.includes(name)) found.text.push(v)
      } else if (v && typeof v === 'object') {
        // The hero's own heading is counted once below, so only its text is used here.
        const into = path.startsWith('hero') ? { text: found.text, headings: [] as number[] } : found
        collect(v, into)
      }
    }
    const heroType = val('hero.type')
    if (heroType && heroType !== 'none') found.headings.unshift(1)
    if (val('content') !== undefined) found.headings.unshift(1) // posts: the title is the H1
    const body = found.text.join(' ').replace(/\s+/g, ' ').trim()
    const words = body ? body.split(' ').length : 0

    const list: Check[] = []
    if (noindex) list.push({ status: 'bad', text: 'Hidden from search engines (Advanced). Untick it if this page should be found.' })

    if (!title) list.push({ status: 'bad', text: 'Add an SEO title.' })
    else if (title.length < 30) list.push({ status: 'ok', text: `SEO title is short (${title.length} characters). Aim for 30 to 60.` })
    else if (title.length > 60) list.push({ status: 'ok', text: `SEO title is long (${title.length} characters). Google cuts it off after about 60.` })
    else list.push({ status: 'good', text: `SEO title length is good (${title.length} characters).` })

    if (!description) list.push({ status: 'bad', text: 'Add a meta description: it is the text people see under your link in Google.' })
    else if (description.length < 70) list.push({ status: 'ok', text: `Meta description is short (${description.length} characters). Aim for 70 to 160.` })
    else if (description.length > 160) list.push({ status: 'ok', text: `Meta description is long (${description.length} characters). Google cuts it off after about 160.` })
    else list.push({ status: 'good', text: `Meta description length is good (${description.length} characters).` })

    if (!keyword) {
      list.push({ status: 'ok', text: 'Add a focus keyword to check that this page targets it.' })
    } else {
      const kwSlug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      list.push(has(title, keyword) ? { status: 'good', text: 'Focus keyword is in the SEO title.' } : { status: 'bad', text: 'Put the focus keyword in the SEO title.' })
      list.push(has(description, keyword) ? { status: 'good', text: 'Focus keyword is in the meta description.' } : { status: 'ok', text: 'Use the focus keyword in the meta description.' })
      list.push(kwSlug && slug.includes(kwSlug) ? { status: 'good', text: 'Focus keyword is in the page address.' } : { status: 'ok', text: 'Consider using the focus keyword in the page address (slug).' })
      const firstBit = body.split(' ').slice(0, 120).join(' ')
      list.push(has(firstBit, keyword) ? { status: 'good', text: 'Focus keyword appears early in the content.' } : { status: 'ok', text: 'Mention the focus keyword near the start of the content.' })
    }

    if (words < 300) list.push({ status: words < 100 ? 'bad' : 'ok', text: `The content has about ${words} words. Pages with 300 or more usually rank better.` })
    else list.push({ status: 'good', text: `The content has about ${words} words.` })

    const h1s = found.headings.filter((h) => h === 1).length
    if (h1s === 0) list.push({ status: 'bad', text: 'There is no main heading (H1). Add a hero or an H1 heading.' })
    else if (h1s > 1) list.push({ status: 'ok', text: `There are ${h1s} main headings (H1). Use one, and H2 for sections.` })
    else list.push({ status: 'good', text: 'There is one main heading (H1).' })

    let skipped = false
    for (let i = 1; i < found.headings.length; i++) {
      if (found.headings[i] - found.headings[i - 1] > 1) skipped = true
    }
    if (skipped) list.push({ status: 'ok', text: 'Some headings skip a level (for example H2 to H4). Keep them in order.' })

    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields])

  const score = checks.filter((c) => c.status === 'good').length
  const bad = checks.some((c) => c.status === 'bad')
  const overall: Status = bad ? 'bad' : score >= checks.length - 1 ? 'good' : 'ok'

  return (
    <div className="up-seo-check">
      <div className="up-seo-check__head">
        <span className={`up-seo-check__dot is-${overall}`} />
        <strong>SEO check</strong>
        <span className="up-seo-check__score">
          {score} of {checks.length} good
        </span>
      </div>
      <ul>
        {checks.map((c, i) => (
          <li key={i}>
            <span className={`up-seo-check__dot is-${c.status}`} aria-label={c.status} />
            {c.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
