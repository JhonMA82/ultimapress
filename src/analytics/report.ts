import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

export type Row = { label: string; views: number; visitors: number }
export type Report = {
  days: number
  views: number
  visitors: number
  previousVisitors: number
  liveNow: number
  daily: { day: string; views: number; visitors: number }[]
  pages: Row[]
  sources: Row[]
  devices: Row[]
  browsers: Row[]
  countries: Row[]
}

type DB = { drizzle: { execute: (q: unknown) => Promise<{ rows: Record<string, unknown>[] }> } }

const n = (v: unknown) => Number(v) || 0

/** Visitor stats for the last `days` days, straight from the page_views table. */
export async function analyticsReport(payload: Payload, days: number): Promise<Report> {
  const db = (payload.db as unknown as DB).drizzle
  const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10)
  const before = new Date(Date.now() - (2 * days - 1) * 86_400_000).toISOString().slice(0, 10)
  const fiveMinutes = new Date(Date.now() - 5 * 60_000).toISOString()

  const rows = async (q: unknown) => (await db.execute(q)).rows

  const group = async (column: 'path' | 'referrer' | 'device' | 'browser' | 'country', limit = 10): Promise<Row[]> =>
    (
      await rows(sql`
        select coalesce(${sql.raw(`"${column}"`)}, '') as label, count(*) as views, count(distinct visitor) as visitors
        from page_views where day >= ${since}
        group by 1 order by 3 desc, 2 desc limit ${limit}`)
    ).map((r) => ({ label: String(r.label), views: n(r.views), visitors: n(r.visitors) }))

  const [totals, previous, live, daily, pages, sources, devices, browsers, countries] = await Promise.all([
    rows(sql`select count(*) as views, count(distinct visitor || day) as visitors from page_views where day >= ${since}`),
    rows(sql`select count(distinct visitor || day) as visitors from page_views where day >= ${before} and day < ${since}`),
    rows(sql`select count(distinct visitor) as live from page_views where created_at >= ${fiveMinutes}`),
    rows(sql`select day, count(*) as views, count(distinct visitor) as visitors from page_views where day >= ${since} group by day order by day`),
    group('path', 12),
    group('referrer', 10),
    group('device', 5),
    group('browser', 8),
    group('country', 10),
  ])

  // Every day in the range, including days without visits.
  const byDay = new Map(daily.map((r) => [String(r.day), r]))
  const series: Report['daily'] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
    const r = byDay.get(d)
    series.push({ day: d, views: n(r?.views), visitors: n(r?.visitors) })
  }

  return {
    days,
    views: n(totals[0]?.views),
    visitors: n(totals[0]?.visitors),
    previousVisitors: n(previous[0]?.visitors),
    liveNow: n(live[0]?.live),
    daily: series,
    pages,
    sources: sources.map((s) => ({ ...s, label: s.label || 'Direct or unknown' })),
    devices,
    browsers,
    countries: countries.map((c) => ({ ...c, label: c.label || 'Unknown' })),
  }
}
