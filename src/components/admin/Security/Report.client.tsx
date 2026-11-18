'use client'

import React, { useCallback, useState } from 'react'

import type {
  AddonState,
  SecurityFinding,
  SecurityResult,
  SecurityState,
  SiteScanResult,
} from '@/endpoints/security'

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
      {r.deep &&
        (r.deep.ran ? (
          (() => {
            const found = [...r.critical, ...r.warnings].filter(
              (f) => (f as SecurityFinding & { source?: string }).source === 'deep',
            ).length
            return (
              <details style={{ color: muted, margin: '20px 0 0', lineHeight: 1.55 }}>
                <summary style={{ cursor: 'pointer' }}>
                  {found === 0
                    ? 'Deep check: no problems found in the code added for your site.'
                    : `Deep check: ${found} problem${found === 1 ? '' : 's'} found in the code added for your site, listed above.`}
                </summary>
                <p style={{ margin: '8px 0 0' }}>
                  Deep check looks at the code added or changed for your site, such as the features
                  Claude built for you. The rest of your site is the standard UltimaPress code.
                </p>
              </details>
            )
          })()
        ) : (
          <p style={{ color: muted, margin: '20px 0 0', lineHeight: 1.55 }}>
            Deep check could not run this time. {r.deep.error || ''}
          </p>
        ))}
      {(p.items || []).length > 0 && <h3 style={{ margin: '24px 0 10px' }}>Packages</h3>}
      {(p.items || []).length > 0 && <div style={card}>
        {p.checked && p.counts ? (
          <>
            <p style={{ margin: '0 0 8px', lineHeight: 1.55 }}>
              Packages added for your site have known vulnerabilities: {p.counts.critical} critical, {p.counts.high}{' '}
              high, {p.counts.moderate} moderate, {p.counts.low} low. They never stop an update. Ask Claude to update
              these packages.
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
        <div style={{ ...card, marginTop: 24 }}>
          <p style={{ margin: '0 0 12px', lineHeight: 1.6 }}>
            {r.markedSafe.length} place{r.markedSafe.length === 1 ? ' in your added code is' : 's in your added code are'}{' '}
            marked safe by Claude, so the check skips {r.markedSafe.length === 1 ? 'it' : 'them'}. Ask Claude to double-check{' '}
            {r.markedSafe.length === 1 ? 'it' : 'them'} in a new chat.
          </p>
          <CopyForClaude
            text={[
              'The UltimaPress security check skips these places in my site’s code because they are marked "// up-security: <reason>". Please review each one as an attacker would: is the reason really true? If not, fix the code properly and remove the marker.',
              '',
              ...r.markedSafe.map((f, i) => `${i + 1}. ${f.file}:${f.line}\n   ${f.code}\n   Check skipped: ${f.title}\n   Reason given: ${f.reason}`),
            ].join('\n')}
          />
        </div>
      )}
    </>
  )
}

function DeepCheck({
  initial,
  onChange,
  checking,
  live,
}: {
  initial?: AddonState[]
  onChange: () => void
  checking: boolean
  live: SecurityResult | null
}) {
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
          {addon.enabled && (
            <button
              type="button"
              className="btn btn--style-primary btn--size-small"
              style={{ margin: 0 }}
              disabled={busy || checking}
              onClick={onChange}
            >
              {checking ? 'Scanning…' : 'Scan now'}
            </button>
          )}
          <button
            type="button"
            className={`btn ${addon.enabled ? 'btn--style-secondary' : 'btn--style-primary'} btn--size-small`}
            style={{ margin: 0 }}
            disabled={busy || checking}
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
      {addon?.enabled && !addon.installing && (
        <p style={{ margin: '14px 0 0', fontWeight: 600 }}>
          {!live?.deep
            ? 'Not scanned yet. Press Scan now.'
            : !live.deep.ran
              ? `The last scan could not run. ${live.deep.error || ''}`
              : (() => {
                  const n = [...live.critical, ...live.warnings].filter(
                    (f) => (f as SecurityFinding & { source?: string }).source === 'deep',
                  ).length
                  return `Last scan ${when(live.scannedAt)}: ${n === 0 ? 'no problems found in your added code.' : `${n} problem${n === 1 ? '' : 's'} found, listed above.`}`
                })()}
        </p>
      )}
      <p style={{ margin: '14px 0 0', fontSize: 12.5, color: muted, lineHeight: 1.55 }}>
        Opengrep is open source (LGPL 2.1). The rules come from semgrep-rules (LGPL 2.1 with the Commons Clause), so
        this add-on is free and cannot be sold.
      </p>
    </div>
  )
}

const riskTone = (s: string): keyof typeof tone =>
  s === 'critical' || s === 'high' ? 'critical' : s === 'medium' ? 'warning' : 'safe'
const riskLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function SiteScan({ initial }: { initial?: AddonState[] }) {
  const [addon, setAddon] = useState<AddonState | undefined>(initial?.find((a) => a.id === 'site-scan'))
  const [result, setResult] = useState<SiteScanResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const r = await fetch('/api/up/security/site-scan', { credentials: 'include', cache: 'no-store' })
    const b = await r.json().catch(() => ({}))
    if (b.addon) setAddon(b.addon)
    setResult(b.result || null)
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  // While it installs or scans, check back every few seconds.
  React.useEffect(() => {
    if (!addon?.installing && !addon?.scanning) return
    const t = setInterval(refresh, 4000)
    return () => clearInterval(t)
  }, [addon?.installing, addon?.scanning, refresh])

  const post = async (url: string, body?: object) => {
    setBusy(true)
    setError('')
    const r = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    })
    const b = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) return setError(b.error || 'That did not work.')
    if (b.addon) setAddon(b.addon)
    else setAddon((b.addons || []).find((a: AddonState) => a.id === 'site-scan'))
    if ('result' in b) setResult(b.result || null)
  }

  const c = result?.counts
  return (
    <div style={card}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <strong style={{ fontSize: 16 }}>Scan my site</strong>
        {addon?.enabled && <Badge kind="on" />}
        <span style={{ fontSize: 12, color: muted }}>Free add-on</span>
      </div>
      <p style={{ margin: '0 0 10px', lineHeight: 1.6 }}>
        Tests your running site from the outside, the way a visitor or an attacker would see it. OWASP ZAP looks
        through your pages and reports unsafe responses, such as missing security headers, insecure cookies or pages
        that leak information. Nuclei checks for known problems, such as exposed files and outdated server software.
      </p>
      <p style={{ margin: '0 0 14px', lineHeight: 1.6, color: muted }}>
        It only ever scans your own site{addon?.target ? ` (${addon.target})` : ''}, and only with checks that read
        what your site sends back: it does not submit your forms or try to break in, so a scan never creates
        comments, entries or posts. Turning it on downloads the tools (about 350 MB) to your server. A scan takes 5
        to 15 minutes.
      </p>
      {!addon ? (
        <p style={{ margin: 0, color: muted }}>Add-ons are installed on your server, so they can be turned on there, not here.</p>
      ) : !addon.available ? (
        <p style={{ margin: 0, color: muted }}>Not available for this type of server.</p>
      ) : addon.installing ? (
        <p style={{ margin: 0 }}>{addon.step || 'Installing'}… this takes a few minutes.</p>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {addon.enabled && (
            <button
              type="button"
              className="btn btn--style-primary btn--size-small"
              style={{ margin: 0 }}
              disabled={busy || addon.scanning}
              onClick={() => post('/api/up/security/site-scan')}
            >
              {addon.scanning ? 'Scanning…' : 'Scan now'}
            </button>
          )}
          <button
            type="button"
            className={`btn ${addon.enabled ? 'btn--style-secondary' : 'btn--style-primary'} btn--size-small`}
            style={{ margin: 0 }}
            disabled={busy || addon.scanning}
            onClick={() => post('/api/up/security/addons', { id: 'site-scan', enabled: !addon.enabled })}
          >
            {addon.enabled ? 'Turn off and remove' : 'Turn on'}
          </button>
          {addon.scanning && addon.scanStep && <span style={{ color: muted, fontSize: 13 }}>{addon.scanStep}…</span>}
        </div>
      )}
      {(error || addon?.error) && <p style={{ color: 'var(--theme-error-500)', margin: '10px 0 0' }}>{error || addon?.error}</p>}

      {addon?.enabled && result && c && (
        <div style={{ marginTop: 20 }}>
          <p style={{ margin: '0 0 6px', fontWeight: 600 }}>
            {c.critical + c.high === 0 ? 'No serious problems found.' : `${c.critical + c.high} serious problem(s) to fix.`}
          </p>
          <p style={{ color: muted, margin: '0 0 12px' }}>
            Last scan {when(result.finishedAt)}: {c.critical} critical, {c.high} high, {c.medium} medium, {c.low} low.
            {!result.tools.zap.ran && ` ${result.tools.zap.error || 'ZAP did not finish.'}`}
            {!result.tools.nuclei.ran && ` ${result.tools.nuclei.error || 'Nuclei did not finish.'}`}
          </p>
          {result.findings.length === 0 && <p style={{ margin: 0 }}>Nothing needs your attention.</p>}
          {result.findings.map((f, i) => (
            <div key={i} style={{ ...card, marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    background: tone[riskTone(f.severity)].bg,
                    color: tone[riskTone(f.severity)].fg,
                  }}
                >
                  {riskLabel(f.severity)}
                </span>
                <strong>{f.title}</strong>
                <span style={{ fontSize: 12, color: muted }}>
                  {f.tool}
                  {f.ref ? `, ${f.ref}` : ''}
                  {f.count > 1 ? `, ${f.count} places` : ''}
                </span>
              </div>
              {f.where.length > 0 && (
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12.5, color: muted, marginBottom: 6, wordBreak: 'break-all' }}>
                  {f.where.join('  ')}
                </div>
              )}
              {f.detail && <p style={{ margin: '0 0 6px', lineHeight: 1.55 }}>{f.detail}</p>}
              {f.fix && (
                <p style={{ margin: 0, lineHeight: 1.55 }}>
                  <strong>How to fix:</strong> {f.fix}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {addon?.enabled && result && (result.accepted || []).length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', color: muted }}>
            Checked, not a problem on UltimaPress ({(result.accepted || []).length})
          </summary>
          <ul style={{ margin: '10px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
            {/* One line per reason, listing the findings it covers. */}
            {Array.from(new Set((result.accepted || []).map((a) => a.reason))).map((reason, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <strong>
                  {(result.accepted || [])
                    .filter((a) => a.reason === reason)
                    .map((a) => a.title)
                    .join(', ')}
                </strong>
                <br />
                {reason}
              </li>
            ))}
          </ul>
        </details>
      )}
      <p style={{ margin: '14px 0 0', fontSize: 12.5, color: muted, lineHeight: 1.55 }}>
        OWASP ZAP (Apache 2.0) and Nuclei (MIT) are open source. Some findings can be false alarms: check each one, or
        paste it into Claude and ask whether it applies to your site.
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
      <DeepCheck initial={state.addons} onChange={check} checking={busy} live={state.live} />
      <SiteScan initial={state.addons} />

      <p style={{ color: muted, margin: '32px 0 0', lineHeight: 1.6, fontSize: 13 }}>
        The check looks for the most common ways websites get broken into: actions anyone can use without logging in,
        content anyone can change, visitor input that reaches the database or the page unescaped, passwords and keys
        written into the code, and packages with known vulnerabilities. It catches common mistakes, not every possible
        problem, so keep backups and two-factor login on.
      </p>
    </div>
  )
}
