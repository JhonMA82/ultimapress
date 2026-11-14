/**
 * Runs once when the server starts. Background work (scheduled publishing, daily backups)
 * is triggered from here by calling the site's own API on 127.0.0.1, so it runs as a
 * normal request: page caches refresh correctly and nothing depends on a visitor.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.UP_SKIP_STATIC === '1' || process.env.UP_DISABLE_BACKGROUND === '1') return

  const crypto = await import('crypto')
  // The key the internal calls use; made per start unless one is configured.
  if (!process.env.CRON_SECRET) process.env.CRON_SECRET = crypto.randomBytes(24).toString('hex')
  const base = `http://127.0.0.1:${process.env.PORT || 3000}`
  const headers = { Authorization: `Bearer ${process.env.CRON_SECRET}` }

  const call = (path: string, method = 'GET') =>
    fetch(base + path, { method, headers, signal: AbortSignal.timeout(10 * 60_000) }).catch(() => {
      /* the server may still be starting */
    })

  // Scheduled publishing and other queued jobs: every minute.
  setInterval(() => call('/api/payload-jobs/run?queue=default&limit=20&silent=true'), 60_000).unref()
  // Daily backups: checked every 10 minutes, first check 3 minutes after start.
  setTimeout(() => call('/api/up/backups/tick', 'POST'), 3 * 60_000).unref()
  setInterval(() => call('/api/up/backups/tick', 'POST'), 10 * 60_000).unref()
}
