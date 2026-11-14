'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const WIDGETS = '[data-up-widget], [data-up-count], .up-w-carousel, .up-w-marquee, .up-w-lightbox'

/** Loads the widget script only when the page has a widget on it. */
export function Widgets() {
  const path = usePathname()
  useEffect(() => {
    const t = setTimeout(() => {
      if (!document.querySelector(WIDGETS)) return
      import('./runtime').then((m) => m.initWidgets()).catch(() => undefined)
    }, 0)
    return () => clearTimeout(t)
  }, [path])
  return null
}
