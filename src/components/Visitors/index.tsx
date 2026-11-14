import React from 'react'

import type { Page, SiteSetting } from '@/payload-types'

import { AnnouncementBar } from './Announcement.client'
import { Consent } from './Consent.client'
import { Tracker } from './Tracker.client'

/** Does anything switched on need cookie consent? */
export const needsCookieBanner = (s: SiteSetting) => {
  if (s.cookieBanner === 'never') return false
  if (s.cookieBanner === 'always') return true
  return Boolean(
    s.ga4Id?.trim() ||
      s.gtmId?.trim() ||
      s.metaPixelId?.trim() ||
      (s.codeSnippets || []).some((c) => c.enabled !== false && c.needsConsent),
  )
}

/** Built-in analytics, cookie banner, other analytics tools and code snippets. */
export function Visitors({ settings }: { settings: SiteSetting }) {
  const privacy = settings.privacyPolicyPage
  const privacyHref =
    privacy && typeof privacy === 'object' && (privacy as Page).slug ? `/${(privacy as Page).slug}` : null
  const snippets = (settings.codeSnippets || [])
    .filter((c) => c.enabled !== false && c.code?.trim())
    .map((c, i) => ({
      id: String(c.id || i),
      code: c.code,
      location: (c.location || 'head') as 'head' | 'bodyStart' | 'bodyEnd',
      needsConsent: Boolean(c.needsConsent),
    }))
  return (
    <>
      {settings.enableAnalytics !== false && <Tracker />}
      <Consent
        banner={needsCookieBanner(settings)}
        text={settings.cookieBannerText || 'We use cookies to improve this site.'}
        privacyHref={privacyHref}
        ga4Id={settings.ga4Id}
        gtmId={settings.gtmId}
        metaPixelId={settings.metaPixelId}
        plausibleDomain={settings.plausibleDomain}
        snippets={snippets}
      />
    </>
  )
}

export function Announcement({ settings: s }: { settings: SiteSetting }) {
  if (!s.announcementEnabled || !s.announcementText?.trim()) return null
  return (
    <AnnouncementBar
      text={s.announcementText.trim()}
      linkLabel={s.announcementLinkLabel}
      linkURL={s.announcementLinkURL}
      start={s.announcementStart}
      end={s.announcementEnd}
      style={(s.announcementStyle || 'brand') as 'brand' | 'dark' | 'light'}
      dismissible={s.announcementDismissible !== false}
    />
  )
}
