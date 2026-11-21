/**
 * Native MCP setup for the "Build with AI" card.
 *
 * The dashboard receives one credential-bearing URL from /api/claude-connect. These helpers turn
 * it into the clean endpoint plus the key (never rendered by default) and into the config file
 * each client understands. The key itself is only ever referenced by an environment variable, so
 * a copied template cannot leak it.
 *
 * No React and no browser API here: pure functions, unit-tested in
 * tests/int/native-mcp-setup.int.spec.ts.
 */

export type NativeMcpClient = 'omp' | 'opencode' | 'pi'

export type McpParse =
  | { ok: true; endpoint: string; key: string }
  | { ok: false; reason: 'invalid' | 'https-required' }

const LOOPBACK: Record<string, true> = { localhost: true, '127.0.0.1': true, '[::1]': true }

const invalid = { ok: false, reason: 'invalid' } as const

/**
 * Reads `url` (the shape /api/claude-connect returns) and extracts the origin + /api/mcp path
 * and the key. HTTPS is required except for a loopback smoke. No credentials may travel in the
 * authority, and the path must be the MCP endpoint.
 */
export function parseMcpConnection(url: string): McpParse {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return invalid
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return invalid
  if (parsed.username || parsed.password) return invalid
  if (parsed.protocol === 'http:' && !Object.hasOwn(LOOPBACK, parsed.hostname)) {
    return { ok: false, reason: 'https-required' }
  }

  const path = parsed.pathname.replace(/\/+$/, '')
  if (!path.endsWith('/api/mcp')) return invalid

  const key = (parsed.searchParams.get('key') || '').trim()
  if (!key) return invalid

  return { ok: true, endpoint: `${parsed.protocol}//${parsed.host}${path}`, key }
}

/**
 * The minimal config file for one client, with a single `ultimapress` entry. The owner merges
 * that entry into their existing file; the key stays an environment reference.
 */
export function nativeMcpConfig(client: NativeMcpClient, endpoint: string): string {
  const omp = {
    type: 'http',
    url: endpoint,
    headers: { Authorization: 'Bearer ${ULTIMAPRESS_MCP_KEY}' },
  }
  const opencode = {
    type: 'remote',
    url: endpoint,
    oauth: false,
    headers: { Authorization: 'Bearer {env:ULTIMAPRESS_MCP_KEY}' },
  }
  const pi = {
    url: endpoint,
    headers: { Authorization: 'Bearer ${ULTIMAPRESS_MCP_KEY}' },
  }

  const value =
    client === 'opencode'
      ? { mcp: { servers: { ultimapress: opencode } } }
      : { mcpServers: { ultimapress: client === 'omp' ? omp : pi } }

  return JSON.stringify(value, null, 2)
}
