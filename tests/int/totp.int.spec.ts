import { describe, expect, it } from 'vitest'

import { newSecret, verifyCode } from '@/security/totp'

describe('two-factor codes', () => {
  // RFC 6238 test secret "12345678901234567890" in base32; at 59 s the 6-digit code is 287082.
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
  it('matches the RFC 6238 test vector', () => {
    expect(verifyCode(secret, '287082', 59_000)).toBe(true)
    expect(verifyCode(secret, '287083', 59_000)).toBe(false)
  })
  it('accepts 30 seconds of clock drift, not more', () => {
    expect(verifyCode(secret, '287082', 59_000 + 30_000)).toBe(true)
    expect(verifyCode(secret, '287082', 59_000 + 95_000)).toBe(false)
  })
  it('rejects junk', () => {
    expect(verifyCode(secret, 'abcdef')).toBe(false)
    expect(verifyCode('not base32!', '123456')).toBe(false)
  })
  it('makes 32-character secrets', () => {
    expect(newSecret()).toMatch(/^[A-Z2-7]{32}$/)
  })
})
