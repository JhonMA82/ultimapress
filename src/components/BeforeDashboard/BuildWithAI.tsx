'use client'

import React, { useState } from 'react'

import { BUILD_FEATURE_STARTER, CodingAgentSetup } from '../admin/CodingAgentSetup'
import { Icon } from './icons'
import { nativeMcpConfig, parseMcpConnection, type NativeMcpClient } from './nativeMcpSetup'

type Connection = { url: string; claudeCode: string; https: boolean }

const CLIENTS = [
  { value: '', label: 'Any MCP-compatible client' },
  { value: 'claude', label: 'Claude' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'claude-code', label: 'Claude Code' },
  { value: 'omp', label: 'Oh My Pi' },
  { value: 'opencode', label: 'OpenCode V2' },
  { value: 'pi', label: 'Pi Agent' },
] as const

type ClientId = (typeof CLIENTS)[number]['value']

const NATIVE: Record<
  NativeMcpClient,
  { label: string; file: string; container: string; check: string }
> = {
  omp: {
    label: 'Oh My Pi',
    file: '~/.omp/agent/mcp.json (or ~/.omp/profiles/<profile>/agent/mcp.json)',
    container: 'mcpServers',
    check: 'Inside the agent, run /mcp reload, then /mcp test ultimapress.',
  },
  opencode: {
    label: 'OpenCode V2',
    file: '~/.config/opencode/opencode.json, or the .jsonc file you already use',
    container: 'mcp.servers',
    check: 'Run opencode mcp list.',
  },
  pi: {
    label: 'Pi Agent',
    file: '~/.pi/agent/mcp.json',
    container: 'mcpServers',
    check: 'Run pi mcp list; in an open session, run /reload.',
  },
}

const ENV_COMMAND =
  "read -rsp 'UltimaPress MCP key: ' ULTIMAPRESS_MCP_KEY; export ULTIMAPRESS_MCP_KEY; printf '\\n'"

const contentIdeas = [
  'Write a blog post about our opening hours and publish it as a draft',
  'Add an FAQ section to the homepage with 5 questions customers ask',
  'Switch the site to the Dark template and make the accent green',
  'Approve all pending comments that are not spam',
]

const featureIdeas = [
  'Add an events section with dates, a venue and a booking button',
  'Add a team block with photos, roles and LinkedIn links',
  'Let visitors book a call and email me each booking',
]

/** Clipboard with a manual fallback; returns whether the copy actually happened. */
async function writeClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    // Clipboard API blocked (permissions or a non-secure context): try the old path.
  }
  try {
    const t = document.createElement('textarea')
    t.value = value
    t.setAttribute('readonly', '')
    t.style.position = 'fixed'
    t.style.opacity = '0'
    document.body.appendChild(t)
    t.select()
    const ok = document.execCommand('copy')
    t.remove()
    return ok
  } catch {
    return false
  }
}

function CopyField({
  value,
  label,
  action = 'Copy',
}: {
  value: string
  label: string
  action?: string
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const multiline = value.includes('\n')
  return (
    <div className="up-claude__copy">
      <code>{value}</code>
      <button
        type="button"
        className="up-dash__btn up-dash__btn--small"
        onClick={async () => {
          const ok = await writeClipboard(value)
          setState(ok ? 'copied' : 'manual')
          if (ok) setTimeout(() => setState('idle'), 1800)
        }}
        aria-label={action === 'Copy' ? `Copy ${label}` : action}
      >
        {state === 'copied' ? 'Copied' : action}
      </button>
      {state === 'manual' && (
        <textarea
          className="up-claude__manual"
          readOnly
          rows={multiline ? Math.min(10, value.split('\n').length) : 1}
          value={value}
          aria-label={`${label} for manual copy`}
          onFocus={(e) => e.currentTarget.select()}
        />
      )}
    </div>
  )
}

/** Copies a secret without rendering it anywhere by default. */
function CopySecret({ value, label, action }: { value: string; label: string; action: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle')
  return (
    <>
      <button
        type="button"
        className="up-dash__btn up-dash__btn--small"
        onClick={async () => {
          const ok = await writeClipboard(value)
          setState(ok ? 'copied' : 'manual')
          if (ok) setTimeout(() => setState('idle'), 1800)
        }}
        aria-label={action}
      >
        {state === 'copied' ? 'Copied' : action}
      </button>
      {state === 'manual' && (
        <textarea
          className="up-claude__manual"
          readOnly
          rows={1}
          value={value}
          aria-label={`${label} for manual copy`}
          onFocus={(e) => e.currentTarget.select()}
        />
      )}
    </>
  )
}

/**
 * "Build with AI": connect an AI client to this site in one click (content and settings), with
 * native configuration for the common clients, and the short path for building brand-new
 * features with any coding agent.
 */
export function BuildWithAI({ connections }: { connections: number }) {
  const [tab, setTab] = useState<'content' | 'features'>('content')
  const [client, setClient] = useState<ClientId>('')
  const [busy, setBusy] = useState(false)
  const [conn, setConn] = useState<Connection | null>(null)
  const [error, setError] = useState('')

  async function connect() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/claude-connect', { method: 'POST', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create the connection.')
      setConn(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const native = client === 'omp' || client === 'opencode' || client === 'pi'
  const nativeMeta = native ? NATIVE[client as NativeMcpClient] : null
  const parsed = conn && (client === '' || native) ? parseMcpConnection(conn.url) : null
  const parseError =
    parsed && !parsed.ok
      ? parsed.reason === 'https-required'
        ? 'Use HTTPS to connect an AI client to a remote site.'
        : 'The connection could not be read. Reload the dashboard and create a new connection.'
      : ''

  function legacy() {
    if (!conn) return null
    return (
      <ol className="up-claude__steps">
        <li>
          <strong>Copy your connection address</strong>
          <small>Keep it private: it works like a password. It is only shown once.</small>
          <CopyField value={conn.url} label="connection address" action="Copy connection address" />
        </li>
        <li>
          <strong>Add it to {client === 'chatgpt' ? 'ChatGPT' : 'Claude'}</strong>
          <small>
            {client === 'claude' && (
              <>
                Open <b>Settings → Connectors → Add custom connector</b>, name it
                &ldquo;UltimaPress&rdquo; and paste the address.
              </>
            )}
            {client === 'chatgpt' && (
              <>
                Turn on Developer mode, then open <b>Settings → Plugins → +</b>, name it
                &ldquo;UltimaPress&rdquo;, paste the address and set Authentication to
                <b> No authentication</b>.
              </>
            )}
          </small>
        </li>
        <li>
          <strong>Ask for anything</strong>
          <small>Start a new chat and describe what you want done on your site.</small>
        </li>
      </ol>
    )
  }

  return (
    <section className="up-dash__card up-claude" id="build-with-claude">
      <div className="up-claude__head">
        <span className="up-claude__logo">
          <Icon name="sparkles" />
        </span>
        <div>
          <h2 className="up-dash__h">Build with AI</h2>
          <p>Connect your AI client to this site, then just ask.</p>
        </div>
      </div>

      <div className="up-claude__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'content'}
          className={tab === 'content' ? 'is-on' : ''}
          onClick={() => setTab('content')}
        >
          Content & design
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'features'}
          className={tab === 'features' ? 'is-on' : ''}
          onClick={() => setTab('features')}
        >
          New features
        </button>
      </div>

      {tab === 'content' && (
        <div className="up-claude__body">
          <div className="up-claude__client">
            <label htmlFor="up-ai-client">AI client</label>
            <select
              id="up-ai-client"
              value={client}
              onChange={(e) => setClient(e.target.value as ClientId)}
            >
              {CLIENTS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {!conn ? (
            <>
              <p className="up-claude__lead">
                Your AI writes pages and posts, edits your menus, changes the template and colours,
                and moderates comments, with the same permissions as your account.
              </p>
              <button type="button" className="up-claude__connect" onClick={connect} disabled={busy}>
                <Icon name="plug" size={18} /> {busy ? 'Connecting…' : 'Connect AI Client'}
              </button>
              {connections > 0 && (
                <p className="up-claude__note">
                  {connections} connection{connections === 1 ? '' : 's'} active.{' '}
                  <a href="/admin/collections/payload-mcp-api-keys">Manage connections</a>
                </p>
              )}
            </>
          ) : (
            <>
              {!conn.https && (client === 'claude' || client === 'chatgpt' || client === 'claude-code') && (
                <p className="up-claude__warn">
                  AI apps can only reach your site over HTTPS. Set your domain first (DOMAIN in
                  Docker Manager), then create the connection again.
                </p>
              )}

              {client === 'claude' && legacy()}
              {client === 'chatgpt' && legacy()}
              {client === 'claude-code' && (
                <ol className="up-claude__steps">
                  <li>
                    <strong>Add the server from your terminal</strong>
                    <small>Run this once in the folder where you use Claude Code.</small>
                    <CopyField
                      value={conn.claudeCode}
                      label="Claude Code command"
                      action="Copy command"
                    />
                  </li>
                  <li>
                    <strong>Ask for anything</strong>
                    <small>Start a new session and describe what you want done on your site.</small>
                  </li>
                </ol>
              )}

              {client === '' && parsed?.ok && (
                <ol className="up-claude__steps">
                  <li>
                    <strong>Use Streamable HTTP</strong>
                    <small>
                      In your client, add a remote MCP server with this address. It does not
                      include the key.
                    </small>
                    <CopyField value={parsed.endpoint} label="MCP URL" action="Copy MCP URL" />
                  </li>
                  <li>
                    <strong>Add the authorization header</strong>
                    <small>
                      <code>Authorization: Bearer &lt;connection key&gt;</code>. Copy the key and
                      paste it where your client asks for the header value.
                    </small>
                    <CopySecret
                      value={parsed.key}
                      label="connection key"
                      action="Copy connection key"
                    />
                  </li>
                  <li>
                    <strong>Ask for anything</strong>
                    <small>Start a new chat and describe what you want done on your site.</small>
                  </li>
                </ol>
              )}

              {nativeMeta && parsed?.ok && (
                <ol className="up-claude__steps">
                  <li>
                    <strong>Copy the key</strong>
                    <small>
                      It is shown only now. <code>ULTIMAPRESS_MCP_KEY</code> must exist in the
                      client&apos;s process before it starts.
                    </small>
                    <CopySecret
                      value={parsed.key}
                      label="connection key"
                      action="Copy connection key"
                    />
                    <CopyField value={ENV_COMMAND} label="MCP key command" action="Copy command" />
                    <small>
                      Run that in the terminal of the folder, then launch the client from the same
                      terminal. If you start it elsewhere, load the secret into the app&apos;s
                      environment. Do not paste the key into a prompt or a config file.
                    </small>
                  </li>
                  <li>
                    <strong>Add the {nativeMeta.label} entry</strong>
                    <small>
                      Open <code>{nativeMeta.file}</code> and merge only the{' '}
                      <code>ultimapress</code> entry into{' '}
                      <code>{nativeMeta.container}</code>; keep the others.
                      If <code>ultimapress</code> already points to another site, use a different
                      name and a different variable for each site so you do not overwrite it.
                    </small>
                    <CopyField
                      key={client}
                      value={nativeMcpConfig(client as NativeMcpClient, parsed.endpoint)}
                      label="MCP configuration"
                      action="Copy MCP configuration"
                    />
                  </li>
                  <li>
                    <strong>Check it</strong>
                    <small>{nativeMeta.check}</small>
                  </li>
                  <li>
                    <strong>Ask for anything</strong>
                    <small>Start a new chat and describe what you want done on your site.</small>
                  </li>
                </ol>
              )}

              {(client === '' || native) && (
                <>
                  {parseError && (
                    <p className="up-claude__warn" role="alert">
                      {parseError}
                    </p>
                  )}
                  {client === '' && parsed?.ok && (
                    <details className="up-claude__more">
                      <summary>My client only accepts a URL</summary>
                      <p className="up-claude__note">
                        This address includes the key and works like a password. Only use it with a
                        client you trust.
                      </p>
                      <CopyField
                        value={conn.url}
                        label="connection address (includes key)"
                        action="Copy connection address"
                      />
                    </details>
                  )}
                </>
              )}

              <p className="up-claude__note">
                See or remove connections under{' '}
                <a href="/admin/collections/payload-mcp-api-keys">Manage connections</a>. A
                connection acts with your permissions: an Author can write posts but not change
                pages or settings.
              </p>
            </>
          )}
          {error && (
            <p className="up-dash__error" role="alert">
              {error}
            </p>
          )}
          <div className="up-claude__ideas">
            <span>Try asking</span>
            {contentIdeas.map((i) => (
              <em key={i}>&ldquo;{i}&rdquo;</em>
            ))}
          </div>
        </div>
      )}

      {tab === 'features' && (
        <div className="up-claude__body">
          <p className="up-claude__lead">
            For something your site can&apos;t do yet, a coding agent adds it to the site itself.
            UltimaPress comes with instructions the agent reads first, so new features match your
            templates and keep working after updates.
          </p>
          <ol className="up-claude__steps">
            <li>
              <strong>Download your site&apos;s code</strong>
              <small>One click gives you a zip of your site. Unzip it on your computer.</small>
              <a className="up-dash__btn up-dash__btn--ghost up-dash__btn--small" href="/admin/site-code">
                Open Site code
              </a>
            </li>
            <li>
              <strong>Open the folder in your agent</strong>
              <small>
                <CodingAgentSetup />
              </small>
            </li>
            <li>
              <strong>Describe the feature</strong>
              <small>Start your request like this:</small>
              <CopyField
                value={BUILD_FEATURE_STARTER}
                label="starter prompt"
                action="Copy starter prompt"
              />
            </li>
            <li>
              <strong>Put it live</strong>
              <small>
                Tell your agent &ldquo;put it live&rdquo;. It runs <code>pnpm ship</code>, which
                sends the folder; nothing is live until you confirm with your password in Site
                code. Your content stays as it is.
              </small>
            </li>
          </ol>
          <div className="up-claude__ideas">
            <span>Ideas</span>
            {featureIdeas.map((i) => (
              <em key={i}>&ldquo;{i}&rdquo;</em>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
