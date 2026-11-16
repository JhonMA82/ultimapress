'use client'

import React, { useCallback, useEffect, useState } from 'react'

type Snippet = { id: string; code: string; location: 'head' | 'bodyStart' | 'bodyEnd'; needsConsent: boolean }

export type ConsentProps = {
  /** Show the banner (asks for consent). */
  banner: boolean
  text: string
  privacyHref: string | null
  ga4Id?: string | null
  gtmId?: string | null
  metaPixelId?: string | null
  plausibleDomain?: string | null
  snippets: Snippet[]
}

const KEY = 'up-consent'
const read = (): 'yes' | 'no' | null => {
  try {
    const v = window.localStorage.getItem(KEY)
    return v === 'yes' || v === 'no' ? v : null
  } catch {
    return null
  }
}

/** Adds HTML to the page so that its <script> tags actually run. */
function inject(html: string, where: 'head' | 'bodyStart' | 'bodyEnd', id: string) {
  if (document.querySelector(`[data-up-snippet="${id}"]`)) return
  const tpl = document.createElement('template')
  // up-security: the owner's own code snippets from Settings, which only administrators can edit
  tpl.innerHTML = html
  const target = where === 'head' ? document.head : document.body
  const nodes = Array.from(tpl.content.childNodes)
  const marker = document.createComment(`up-snippet ${id}`)
  if (where === 'bodyStart') target.insertBefore(marker, target.firstChild)
  else target.appendChild(marker)
  for (const node of nodes) {
    let el: Node = node
    if (node instanceof HTMLScriptElement) {
      const s = document.createElement('script')
      for (const a of Array.from(node.attributes)) s.setAttribute(a.name, a.value)
      s.text = node.text
      el = s
    }
    if (el instanceof Element) el.setAttribute('data-up-snippet', id)
    target.insertBefore(el, marker.nextSibling ? marker.nextSibling : null)
  }
}

const script = (src: string, id: string, attrs: Record<string, string> = {}) => {
  if (document.getElementById(id)) return
  const s = document.createElement('script')
  s.id = id
  s.async = true
  s.src = src
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v)
  document.head.appendChild(s)
}

const inline = (code: string, id: string) => {
  if (document.getElementById(id)) return
  const s = document.createElement('script')
  s.id = id
  s.text = code
  document.head.appendChild(s)
}

/** Loads the tools that need consent, only once the visitor has accepted. */
function loadConsented(p: ConsentProps) {
  const ga = p.ga4Id?.trim()
  if (ga && /^G-[A-Z0-9]+$/i.test(ga)) {
    script(`https://www.googletagmanager.com/gtag/js?id=${ga}`, 'up-ga4')
    inline(
      `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}');`,
      'up-ga4-init',
    )
  }
  const gtm = p.gtmId?.trim()
  if (gtm && /^GTM-[A-Z0-9]+$/i.test(gtm)) {
    inline(
      `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`,
      'up-gtm',
    )
  }
  const px = p.metaPixelId?.trim()
  if (px && /^\d+$/.test(px)) {
    inline(
      `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${px}');fbq('track','PageView');`,
      'up-pixel',
    )
  }
  for (const s of p.snippets) if (s.needsConsent) inject(s.code, s.location, s.id)
}

/** Cookie banner, optional analytics tools and code snippets. */
export function Consent(props: ConsentProps) {
  const [choice, setChoice] = useState<'yes' | 'no' | null | 'unknown'>('unknown')
  const [open, setOpen] = useState(false)

  // Tools and snippets that need no consent load straight away.
  useEffect(() => {
    const domain = props.plausibleDomain?.trim()
    if (domain) script('https://plausible.io/js/script.js', 'up-plausible', { 'data-domain': domain, defer: '' })
    for (const s of props.snippets) if (!s.needsConsent) inject(s.code, s.location, s.id)
    const c = read()
    setChoice(c)
    if (c === 'yes' || !props.banner) loadConsented(props)
    const reopen = () => setOpen(true)
    window.addEventListener('up-consent-open', reopen)
    return () => window.removeEventListener('up-consent-open', reopen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const decide = useCallback(
    (v: 'yes' | 'no') => {
      try {
        window.localStorage.setItem(KEY, v)
      } catch {
        /* private mode: the choice lasts for this page */
      }
      setChoice(v)
      setOpen(false)
      if (v === 'yes') loadConsented(props)
      // Withdrawing consent: tools already loaded stop on the next page load.
      else if (choice === 'yes') window.location.reload()
    },
    [props, choice],
  )

  if (!props.banner || choice === 'unknown' || (choice !== null && !open)) return null

  return (
    <div className="up-consent" role="dialog" aria-live="polite" aria-label="Cookie choices">
      <p>
        {props.text}{' '}
        {props.privacyHref && (
          <a href={props.privacyHref} className="up-link">
            Privacy policy
          </a>
        )}
      </p>
      <div className="up-consent__actions">
        <button type="button" className="up-consent__no" onClick={() => decide('no')}>
          Decline
        </button>
        <button type="button" className="up-btn" onClick={() => decide('yes')}>
          Accept
        </button>
      </div>
    </div>
  )
}

/** "Cookie settings" link, for the footer: opens the banner again. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      style={{ background: 'none', border: 0, padding: 0, color: 'inherit', font: 'inherit', cursor: 'pointer' }}
      onClick={() => window.dispatchEvent(new Event('up-consent-open'))}
    >
      Cookie settings
    </button>
  )
}
