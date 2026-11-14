import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { hasRole } from '@/access/roles'
import { analyticsReport, type Row } from '@/analytics/report'
import { getSiteSettings } from '@/utilities/getSiteSettings'

import './analytics.scss'

const RANGES = [7, 30, 90, 365]
const fmt = (v: number) => v.toLocaleString('en-IE')

function List({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.visitors))
  return (
    <section className="up-an__card">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className="up-an__empty">{empty}</p>
      ) : (
        <ol>
          {rows.map((r) => (
            <li key={r.label}>
              <span className="up-an__bar" style={{ width: `${(r.visitors / max) * 100}%` }} />
              <span className="up-an__label">{r.label}</span>
              <span className="up-an__num">{fmt(r.visitors)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/** Built-in analytics (/admin/analytics): visitors, pages, sources, devices and countries. */
export async function AnalyticsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  const admin = req.payload.config.routes.admin || '/admin'
  if (!req.user) redirect(`${admin}/login`)

  const asked = Number((searchParams as Record<string, string> | undefined)?.days)
  const days = RANGES.includes(asked) ? asked : 30
  const allowed = hasRole(req.user, 'admin')
  const settings = await getSiteSettings()
  const report = allowed ? await analyticsReport(req.payload, days) : null

  const change =
    report && report.previousVisitors > 0
      ? Math.round(((report.visitors - report.previousVisitors) / report.previousVisitors) * 100)
      : null
  const maxDay = Math.max(1, ...(report?.daily.map((d) => d.visitors) || [1]))

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <div className="up-an">
          <header className="up-an__head">
            <div>
              <h1>Analytics</h1>
              <p>
                Counted on your own site: no cookies, no personal data, nothing sent to anyone else. Your own visits while
                logged in are not counted.
              </p>
            </div>
            <nav className="up-an__ranges" aria-label="Period">
              {RANGES.map((r) => (
                <a key={r} href={`${admin}/analytics?days=${r}`} className={r === days ? 'is-on' : ''}>
                  {r === 365 ? '12 months' : `${r} days`}
                </a>
              ))}
            </nav>
          </header>

          {!allowed && <p>Analytics are for administrators.</p>}
          {allowed && settings.enableAnalytics === false && (
            <p className="up-an__notice">
              Visitor counting is switched off. Turn it on in{' '}
              <a href={`${admin}/globals/site-settings`}>Site Settings &gt; Analytics</a>.
            </p>
          )}

          {report && (
            <>
              <div className="up-an__stats">
                <div>
                  <span>Visitors</span>
                  <strong>{fmt(report.visitors)}</strong>
                  {change !== null && (
                    <em className={change >= 0 ? 'is-up' : 'is-down'}>
                      {change >= 0 ? '+' : ''}
                      {change}% vs previous {days} days
                    </em>
                  )}
                </div>
                <div>
                  <span>Page views</span>
                  <strong>{fmt(report.views)}</strong>
                </div>
                <div>
                  <span>Pages per visit</span>
                  <strong>{report.visitors ? (report.views / report.visitors).toFixed(1) : '0'}</strong>
                </div>
                <div>
                  <span>On the site now</span>
                  <strong>{fmt(report.liveNow)}</strong>
                </div>
              </div>

              <section className="up-an__card up-an__chart">
                <h3>Visitors per day</h3>
                <div className="up-an__bars" role="img" aria-label={`Visitors per day over the last ${days} days`}>
                  {report.daily.map((d) => (
                    <div key={d.day} title={`${d.day}: ${d.visitors} visitors, ${d.views} views`}>
                      <span style={{ height: `${(d.visitors / maxDay) * 100}%` }} />
                    </div>
                  ))}
                </div>
                <div className="up-an__axis">
                  <span>{report.daily[0]?.day}</span>
                  <span>{report.daily[report.daily.length - 1]?.day}</span>
                </div>
              </section>

              <div className="up-an__grid">
                <List title="Top pages" rows={report.pages} empty="No visits yet." />
                <List title="Where visitors came from" rows={report.sources} empty="No visits yet." />
                <List title="Devices" rows={report.devices} empty="No visits yet." />
                <List title="Browsers" rows={report.browsers} empty="No visits yet." />
                <List
                  title="Countries"
                  rows={report.countries}
                  empty="Countries show when your site runs behind Cloudflare or a host that adds the visitor's country."
                />
              </div>
            </>
          )}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}

export default AnalyticsView
