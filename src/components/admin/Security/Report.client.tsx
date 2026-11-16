'use client'

import React, { useCallback, useState } from 'react'

import type { AddonState, SecurityFinding, SecurityResult, SecurityState } from '@/endpoints/security'

const when = (iso: string) => new Date(iso).toLocaleString('en-IE', { dateStyle: 'medium', timeStyle: 'short' })

const muted = 'var(--theme-elevation-600)'
const card: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 8,
  padding: '18px 20px',
  marginBottom: 14,
  background: 'var(--theme-elevation-0)',
}
const tone = {
  critical: { bg: 'var(--theme-error-100)', fg: 'var(--theme-error-750)', label: 'Critical' },
  warning: { bg: 'var(--theme-warning-100)', fg: 'var(--theme-warning-750)', label: 'Warning' },
  safe: { bg: 'var(--theme-elevation-100)', fg: 'var(--theme-elevation-800)', label: 'Marked safe' },
  ok: { bg: 'var(--theme-success-100)', fg: 'var(--theme-success-750)', label: 'Passed' },
  on: { bg: 'var(--theme-success-100)', fg: 'var(--theme-success-750)', label: 'On' },
}

const Badge = ({ kind }: { kind: keyof typeof tone }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      background: tone[kind].bg,
      color: tone[kind].fg,
    }}
  >
    {tone[kind].label}
  </span>
)

const Finding = ({ f, kind }: { f: SecurityFinding; kind: 'critical' | 'warning' | 'safe' }) => (
  <div style={card}>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
      <Badge kind={kind} />
      <strong>{f.title}</strong>
      {(f as SecurityFinding & { source?: string }).source === 'deep' && (
        <span style={{ fontSize: 12, color: muted }}>Found by the Deep check</span>
      )}
    </div>
    <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, color: muted, marginBottom: 8 }}>
      {f.file}, line {f.line}
    </div>
    {f.code && (
      <pre
        style={{
          margin: '0 0 10px',
          padding: '8px 10px',
          background: 'var(--theme-elevation-50)',
          borderRadius: 6,
          fontSize: 12.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {f.code}
      </pre>
    )}
    {kind === 'safe' ? (
      <p style={{ margin: 0, lineHeight: 1.55 }}>
        <strong>Reason given in the code:</strong> {f.reason}
      </p>
    ) : (
      <>
        <p style={{ margin: '0 0 6px', lineHeight: 1.55 }}>{f.why}</p>
        <p style={{ margin: 0, lineHeight: 1.55 }}>
          <strong>How to fix:</strong> {f.fix}
        </p>
      </>
    )}
  </div>
)

function CopyForClaude({ text }: { text?: string }) {
  const [copied, setCopied] = useState(false)
  if (!text) return null
  return (
    <button
      type="button"
      className="btn btn--style-secondary btn--size-small"
      style={{ margin: 0 }}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2500)
        } catch {
          window.prompt('Copy this for Claude:', text)
        }
      }}
    >
      {copied ? 'Copied' : 'Copy for Claude'}
    </button>
  )
}

function Results({ r }: { r: SecurityResult }) {
  const p = r.packages
  return (
    <>
      {r.critical.length > 0 && (
        <>
          <h3 style={{ margin: '24px 0 10px' }}>Critical ({r.critical.length})</h3>
          {r.critical.map((f, i) => (
            <Finding key={`c${i}`} f={f} kind="critical" />
          ))}
        </>
      )}
      {r.warnings.length > 0 && (
        <>
          <h3 style={{ margin: '24px 0 10px' }}>Warnings ({r.warnings.length})</h3>
          <p style={{ color: muted, margin: '0 0 12px' }}>These do not stop an update, but are worth fixing.</p>
          {r.warnings.map((f, i) => (
            <Finding key={`w${i}`} f={f} kind="warning" />
          ))}
        </>
      )}
      {r.deep && (
        <p style={{ color: muted, margin: '20px 0 0', lineHeight: 1.55 }}>
          {r.deep.ran
            ? `Deep check: ran on this version. ${r.deep.sameAsOfficial} result(s) in code that is the same as the official UltimaPress were left out, and ${r.deep.hints} low-confidence hint(s) are not shown.`
            : `Deep check: could not run this time. ${r.deep.error || ''}`}
        </p>
      )}
      {p.reason !== 'Skipped.' && <h3 style={{ margin: '24px 0 10px' }}>Packages</h3>}
      {p.reason !== 'Skipped.' && <div style={card}>
        {p.checked && p.counts ? (
          <>
            <p style={{ margin: '0 0 8px', lineHeight: 1.55 }}>
              Known vulnerabilities in the packages your site uses: {p.counts.critical} critical, {p.counts.high} high,{' '}
              {p.counts.moderate} moderate, {p.counts.low} low. These come from the packages, not your own code, so
              they never stop an update. Updating UltimaPress, or asking Claude to update the packages, fixes them.
            </p>
            {(p.items || []).length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                {(p.items || []).map((it, i) => (
                  <li key={i}>
                    <strong>{it.package}</strong> ({it.severity}): {it.title}
                    {it.fixedIn && !it.fixedIn.startsWith('<0.0.0') ? `. Fixed in ${it.fixedIn}` : '. No fix released yet'}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p style={{ margin: 0 }}>Not checked this time. {p.reason}</p>
        )}
      </div>}
      {r.markedSafe.length > 0 && (
        <>
          <h3 style={{ margin: '24px 0 10px' }}>Marked safe in the code ({r.markedSafe.length})</h3>
          <p style={{ color: muted, margin: '0 0 12px', lineHeight: 1.55 }}>
            The code says these are safe on purpose and gives a reason. Read the reasons: if one does not sound right,
            ask Claude to fix that part properly instead.
          </p>
          {r.markedSafe.map((f, i) => (
            <Finding key={`s${i}`} f={f} kind="safe" />
          ))}
        </>
      )}
    </>
  )
}

function DeepCheck({ initial, onChange }: { initial?: AddonState[]; onChange: () => void }) {
  const [addon, setAddon] = useState<AddonState | undefined>(initial?.find((a) => a.id === 'deep-check'))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // While it downloads, check back every few seconds.
  React.useEffect(() => {
    if (!addon?.installing) return
    const t = setInterval(async () => {
      const r = await fetch('/api/up/security/addons', { credentials: 'include' })
      const b = await r.json().catch(() => ({}))
      const next = (b.addons || []).find((a: AddonState) => a.id === 'deep-check')
      setAddon(next)
      if (next && !next.installing) onChange()
    }, 4000)
    return () => clearInterval(t)
  }, [addon?.installing, onChange])

  const toggle = async (enabled: boolean) => {
    setBusy(true)
    setError('')
    const r = await fetch('/api/up/security/addons', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'deep-check', enabled }),
    })
    const b = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) return setError(b.error || 'That did not work.')
    setAddon((b.addons || []).find((a: AddonState) => a.id === 'deep-check'))
    if (!enabled) onChange()
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <strong style={{ fontSize: 16 }}>Deep check</strong>
        {addon?.enabled && <Badge kind="on" />}
        <span style={{ fontSize: 12, color: muted }}>Free add-on</span>
      </div>
      <p style={{ margin: '0 0 10px', lineHeight: 1.6 }}>
        Adds a second, more thorough scanner (Opengrep, with about 170 security rules for JavaScript and TypeScript)
        to every check. It follows how data moves through the code, so it catches problems the built-in check cannot,
        such as visitor input reaching file paths. It only reports code that differs from the official UltimaPress,
        so you see what was added for your site.
      </p>
      <p style={{ margin: '0 0 14px', lineHeight: 1.6, color: muted }}>
        Turning it on downloads the scanner (about 160 MB) to your server, where it stays through updates. Each update
        then takes about a minute longer. Its critical findings stop an update like the built-in ones.
      </p>
      {!addon ? (
        <p style={{ margin: 0, color: muted }}>Add-ons are installed on your server, so they can be turned on there, not here.</p>
      ) : !addon.available ? (
        <p style={{ margin: 0, color: muted }}>Not available for this type of server.</p>
      ) : addon.installing ? (
        <p style={{ margin: 0 }}>Downloading and installing… this takes a minute or two.</p>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${addon.enabled ? 'btn--style-secondary' : 'btn--style-primary'} btn--size-small`}
            style={{ margin: 0 }}
            disabled={busy}
            onClick={() => toggle(!addon.enabled)}
          >
            {addon.enabled ? 'Turn off and remove' : 'Turn on'}
          </button>
          {addon.enabled && addon.installedAt && (
            <span style={{ color: muted, fontSize: 13 }}>
              Opengrep {addon.version}, installed {when(addon.installedAt)}
            </span>
          )}
        </div>
      )}
      {(error || addon?.error) && <p style={{ color: 'var(--theme-error-500)', margin: '10px 0 0' }}>{error || addon?.error}</p>}
      <p style={{ margin: '14px 0 0', fontSize: 12.5, color: muted, lineHeight: 1.55 }}>
        Opengrep is open source (LGPL 2.1). The rules come from semgrep-rules (LGPL 2.1 with the Commons Clause), so
        this add-on is free and cannot be sold.
      </p>
    </div>
  )
}

export function SecurityReport({
  initial,
  initialError,
}: {
  initial: SecurityState
  initialError?: string
}) {
  const [state, setState] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError || '')

  const check = useCallback(async () => {
    setBusy(true)
    setError('')
    const r = await fetch('/api/up/security', { method: 'POST', credentials: 'include' })
    const b = await r.json().catch(() => ({}))
    setBusy(false)
    if (r.ok) setState(b)
    else setError(b.error || 'The check could not run.')
  }, [])

  const live = state.live
  return (
    <div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>Your live site</h2>
        {live && <Badge kind={live.critical.length ? 'critical' : live.warnings.length ? 'warning' : 'ok'} />}
      </div>
      <p style={{ color: muted, margin: '0 0 16px' }}>
        {live
          ? `Last checked ${when(live.scannedAt)}: ${live.files} code files, ${live.critical.length} critical, ${live.warnings.length} warnings.`
          : 'Not checked yet. The first check runs a few minutes after the site starts, or check now.'}
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        <button type="button" className="btn btn--style-primary btn--size-small" style={{ margin: 0 }} onClick={check} disabled={busy}>
          {busy ? 'Checking…' : 'Check now'}
        </button>
        {live && (live.critical.length > 0 || live.warnings.length > 0) && <CopyForClaude text={live.forClaude} />}
      </div>
      {error && <p style={{ color: 'var(--theme-error-500)' }}>{error}</p>}
      {live && live.critical.length === 0 && live.warnings.length === 0 && (
        <p style={{ margin: '14px 0 0' }}>No problems found in your site’s code.</p>
      )}
      {live && <Results r={live} />}

      <h2 style={{ margin: '40px 0 12px' }}>Add-ons</h2>
      <DeepCheck initial={state.addons} onChange={check} />

      <p style={{ color: muted, margin: '32px 0 0', lineHeight: 1.6, fontSize: 13 }}>
        The check looks for the most common ways websites get broken into: actions anyone can use without logging in,
        content anyone can change, visitor input that reaches the database or the page unescaped, passwords and keys
        written into the code, and packages with known vulnerabilities. It catches common mistakes, not every possible
        problem, so keep backups and two-factor login on.
      </p>
    </div>
  )
}
