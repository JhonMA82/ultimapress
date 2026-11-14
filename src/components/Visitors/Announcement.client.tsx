'use client'

import React, { useEffect, useState } from 'react'

type Props = {
  text: string
  linkLabel?: string | null
  linkURL?: string | null
  start?: string | null
  end?: string | null
  style: 'brand' | 'dark' | 'light'
  dismissible: boolean
}

const keyOf = (text: string) => {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return `up-announcement-${h}`
}

/** The announcement bar: shown between its dates, and closable (remembered per message). */
export function AnnouncementBar(p: Props) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const now = Date.now()
    if (p.start && now < Date.parse(p.start)) return
    if (p.end && now > Date.parse(p.end)) return
    try {
      if (p.dismissible && window.localStorage.getItem(keyOf(p.text)) === 'closed') return
    } catch {
      /* storage unavailable: show it */
    }
    setShow(true)
  }, [p.start, p.end, p.text, p.dismissible])

  if (!show) return null
  const safeLink = p.linkURL && /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(p.linkURL) ? p.linkURL : null
  return (
    <div className={`up-announcement is-${p.style}`} role="region" aria-label="Announcement">
      <p>
        <span>{p.text}</span>
        {safeLink && p.linkLabel && (
          <a href={safeLink} className="up-announcement__link">
            {p.linkLabel}
          </a>
        )}
      </p>
      {p.dismissible && (
        <button
          type="button"
          aria-label="Close announcement"
          onClick={() => {
            try {
              window.localStorage.setItem(keyOf(p.text), 'closed')
            } catch {
              /* ignore */
            }
            setShow(false)
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
