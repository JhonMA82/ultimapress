/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'

import {
  nativeMcpConfig,
  parseMcpConnection,
  type NativeMcpClient,
} from '../../src/components/BeforeDashboard/nativeMcpSetup'

const RAW = 'https://site.example/api/mcp?key=up_fixture'
const parsed = parseMcpConnection(RAW)

/** The assertions the positive case makes, reusable so the mutation test proves they can fail. */
function assertSafeConfigs(configs: string[]) {
  for (const text of configs) {
    expect(text).not.toContain('up_fixture')
    expect(text).not.toContain('?key=')
  }
  const omp = JSON.parse(configs[0])
  expect(omp.mcpServers.ultimapress).toEqual({
    type: 'http',
    url: 'https://site.example/api/mcp',
    headers: { Authorization: 'Bearer ${ULTIMAPRESS_MCP_KEY}' },
  })

  const opencode = JSON.parse(configs[1])
  expect(opencode.mcp.servers.ultimapress).toEqual({
    type: 'remote',
    url: 'https://site.example/api/mcp',
    oauth: false,
    headers: { Authorization: 'Bearer {env:ULTIMAPRESS_MCP_KEY}' },
  })
  expect(opencode.mcp.ultimapress).toBeUndefined()

  const pi = JSON.parse(configs[2])
  expect(pi.mcpServers.ultimapress).toEqual({
    url: 'https://site.example/api/mcp',
    headers: { Authorization: 'Bearer ${ULTIMAPRESS_MCP_KEY}' },
  })
}

describe('parseMcpConnection', () => {
  it('reads the endpoint and key from a connection address', () => {
    expect(parsed).toEqual({ ok: true, endpoint: 'https://site.example/api/mcp', key: 'up_fixture' })
  })

  it('drops the query, hash and any trailing slash', () => {
    expect(parseMcpConnection('https://site.example/api/mcp/?key=up_fixture#frag')).toEqual({
      ok: true,
      endpoint: 'https://site.example/api/mcp',
      key: 'up_fixture',
    })
  })

  it('accepts loopback HTTP for a local smoke', () => {
    expect(parseMcpConnection('http://127.0.0.1:18080/api/mcp?key=up_fixture')).toEqual({
      ok: true,
      endpoint: 'http://127.0.0.1:18080/api/mcp',
      key: 'up_fixture',
    })
    expect(parseMcpConnection('http://localhost:18080/api/mcp?key=up_fixture')).toEqual({
      ok: true,
      endpoint: 'http://localhost:18080/api/mcp',
      key: 'up_fixture',
    })
  })

  it('refuses a missing key, a malformed URL, credentials and another path', () => {
    expect(parseMcpConnection('https://site.example/api/mcp')).toEqual({ ok: false, reason: 'invalid' })
    expect(parseMcpConnection('not-a-url')).toEqual({ ok: false, reason: 'invalid' })
    expect(parseMcpConnection('https://user:pass@site.example/api/mcp?key=up_fixture')).toEqual({
      ok: false,
      reason: 'invalid',
    })
    expect(parseMcpConnection('https://site.example/api/other?key=up_fixture')).toEqual({
      ok: false,
      reason: 'invalid',
    })
    expect(parseMcpConnection('ftp://site.example/api/mcp?key=up_fixture')).toEqual({
      ok: false,
      reason: 'invalid',
    })
    expect(parseMcpConnection('http://constructor/api/mcp?key=up_fixture')).toEqual({
      ok: false,
      reason: 'https-required',
    })
    expect(parseMcpConnection('http://__proto__/api/mcp?key=up_fixture')).toEqual({
      ok: false,
      reason: 'https-required',
    })
  })

  it('refuses remote HTTP', () => {
    expect(parseMcpConnection('http://site.example/api/mcp?key=up_fixture')).toEqual({
      ok: false,
      reason: 'https-required',
    })
  })
})

describe('nativeMcpConfig', () => {
  it('serializes the three native file skeletons without the key', () => {
    if (!parsed.ok) throw new Error('fixture must parse')
    const clients: NativeMcpClient[] = ['omp', 'opencode', 'pi']
    const configs = clients.map((client) => nativeMcpConfig(client, parsed.endpoint))
    assertSafeConfigs(configs)
    expect(configs[0]).toBe(nativeMcpConfig('omp', parsed.endpoint))
  })

  it('rejects a raw key and the OpenCode V1 hierarchy', () => {
    const endpoint = 'https://site.example/api/mcp'
    const omp = nativeMcpConfig('omp', endpoint)
    const pi = nativeMcpConfig('pi', endpoint)

    expect(() => assertSafeConfigs([RAW, nativeMcpConfig('opencode', endpoint), pi])).toThrow()

    const v2 = JSON.parse(nativeMcpConfig('opencode', endpoint))
    const v1 = { mcp: { ultimapress: v2.mcp.servers.ultimapress } }
    expect(JSON.stringify(v1)).toContain('"ultimapress":{"type"')
    expect(() => assertSafeConfigs([omp, JSON.stringify(v1), pi])).toThrow()
  })
})
