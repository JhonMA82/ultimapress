#!/usr/bin/env node
/**
 * Downloads one file and prints its SHA-256. Used by the add-ons (docker/supervisor.mjs,
 * docker/site-scan.mjs) in a separate process, so a failed or broken download can never
 * stop the server itself.   node docker/download.mjs <url> <file>
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const [url, file] = process.argv.slice(2)
try {
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20 * 60_000) })
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
  const hash = crypto.createHash('sha256')
  const tap = new Transform({
    transform(chunk, _enc, done) {
      hash.update(chunk)
      done(null, chunk)
    },
  })
  await pipeline(Readable.fromWeb(res.body), tap, fs.createWriteStream(file))
  process.stdout.write(hash.digest('hex'))
} catch (e) {
  fs.rmSync(file, { force: true })
  process.stderr.write(String(e?.message || e))
  process.exit(1)
}
