import crypto from 'crypto'
import fs from 'fs'
import { Readable } from 'stream'

/** Uploads one file to S3-compatible storage (R2, B2, S3, Wasabi…) with a signed PUT (AWS Signature V4). */

export type S3Target = {
  endpoint: string
  region: string
  bucket: string
  accessKey: string
  secretKey: string
  prefix?: string
}

const hmac = (key: crypto.BinaryLike | crypto.KeyObject, data: string) => crypto.createHmac('sha256', key).update(data).digest()
const hex = (data: string) => crypto.createHash('sha256').update(data).digest('hex')
const encodeKey = (key: string) => key.split('/').map(encodeURIComponent).join('/')

export async function putObject(target: S3Target, key: string, file: string, contentType = 'application/octet-stream') {
  const base = new URL(target.endpoint.replace(/\/$/, ''))
  if (base.protocol !== 'https:') throw new Error('The storage endpoint must start with https://')
  const objectPath = `/${encodeURIComponent(target.bucket)}/${encodeKey([target.prefix?.replace(/^\/|\/$/g, ''), key].filter(Boolean).join('/'))}`
  const url = new URL(objectPath, base)
  const size = fs.statSync(file).size
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const day = amzDate.slice(0, 8)
  const region = target.region || 'auto'
  const headers: Record<string, string> = {
    host: url.host,
    'content-length': String(size),
    'content-type': contentType,
    'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
    'x-amz-date': amzDate,
  }
  const signed = Object.keys(headers).sort()
  const canonical = ['PUT', url.pathname, '', signed.map((h) => `${h}:${headers[h]}\n`).join(''), signed.join(';'), 'UNSIGNED-PAYLOAD'].join('\n')
  const scope = `${day}/${region}/s3/aws4_request`
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, hex(canonical)].join('\n')
  const key0 = hmac(hmac(hmac(hmac(`AWS4${target.secretKey}`, day), region), 's3'), 'aws4_request')
  const signature = crypto.createHmac('sha256', key0).update(toSign).digest('hex')
  const authorization = `AWS4-HMAC-SHA256 Credential=${target.accessKey}/${scope}, SignedHeaders=${signed.join(';')}, Signature=${signature}`

  const { host: _host, ...sendHeaders } = headers
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...sendHeaders, authorization },
    body: Readable.toWeb(fs.createReadStream(file)) as unknown as BodyInit,
    // @ts-expect-error Node's fetch needs this for a streamed body
    duplex: 'half',
    signal: AbortSignal.timeout(30 * 60_000),
  })
  if (!res.ok) {
    const text = (await res.text().catch(() => '')).slice(0, 300)
    throw new Error(`Storage said ${res.status}: ${text.replace(/\s+/g, ' ')}`)
  }
}
