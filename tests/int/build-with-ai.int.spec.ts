/**
 * @vitest-environment jsdom
 */
import { createElement } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BuildWithAI } from '../../src/components/BeforeDashboard/BuildWithAI'

const connection = {
  url: 'https://site.example/api/mcp?key=up_fixture',
  claudeCode: 'claude mcp add --transport http ultimapress "https://site.example/api/mcp?key=up_fixture"',
  https: true,
}

const codeFor = (label: string) =>
  screen.getByRole('button', { name: label }).parentElement?.querySelector('code')?.textContent || ''

function mockConnect(overrides: Partial<typeof connection> = {}) {
  const body = { ...connection, ...overrides }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => body }))
}

function failClipboard() {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockRejectedValue(new Error('clipboard blocked')) },
  })
  Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn().mockReturnValue(false) })
}

function spyStorage() {
  const make = () => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  })
  const local = make()
  const session = make()
  vi.stubGlobal('localStorage', local)
  vi.stubGlobal('sessionStorage', session)
  return { local, session }
}

function allowClipboard() {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
}

async function connect() {
  fireEvent.click(screen.getByRole('button', { name: /Connect AI Client/i }))
  await screen.findByText(/Manage connections/)
}

const pick = (value: string) => fireEvent.change(screen.getByLabelText('AI client'), { target: { value } })

describe('BuildWithAI', () => {
  beforeEach(() => {
    mockConnect()
    failClipboard()
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it(
    'connects once, switches native clients without another key, and resets on reload',
    async () => {
      const storage = spyStorage()
      render(createElement(BuildWithAI, { connections: 0 }))

      const picker = screen.getByLabelText('AI client') as HTMLSelectElement
      expect(picker.value).toBe('')
      expect(Array.from(picker.options).map((o) => o.textContent)).toEqual([
        'Any MCP-compatible client',
        'Claude',
        'ChatGPT',
        'Claude Code',
        'Oh My Pi',
        'OpenCode V2',
        'Pi Agent',
      ])
      expect(screen.queryByLabelText(/for manual copy/)).toBeNull()
      expect(document.body.textContent).not.toContain('up_fixture')

      await connect()

      // Generic view: clean URL and header instruction; the keyed address lives only in <details>.
      expect(codeFor('Copy MCP URL')).toBe('https://site.example/api/mcp')
      expect(screen.getByText('Authorization: Bearer <connection key>')).toBeTruthy()
      const details = screen.getByText('My client only accepts a URL').closest('details')!
      expect(details.textContent).toContain('up_fixture')
      const outside = Array.from(document.querySelectorAll('code, p, small, strong')).filter(
        (el) => !details.contains(el),
      )
      expect(outside.some((el) => el.textContent?.includes('up_fixture'))).toBe(false)

      pick('omp')
      const omp = codeFor('Copy MCP configuration')
      expect(omp).toContain('"mcpServers"')
      expect(omp).toContain('"type": "http"')
      expect(omp).toContain('${ULTIMAPRESS_MCP_KEY}')
      expect(omp).not.toContain('up_fixture')
      expect(omp).not.toContain('?key=')
      expect(document.body.textContent).not.toContain('up_fixture')

      pick('opencode')
      const opencode = codeFor('Copy MCP configuration')
      expect(opencode).toContain('"servers"')
      expect(opencode).toContain('"type": "remote"')
      expect(opencode).toContain('"oauth": false')
      expect(opencode).toContain('{env:ULTIMAPRESS_MCP_KEY}')
      expect(opencode).not.toContain('up_fixture')
      expect(opencode).not.toContain('?key=')

      pick('pi')
      const pi = codeFor('Copy MCP configuration')
      expect(pi).toContain('"mcpServers"')
      expect(pi).toContain('${ULTIMAPRESS_MCP_KEY}')
      expect(pi).not.toContain('up_fixture')

      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
      expect(window.localStorage?.length ?? 0).toBe(0)
      expect(window.sessionStorage?.length ?? 0).toBe(0)
      expect(storage.local.setItem).not.toHaveBeenCalled()
      expect(storage.session.setItem).not.toHaveBeenCalled()

      cleanup()
      render(createElement(BuildWithAI, { connections: 0 }))
      expect((screen.getByLabelText('AI client') as HTMLSelectElement).value).toBe('')
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    },
    15000,
  )

  it(
    'shows a manual field instead of claiming Copied when the clipboard fails',
    async () => {
      render(createElement(BuildWithAI, { connections: 0 }))
      await connect()
      pick('pi')

      expect(screen.queryByLabelText('connection key for manual copy')).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Copy connection key' }))

      const manual = (await screen.findByLabelText('connection key for manual copy')) as HTMLTextAreaElement
      expect(manual.value).toBe('up_fixture')
      expect(screen.queryByText('Copied')).toBeNull()
      expect(screen.getAllByDisplayValue('up_fixture')).toHaveLength(1)
      expect(document.querySelectorAll('code').length).toBeGreaterThan(0)
      expect(Array.from(document.querySelectorAll('code')).some((c) => c.textContent?.includes('up_fixture'))).toBe(false)
    },
    15000,
  )

  it(
    'shows Copied only after a real clipboard success and no manual field',
    async () => {
      allowClipboard()
      render(createElement(BuildWithAI, { connections: 0 }))
      await connect()
      pick('pi')

      fireEvent.click(screen.getByRole('button', { name: 'Copy connection key' }))
      expect(await screen.findByText('Copied')).toBeTruthy()
      expect(screen.queryByLabelText('connection key for manual copy')).toBeNull()
    },
    15000,
  )

  it(
    'renders the exact AC5 messages for a remote HTTP URL and a malformed URL',
    async () => {
      mockConnect({ url: 'http://site.example/api/mcp?key=up_fixture' })
      render(createElement(BuildWithAI, { connections: 0 }))
      await connect()
      pick('pi')
      const https = await screen.findByRole('alert')
      expect(https.textContent).toContain('Use HTTPS to connect an AI client to a remote site.')
      expect(screen.queryByRole('button', { name: 'Copy MCP configuration' })).toBeNull()
      expect(document.body.textContent).not.toContain('up_fixture')

      cleanup()
      mockConnect({ url: 'not-a-url' })
      render(createElement(BuildWithAI, { connections: 0 }))
      await connect()
      const invalid = await screen.findByRole('alert')
      expect(invalid.textContent).toContain(
        'The connection could not be read. Reload the dashboard and create a new connection.',
      )
      expect(screen.queryByRole('button', { name: 'Copy MCP URL' })).toBeNull()
    },
    15000,
  )

  it(
    'keeps the three legacy flows and the HTTPS warning',
    async () => {
      mockConnect({ https: false })
      render(createElement(BuildWithAI, { connections: 0 }))
      await connect()

      pick('claude')
      expect(screen.getByText(/Add custom connector/i)).toBeTruthy()
      expect(screen.getByText(/only reach your site over HTTPS/i)).toBeTruthy()
      expect(codeFor('Copy connection address')).toBe(connection.url)

      pick('chatgpt')
      expect(screen.getByText(/Developer mode/i)).toBeTruthy()
      expect(screen.getByText(/only reach your site over HTTPS/i)).toBeTruthy()

      pick('claude-code')
      expect(screen.getByText(/claude mcp add --transport http ultimapress/i)).toBeTruthy()
      expect(screen.getByText(/only reach your site over HTTPS/i)).toBeTruthy()
    },
    15000,
  )
})
