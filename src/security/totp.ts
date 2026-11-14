import crypto from 'crypto'

/** Time-based one-time codes (RFC 6238), the codes Google Authenticator, 1Password and others show. */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export const newSecret = () => {
  const bytes = crypto.randomBytes(20)
  let bits = ''
  for (const b of bytes) bits += b.toString(2).padStart(8, '0')
  let out = ''
  for (let i = 0; i + 5 <= bits.length; i += 5) out += ALPHABET[parseInt(bits.slice(i, i + 5), 2)]
  return out
}

const decode = (secret: string) => {
  const clean = secret.replace(/[\s=-]/g, '').toUpperCase()
  let bits = ''
  for (const c of clean) {
    const v = ALPHABET.indexOf(c)
    if (v < 0) throw new Error('Bad secret')
    bits += v.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

const codeAt = (key: Buffer, counter: number) => {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const h = crypto.createHmac('sha1', key).update(buf).digest()
  const o = h[h.length - 1] & 0xf
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]
  return String(n % 1_000_000).padStart(6, '0')
}

/** True when the code matches now, or 30 seconds either side (clock drift). */
export const verifyCode = (secret: string, code: string, now = Date.now()) => {
  const c = String(code || '').replace(/\D/g, '')
  if (c.length !== 6) return false
  let key: Buffer
  try {
    key = decode(secret)
  } catch {
    return false
  }
  const step = Math.floor(now / 30_000)
  return [-1, 0, 1].some((d) => crypto.timingSafeEqual(Buffer.from(codeAt(key, step + d)), Buffer.from(c)))
}

export const otpauthURL = (secret: string, account: string, issuer: string) =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`

/** Codes used once, so one cannot be replayed within its 90 seconds. */
const used = new Map<string, number>()
export const markUsed = (userId: string | number, code: string) => {
  const now = Date.now()
  for (const [k, t] of used) if (now - t > 120_000) used.delete(k)
  const key = `${userId}:${code}`
  if (used.has(key)) return false
  used.set(key, now)
  return true
}

/** Five wrong codes lock two-factor login for that account for 15 minutes (kept in memory). */
const misses = new Map<string, { n: number; until: number }>()
export const tooManyMisses = (userId: string | number) => {
  const m = misses.get(String(userId))
  return Boolean(m && m.until > Date.now())
}
export const recordMiss = (userId: string | number) => {
  const k = String(userId)
  const m = misses.get(k) || { n: 0, until: 0 }
  m.n++
  if (m.n >= 5) {
    m.until = Date.now() + 15 * 60_000
    m.n = 0
  }
  misses.set(k, m)
}
export const clearMisses = (userId: string | number) => misses.delete(String(userId))
