/**
 * The visitor side of the builder's widgets. It is part of UltimaPress itself (page
 * content can never add scripts), loads only on pages that use a widget, and every
 * widget still shows something sensible without it.
 */

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const once = (el: Element, key: string) => {
  const flag = `upInit${key}`
  const d = (el as HTMLElement).dataset
  if (d[flag]) return false
  d[flag] = '1'
  return true
}
const store = {
  get: (k: string) => {
    try {
      return sessionStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string) => {
    try {
      sessionStorage.setItem(k, v)
    } catch {
      // storage blocked: the popup simply shows again
    }
  },
}

function carousels(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('.up-w-carousel').forEach((c) => {
    if (!once(c, 'Car')) return
    const track = c.querySelector<HTMLElement>('.up-w-track')
    if (!track) return
    const step = () => (track.firstElementChild as HTMLElement | null)?.offsetWidth || track.clientWidth * 0.8
    const go = (dir: number) => {
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4
      if (dir > 0 && atEnd) track.scrollTo({ left: 0 })
      else track.scrollBy({ left: dir * (step() + 16) })
    }
    const arrows = document.createElement('div')
    arrows.className = 'up-w-arrows'
    arrows.innerHTML = '<button type="button" aria-label="Previous">‹</button><button type="button" aria-label="Next">›</button>'
    const [prev, next] = Array.from(arrows.querySelectorAll('button'))
    prev.addEventListener('click', () => go(-1))
    next.addEventListener('click', () => go(1))
    c.appendChild(arrows)
    const seconds = Number(c.dataset.upAutoplay || 0)
    if (seconds > 0 && !reduced()) {
      let paused = false
      c.addEventListener('mouseenter', () => (paused = true))
      c.addEventListener('mouseleave', () => (paused = false))
      setInterval(() => !paused && !document.hidden && go(1), seconds * 1000)
    }
  })
  root.querySelectorAll<HTMLElement>('.up-w-marquee').forEach((m) => {
    if (!once(m, 'Mq')) return
    const track = m.querySelector<HTMLElement>('.up-w-track')
    if (!track) return
    Array.from(track.children).forEach((child) => {
      const copy = child.cloneNode(true) as HTMLElement
      copy.setAttribute('aria-hidden', 'true')
      track.appendChild(copy)
    })
    m.classList.add('is-running')
  })
}

function tabs(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-up-widget="tabs"]').forEach((t, n) => {
    if (!once(t, 'Tabs')) return
    const panels = Array.from(t.querySelectorAll<HTMLElement>(':scope > .up-w-tabpanel'))
    if (!panels.length) return
    const list = document.createElement('div')
    list.className = 'up-w-tablist'
    list.setAttribute('role', 'tablist')
    const select = (i: number) =>
      panels.forEach((p, j) => {
        p.classList.toggle('is-active', i === j)
        list.children[j].setAttribute('aria-selected', String(i === j))
      })
    panels.forEach((p, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.setAttribute('role', 'tab')
      b.id = `up-tab-${n}-${i}`
      b.textContent = p.dataset.title || `Tab ${i + 1}`
      p.setAttribute('role', 'tabpanel')
      p.setAttribute('aria-labelledby', b.id)
      b.addEventListener('click', () => select(i))
      b.addEventListener('keydown', (e) => {
        const k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
        if (!k) return
        const next = (i + k + panels.length) % panels.length
        select(next)
        ;(list.children[next] as HTMLElement).focus()
      })
      list.appendChild(b)
    })
    t.prepend(list)
    t.classList.add('is-ready')
    select(0)
  })
}

function popups(root: ParentNode) {
  const all = Array.from(root.querySelectorAll<HTMLElement>('[data-up-widget="popup"]'))
  all.forEach((p) => {
    if (!once(p, 'Pop')) return
    const id = p.dataset.upId || ''
    const box = p.querySelector<HTMLElement>('.up-w-popup__box') || p
    box.setAttribute('role', 'dialog')
    box.setAttribute('aria-modal', 'true')
    const close = document.createElement('button')
    close.type = 'button'
    close.className = 'up-w-popup__close'
    close.setAttribute('aria-label', 'Close')
    close.textContent = '×'
    box.prepend(close)
    let last: Element | null = null
    const open = () => {
      last = document.activeElement
      p.classList.add('is-open')
      close.focus()
    }
    const shut = () => {
      p.classList.remove('is-open')
      if (id) store.set(`up-popup-${id}`, '1')
      ;(last as HTMLElement | null)?.focus?.()
    }
    close.addEventListener('click', shut)
    p.addEventListener('click', (e) => e.target === p && shut())
    document.addEventListener('keydown', (e) => e.key === 'Escape' && p.classList.contains('is-open') && shut())
    if (id) {
      document.addEventListener('click', (e) => {
        const a = (e.target as Element)?.closest?.(`a[href="#popup-${CSS.escape(id)}"]`)
        if (a) {
          e.preventDefault()
          open()
        }
      })
    }
    const seen = id && store.get(`up-popup-${id}`)
    const trigger = p.dataset.upTrigger || 'button'
    if (!seen && trigger === 'timer') setTimeout(open, Math.max(1, Number(p.dataset.upDelay || 5)) * 1000)
    if (!seen && trigger === 'exit') {
      const onLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          document.removeEventListener('mouseout', onLeave)
          open()
        }
      }
      document.addEventListener('mouseout', onLeave)
    }
  })
}

function countdowns(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-up-widget="countdown"]').forEach((c) => {
    if (!once(c, 'Cd')) return
    const target = new Date(String(c.dataset.upUntil || '').replace(' ', 'T')).getTime()
    if (!target) return
    const cells = c.querySelectorAll('b')
    const tick = () => {
      const left = Math.max(0, target - Date.now())
      const parts = [86400000, 3600000, 60000, 1000].map((unit, i, all) =>
        Math.floor((i ? left % all[i - 1] : left) / unit),
      )
      parts.forEach((v, i) => cells[i] && (cells[i].textContent = String(v).padStart(2, '0')))
      if (left > 0) setTimeout(tick, 1000)
      else c.classList.add('is-done')
    }
    tick()
  })
}

function counters(root: ParentNode) {
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-up-count]'))
  if (!els.length) return
  const run = (el: HTMLElement) => {
    const end = Number(String(el.dataset.upCount).replace(/[^\d.-]/g, '')) || 0
    const suffix = el.dataset.upSuffix || ''
    const decimals = String(el.dataset.upCount).split('.')[1]?.length || 0
    if (reduced()) return
    const start = performance.now()
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / 1600)
      const v = end * (1 - Math.pow(1 - t, 3))
      el.textContent = v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix
      if (t < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        io.unobserve(e.target)
        run(e.target as HTMLElement)
      }
    })
  }, { threshold: 0.4 })
  els.forEach((el) => once(el, 'Cnt') && io.observe(el))
}

function beforeAfter(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-up-widget="beforeafter"]').forEach((w) => {
    if (!once(w, 'Ba')) return
    const input = document.createElement('input')
    input.type = 'range'
    input.min = '0'
    input.max = '100'
    input.value = '50'
    input.setAttribute('aria-label', 'Compare before and after')
    input.addEventListener('input', () => w.style.setProperty('--up-pos', `${input.value}%`))
    w.appendChild(input)
  })
}

function lightboxes(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('.up-w-lightbox').forEach((g) => {
    if (!once(g, 'Lb')) return
    g.addEventListener('click', (e) => {
      const img = (e.target as Element)?.closest?.('img') as HTMLImageElement | null
      if (!img) return
      const lb = document.createElement('div')
      lb.className = 'up-w-lb'
      lb.setAttribute('role', 'dialog')
      lb.setAttribute('aria-label', img.alt || 'Photo')
      const big = document.createElement('img')
      big.src = img.currentSrc || img.src
      big.alt = img.alt
      const close = document.createElement('button')
      close.type = 'button'
      close.setAttribute('aria-label', 'Close')
      close.textContent = '×'
      lb.append(big, close)
      const shut = () => {
        lb.remove()
        document.removeEventListener('keydown', onKey)
        img.focus?.()
      }
      const onKey = (k: KeyboardEvent) => k.key === 'Escape' && shut()
      lb.addEventListener('click', (k) => k.target !== big && shut())
      document.addEventListener('keydown', onKey)
      document.body.appendChild(lb)
      close.focus()
    })
  })
}

function toc(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-up-widget="toc"]').forEach((t) => {
    if (!once(t, 'Toc')) return
    const list = t.querySelector('ol') || t.appendChild(document.createElement('ol'))
    const heads = Array.from(document.querySelectorAll<HTMLElement>('h2')).filter(
      (h) => !t.contains(h) && !h.closest('header, footer, nav, .up-w-popup, [data-up-widget="tabs"]'),
    )
    heads.forEach((h, i) => {
      if (!h.id) h.id = (h.textContent || `section-${i}`).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `section-${i}`
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.href = `#${h.id}`
      a.textContent = h.textContent || ''
      li.appendChild(a)
      list.appendChild(li)
    })
  })
}

function share(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-up-widget="share"]').forEach((s) => {
    if (!once(s, 'Sh')) return
    const url = encodeURIComponent(location.href.split('#')[0])
    const title = encodeURIComponent(document.title)
    const links: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      x: `https://x.com/intent/post?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${title}%20${url}`,
      email: `mailto:?subject=${title}&body=${url}`,
    }
    s.querySelectorAll<HTMLAnchorElement>('a[data-up-net]').forEach((a) => {
      const href = links[a.dataset.upNet || '']
      if (!href) return
      a.href = href
      if (!href.startsWith('mailto:')) {
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
      }
    })
  })
}

function search(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-up-widget="search"]').forEach((s) => {
    if (!once(s, 'Se')) return
    s.innerHTML = ''
    const form = document.createElement('form')
    form.action = '/search'
    form.method = 'get'
    form.setAttribute('role', 'search')
    const input = document.createElement('input')
    input.type = 'search'
    input.name = 'q'
    input.placeholder = s.dataset.upPlaceholder || 'Search'
    input.setAttribute('aria-label', input.placeholder)
    const button = document.createElement('button')
    button.type = 'submit'
    button.textContent = s.dataset.upButton || 'Search'
    form.append(input, button)
    s.appendChild(form)
  })
}

function breadcrumbs(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-up-widget="breadcrumbs"]').forEach((b) => {
    if (!once(b, 'Bc')) return
    const parts = location.pathname.split('/').filter(Boolean)
    const ol = document.createElement('ol')
    const add = (label: string, href?: string) => {
      const li = document.createElement('li')
      if (href) {
        const a = document.createElement('a')
        a.href = href
        a.textContent = label
        li.appendChild(a)
      } else {
        li.textContent = label
        li.setAttribute('aria-current', 'page')
      }
      ol.appendChild(li)
    }
    add(b.dataset.upHome || 'Home', parts.length ? '/' : undefined)
    const human = (s: string) => decodeURIComponent(s).replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
    parts.forEach((p, i) => {
      const last = i === parts.length - 1
      const label = last ? document.querySelector('main h1, article h1, h1')?.textContent?.trim() || human(p) : p === 'posts' ? 'Blog' : human(p)
      add(label, last ? undefined : `/${parts.slice(0, i + 1).join('/')}`)
    })
    b.innerHTML = ''
    b.setAttribute('aria-label', 'Breadcrumb')
    b.appendChild(ol)
  })
}

function backToTop(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-up-widget="totop"]').forEach((t) => {
    if (!once(t, 'Top')) return
    const update = () => t.classList.toggle('is-hidden', window.scrollY < 600)
    t.addEventListener('click', (e) => {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' })
    })
    window.addEventListener('scroll', update, { passive: true })
    update()
  })
}

function menus(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-up-widget="menu"]').forEach((m) => {
    if (!once(m, 'Menu')) return
    const host = m.closest('header, nav, section, div') as HTMLElement | null
    if (!host) return
    host.classList.add('up-has-menu')
    m.setAttribute('aria-expanded', 'false')
    m.addEventListener('click', () => {
      const open = host.classList.toggle('is-open')
      m.setAttribute('aria-expanded', String(open))
    })
  })
}

export function initWidgets(root: ParentNode = document) {
  for (const fn of [carousels, tabs, popups, countdowns, counters, beforeAfter, lightboxes, toc, share, search, breadcrumbs, backToTop, menus]) {
    try {
      fn(root)
    } catch {
      // one widget failing never stops the others
    }
  }
}
