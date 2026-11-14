'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useTheme } from '@payloadcms/ui'

import { ICONS, Icon, Moon, Sun } from './Spine.client'
import type { SpinePanel } from './nodes'
import './sidebar.scss'

type User = { name: string; email: string; role: string; initial: string }
type Item = { key: string; label: string; href: string; meta?: string; external?: boolean }

/** One flat list of links per section, from the same data the Spine uses. */
const itemsOf = (panel: SpinePanel): Item[] =>
  panel.sections.flatMap((s): Item[] =>
    s.title && s.href
      ? [{ key: s.key, label: s.title, href: s.href, meta: s.meta }]
      : s.rows.map((r) => ({ key: r.key, label: r.label, href: r.href, external: r.external })),
  )

const COLLAPSE_KEY = 'up-sidebar-collapsed'

/**
 * The Sidebar: the classic admin menu, for people who prefer it to the Spine.
 * Same sections, same links, listed down the left. Chosen per person under
 * Account > Menu style.
 */
export function SidebarClient({ admin, panels, user }: { admin: string; panels: SpinePanel[]; user: User }) {
  const path = usePathname() || ''
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => setOpen(false), [path])

  // Collapsed or open is remembered on this computer.
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1')
    } catch {
      /* storage unavailable: start open */
    }
  }, [])
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1')
      } catch {
        /* storage unavailable: still toggles for this visit */
      }
      return !c
    })

  const isActive = (href: string) => {
    const clean = href.split('#')[0]
    if (clean === admin) return path === admin && !href.includes('#')
    return path === clean || path.startsWith(`${clean}/`)
  }

  const main = panels.filter((p) => p.key !== 'settings')
  const settings = panels.find((p) => p.key === 'settings')

  const group = (panel: SpinePanel) => {
    const items = itemsOf(panel)
    if (!items.length && !panel.empty) return null
    const first = items[0]?.href || panel.empty?.href || admin
    const active = items.some((i) => !i.external && isActive(i.href))
    return (
      <div className="up-sidebar__group" key={panel.key}>
        {/* Collapsed: one icon per section, opening its first page. */}
        <Link
          href={first}
          prefetch={false}
          className={`up-sidebar__rail${active ? ' is-active' : ''}`}
          title={panel.label}
          aria-label={panel.label}
        >
          <Icon d={ICONS[panel.key]} size={18} />
          {panel.badge ? <span className="up-sidebar__dot" /> : null}
        </Link>
        <div className="up-sidebar__label">
          <Icon d={ICONS[panel.key]} size={15} />
          <span>{panel.label}</span>
          {panel.badge ? <span className="up-sidebar__badge">{panel.badge}</span> : null}
        </div>
        <ul>
          {items.map((item) => (
            <li key={item.key}>
              {item.external ? (
                <a href={item.href} target="_blank" rel="noreferrer" className="up-sidebar__link">
                  {item.label}
                </a>
              ) : (
                <Link
                  href={item.href}
                  prefetch={false}
                  className={`up-sidebar__link${isActive(item.href) ? ' is-active' : ''}`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                  {item.meta && <span className="up-sidebar__meta">{item.meta}</span>}
                </Link>
              )}
            </li>
          ))}
          {!items.length && panel.empty && (
            <li>
              <Link href={panel.empty.href} prefetch={false} className="up-sidebar__link is-muted">
                {panel.empty.cta}
              </Link>
            </li>
          )}
        </ul>
      </div>
    )
  }

  return (
    <aside className={`up-sidebar${open ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}`} aria-label="Admin menu">
      <button
        type="button"
        className="up-sidebar__mobile"
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? '×' : 'Menu'}
      </button>
      <div className="up-sidebar__inner">
        <Link href={admin} prefetch={false} className="up-sidebar__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/ultimapress-icon-192.png" alt="" width={28} height={28} />
          <span>UltimaPress</span>
        </Link>
        <button
          type="button"
          className="up-sidebar__collapse"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Open the menu' : 'Collapse the menu'}
          title={collapsed ? 'Open the menu' : 'Collapse the menu'}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={collapsed ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} />
          </svg>
        </button>
        <nav className="up-sidebar__nav">
          {main.map(group)}
          {settings && group(settings)}
        </nav>
        <div className="up-sidebar__foot">
          <Link href={`${admin}/account`} prefetch={false} className="up-sidebar__me">
            <span className="up-sidebar__avatar">{user.initial}</span>
            <span className="up-sidebar__who">
              <strong>{user.name}</strong>
              <span>Your account</span>
            </span>
          </Link>
          <button
            type="button"
            className="up-sidebar__tool"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Switch colour mode"
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
          <Link href={`${admin}/logout`} prefetch={false} className="up-sidebar__tool up-sidebar__logout">
            Log out
          </Link>
        </div>
      </div>
    </aside>
  )
}
