import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import React from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode, headers } from 'next/headers'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'
import { getSiteSettings, mediaURL, safeColor } from '@/utilities/getSiteSettings'
import { fontsKey } from '@/utilities/localFonts'
import { MaintenancePage } from '@/components/MaintenancePage'
import { Widgets } from '@/components/Widgets'
import { WIDGET_CSS } from '@/components/Widgets/styles'
import { SiteStructuredData } from '@/components/Seo'
import { Announcement, Visitors } from '@/components/Visitors'

import './globals.css'

async function isLoggedIn() {
  try {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: await headers() })
    return Boolean(user)
  } catch {
    return false
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const settings = await getSiteSettings()

  const icon = mediaURL(settings.siteIcon)
  const primary = safeColor(settings.primaryColor, '#7B2BFF')
  const accent = safeColor(settings.accentColor, '#F21CD9')
  const headingFont = settings.headingFont || 'Manrope'
  const bodyFont = settings.bodyFont || 'Inter'
  const customCSS = (settings.customCSS || '').replace(/<\/style/gi, '')

  const showMaintenance = settings.maintenanceMode && !(await isLoggedIn())

  return (
    <html
      className={cn(GeistMono.variable)}
      data-template={settings.template || 'bright'}
      lang={settings.language || 'en'}
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        {/* Fonts are served by the site itself, not by Google (src/utilities/localFonts.ts). */}
        <link rel="stylesheet" href={`/fonts/site?v=${fontsKey([headingFont, bodyFont])}`} />
        {icon ? (
          <link href={icon} rel="icon" />
        ) : (
          <>
            <link href="/favicon.ico" rel="icon" sizes="any" />
            <link href="/apple-touch-icon.png" rel="apple-touch-icon" />
          </>
        )}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--up-primary:${primary};--up-accent:${accent};--up-font-heading:'${headingFont}',ui-sans-serif,system-ui,sans-serif;--up-font-body:'${bodyFont}',ui-sans-serif,system-ui,sans-serif;}`,
          }}
        />
        <style id="ultimapress-widgets" dangerouslySetInnerHTML={{ __html: WIDGET_CSS }} />
        {customCSS && <style id="ultimapress-custom-css" dangerouslySetInnerHTML={{ __html: customCSS }} />}
        <SiteStructuredData settings={settings} />
      </head>
      <body>
        <Providers>
          {showMaintenance ? (
            <MaintenancePage settings={settings} />
          ) : (
            <>
              <AdminBar
                adminBarProps={{
                  preview: isEnabled,
                }}
              />
              <Announcement settings={settings} />
              <Header />
              {children}
              <Footer />
              <Widgets />
              <Visitors settings={settings} />
            </>
          )}
        </Providers>
      </body>
    </html>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const siteTitle = settings.siteTitle || 'UltimaPress'

  return {
    metadataBase: new URL(getServerSideURL()),
    title: {
      default: settings.tagline ? `${siteTitle} | ${settings.tagline}` : siteTitle,
      template: `%s | ${siteTitle}`,
    },
    description: settings.tagline || undefined,
    openGraph: mergeOpenGraph({ siteName: siteTitle }),
    robots: settings.discourageSearchEngines ? { index: false, follow: false } : undefined,
    verification: {
      ...(settings.googleVerification ? { google: settings.googleVerification.trim() } : {}),
      ...(settings.bingVerification ? { other: { 'msvalidate.01': settings.bingVerification.trim() } } : {}),
    },
    alternates: settings.enableRSS ? { types: { 'application/rss+xml': '/feed.xml' } } : undefined,
    twitter: {
      card: 'summary_large_image',
    },
  }
}
