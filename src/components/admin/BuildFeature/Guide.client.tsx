'use client'

import React, { useState } from 'react'

import { BUILD_FEATURE_STARTER, CodingAgentSetup } from '../CodingAgentSetup'

const ideas = [
  { title: 'Events', prompt: 'an events section with dates, a venue and a booking button' },
  { title: 'Team', prompt: 'a team block with photos, roles and LinkedIn links' },
  { title: 'Bookings', prompt: 'a way for visitors to book a call, with an email to me for each booking' },
  { title: 'Shop', prompt: 'a small shop with products, prices and a checkout' },
  { title: 'Courses', prompt: 'courses with lessons that members can work through' },
  { title: 'Listings', prompt: 'a directory of listings with search and filters' },
]

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="up-build__copy"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
        } catch {
          const t = document.createElement('textarea')
          t.value = value
          document.body.appendChild(t)
          t.select()
          document.execCommand('copy')
          t.remove()
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

/** The four steps to a new feature, and ready-made requests to copy. */
export function BuildFeatureGuide() {
  return (
    <div className="up-build__grid">
      <section className="up-build__card">
        <h2>How it works</h2>
        <ol className="up-build__steps">
          <li>
            <strong>Download your site&apos;s code</strong>
            <span>One click in Site code gives you a zip of your site. Unzip it on your computer.</span>
            <a className="up-build__link" href="/admin/site-code">
              Open Site code
            </a>
          </li>
          <li>
            <strong>Open the folder in your agent</strong>
            <span>
              <CodingAgentSetup />
            </span>
          </li>
          <li>
            <strong>Describe the feature</strong>
            <span>Start your request like this, then say what you want:</span>
            <div className="up-build__prompt">
              <code>{BUILD_FEATURE_STARTER}</code>
              <CopyButton value={BUILD_FEATURE_STARTER} label="starter prompt" />
            </div>
          </li>
          <li>
            <strong>Put it live</strong>
            <span>
              Tell your agent &ldquo;put it live&rdquo;. It runs <code>pnpm ship</code>, which sends
              the folder; nothing is live until you confirm with your password in Site code. Your
              content is backed up first, and it stays as it is.
            </span>
          </li>
        </ol>
      </section>

      <section className="up-build__card">
        <h2>Ideas to start with</h2>
        <p className="up-build__sub">Copy one, paste it into your agent and change the details.</p>
        <ul className="up-build__ideas">
          {ideas.map((i) => (
            <li key={i.title}>
              <div>
                <strong>{i.title}</strong>
                <span>Add {i.prompt}.</span>
              </div>
              <CopyButton value={`${BUILD_FEATURE_STARTER}${i.prompt}.`} label={`${i.title} request`} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
