/**
 * The second section library: every section in a Bright and a Dark version, built with
 * inline styles (shown in Templates next to the theme-coloured ones in library.ts, with a
 * Bright / Dark switch). Also a few extra widgets.
 *
 * What the visual builder offers beyond the basic blocks: extra widgets (the essentials
 * a free page builder gives you) and a template library of ready-made page sections,
 * each in a Bright and a Dark version.
 *
 * Everything here is plain HTML with inline styles, so it saves as a designed section
 * and passes the design sanitiser. Colours that should follow the owner's brand use
 * var(--up-primary) with a fallback, so they look right in the builder and on the site.
 */

export type LibraryBlock = {
  id: string
  label: string
  category: string
  media: string
  content: string | Record<string, unknown>
  activate?: boolean
}

export type Mode = 'bright' | 'dark'

/** Escapes text placed inside the HTML of a template. */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const icon = (d: string, size = 28) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`

const PRIMARY = 'var(--up-primary, #2563eb)'

/* ------------------------------------------------------------------ widgets */

const star = `<svg viewBox="0 0 24 24" width="20" height="20" fill="#f5b301"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>`
const check = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${PRIMARY}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex:none;margin-top:3px;"><path d="M5 12l5 5L20 7"/></svg>`

const placeholder = (dark = false, ratio = '16 / 10') => {
  const a = dark ? '#1e293b' : '#e2e8f0'
  const b = dark ? '#334155' : '#cbd5e1'
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='800' height='500' fill='url(#g)'/><path d='M300 320l80-90 60 60 50-40 110 70z' fill='${dark ? '#475569' : '#94a3b8'}'/><circle cx='330' cy='190' r='28' fill='${dark ? '#475569' : '#94a3b8'}'/></svg>`
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  return `<img src="${src}" alt="Replace this image" style="width:100%;height:auto;aspect-ratio:${ratio};object-fit:cover;display:block;border-radius:16px;">`
}

const WIDGETS: LibraryBlock[] = [
  {
    id: 'container',
    label: 'Box',
    category: 'Layout',
    media: icon('M4 4h16v16H4z'),
    content: `<div style="padding:32px;border:1px solid rgba(0,0,0,0.12);border-radius:16px;"><p style="margin:0;line-height:1.6;">Put anything inside this box.</p></div>`,
  },
  {
    id: 'columns-4',
    label: 'Four columns',
    category: 'Layout',
    media: icon('M2 5h4v14H2z M7.3 5h4v14h-4z M12.7 5h4v14h-4z M18 5h4v14h-4z'),
    content: `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;padding:32px 24px;max-width:1100px;margin:0 auto;">${['One', 'Two', 'Three', 'Four']
      .map((t) => `<div><h3 style="font-size:20px;margin:0 0 8px;">${t}</h3><p style="line-height:1.6;margin:0;">Some text.</p></div>`)
      .join('')}</div>`,
  },
  {
    id: 'link',
    label: 'Link',
    category: 'Content',
    media: icon('M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1 M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1'),
    content: `<a href="#" style="color:${PRIMARY};font-weight:600;text-decoration:underline;">Link text</a>`,
  },
  {
    id: 'image-link',
    label: 'Image with link',
    category: 'Content',
    media: icon('M4 5h16v14H4z M4 15l5-5 4 4 M15 9h.01'),
    content: `<a href="#" style="display:block;">${placeholder()}</a>`,
  },
  {
    id: 'video',
    label: 'Video',
    category: 'Media',
    media: icon('M4 6h12v12H4z M16 10l5-3v10l-5-3'),
    content: { type: 'video', provider: 'yt', videoId: 'dQw4w9WgXcQ', style: { width: '100%', height: '480px', 'max-width': '1100px', margin: '0 auto', display: 'block', 'border-radius': '16px' } },
  },
  {
    id: 'map',
    label: 'Map',
    category: 'Media',
    media: icon('M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z M12 12a2 2 0 100-4 2 2 0 000 4z'),
    content: { type: 'map', address: 'Carrick-on-Shannon, Ireland', style: { width: '100%', height: '380px', border: '0', 'border-radius': '16px' } },
  },
  {
    id: 'gallery',
    label: 'Gallery',
    category: 'Media',
    media: icon('M3 3h8v8H3z M13 3h8v8h-8z M3 13h8v8H3z M13 13h8v8h-8z'),
    content: `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;padding:24px;max-width:1100px;margin:0 auto;">${[1, 2, 3, 4, 5, 6]
      .map(() => placeholder(false, '1 / 1'))
      .join('')}</div>`,
  },
  {
    id: 'icon',
    label: 'Icon',
    category: 'Content',
    media: icon('M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z'),
    content: `<div style="display:inline-grid;place-items:center;width:56px;height:56px;border-radius:14px;background:${PRIMARY};color:#fff;">${icon('M13 2L3 14h9l-1 8 10-12h-9z', 26)}</div>`,
  },
  {
    id: 'icon-box',
    label: 'Icon box',
    category: 'Content',
    media: icon('M4 4h16v16H4z M9 9h6v6H9z'),
    content: `<div style="padding:28px;border:1px solid rgba(0,0,0,0.12);border-radius:16px;"><div style="display:inline-grid;place-items:center;width:48px;height:48px;border-radius:12px;background:${PRIMARY};color:#fff;margin-bottom:16px;">${icon('M13 2L3 14h9l-1 8 10-12h-9z', 22)}</div><h3 style="font-size:20px;margin:0 0 8px;">Fast and simple</h3><p style="margin:0;line-height:1.6;opacity:0.8;">Describe the benefit in one or two sentences.</p></div>`,
  },
  {
    id: 'image-box',
    label: 'Image box',
    category: 'Content',
    media: icon('M4 3h16v10H4z M4 16h16 M4 20h10'),
    content: `<div style="max-width:420px;border:1px solid rgba(0,0,0,0.12);border-radius:16px;overflow:hidden;">${placeholder().replace('border-radius:16px;', '')}<div style="padding:24px;"><h3 style="font-size:20px;margin:0 0 8px;">Card title</h3><p style="margin:0 0 16px;line-height:1.6;opacity:0.8;">A short description of this card.</p><a href="#" style="color:${PRIMARY};font-weight:600;text-decoration:none;">Learn more →</a></div></div>`,
  },
  {
    id: 'icon-list',
    label: 'Icon list',
    category: 'Content',
    media: icon('M4 7l2 2 3-3 M4 15l2 2 3-3 M12 8h8 M12 16h8'),
    content: `<ul style="list-style:none;padding:0;margin:0 0 16px;display:grid;gap:12px;font-size:17px;line-height:1.5;">${['First benefit', 'Second benefit', 'Third benefit']
      .map((t) => `<li style="display:flex;gap:10px;">${check}<span>${t}</span></li>`)
      .join('')}</ul>`,
  },
  {
    id: 'testimonial',
    label: 'Testimonial',
    category: 'Content',
    media: icon('M4 5h16v11H8l-4 4z'),
    content: `<figure style="margin:0;padding:28px;border:1px solid rgba(0,0,0,0.12);border-radius:16px;"><div style="display:flex;gap:2px;margin-bottom:12px;">${star.repeat(5)}</div><blockquote style="margin:0 0 16px;font-size:18px;line-height:1.6;">Sample: paste a real review from a customer here.</blockquote><figcaption style="font-weight:600;">Customer name <span style="font-weight:400;opacity:0.7;">(their business)</span></figcaption></figure>`,
  },
  {
    id: 'rating',
    label: 'Star rating',
    category: 'Content',
    media: icon('M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z'),
    content: `<div style="display:flex;align-items:center;gap:8px;"><span style="display:flex;gap:2px;">${star.repeat(5)}</span><span style="font-weight:600;">4.9 from 120 reviews</span></div>`,
  },
  {
    id: 'accordion',
    label: 'Accordion',
    category: 'Content',
    media: icon('M4 6h16 M4 12h16 M4 18h16 M17 4l2 2-2 2'),
    content: `<div style="display:grid;gap:10px;max-width:800px;margin:0 auto;">${[
      ['How long does it take?', 'Most projects are ready within two weeks.'],
      ['What does it cost?', 'Every project gets a fixed price before work starts.'],
      ['Can I change it later?', 'Yes. You can edit everything yourself.'],
    ]
      .map(
        ([q, a]) =>
          `<details style="border:1px solid rgba(0,0,0,0.12);border-radius:12px;padding:16px 20px;"><summary style="cursor:pointer;font-weight:600;font-size:17px;">${q}</summary><p style="margin:12px 0 0;line-height:1.6;opacity:0.85;">${a}</p></details>`,
      )
      .join('')}</div>`,
  },
  {
    id: 'toggle',
    label: 'Toggle',
    category: 'Content',
    media: icon('M4 8h16 M8 4l-4 4 4 4 M4 16h12'),
    content: `<details style="border:1px solid rgba(0,0,0,0.12);border-radius:12px;padding:16px 20px;"><summary style="cursor:pointer;font-weight:600;">Click to show more</summary><p style="margin:12px 0 0;line-height:1.6;">The hidden content goes here.</p></details>`,
  },
  {
    id: 'counter',
    label: 'Number',
    category: 'Content',
    media: icon('M4 17h16 M7 13V7l-2 1 M11 7h4l-4 6h4 M17 7h3l-2 3a2 2 0 11-1 3'),
    content: `<div style="text-align:center;"><div style="font-size:52px;font-weight:800;line-height:1;color:${PRIMARY};">250+</div><div style="margin-top:8px;opacity:0.75;">Happy clients</div></div>`,
  },
  {
    id: 'progress',
    label: 'Progress bar',
    category: 'Content',
    media: icon('M3 10h18v4H3z M3 10h11v4'),
    content: `<div><div style="display:flex;justify-content:space-between;font-weight:600;margin-bottom:8px;"><span>Web design</span><span>90%</span></div><div style="height:10px;border-radius:999px;background:rgba(0,0,0,0.1);overflow:hidden;"><div style="width:90%;height:100%;background:${PRIMARY};"></div></div></div>`,
  },
  {
    id: 'alert',
    label: 'Alert',
    category: 'Content',
    media: icon('M12 3l10 18H2z M12 10v4 M12 17h.01'),
    content: `<div style="padding:16px 20px;border-radius:12px;background:#fff7e6;border:1px solid #f5c26b;color:#7a4b00;line-height:1.5;"><strong>Heads up:</strong> write your message here.</div>`,
  },
  {
    id: 'social',
    label: 'Social icons',
    category: 'Content',
    media: icon('M18 8a3 3 0 100-6 3 3 0 000 6z M6 15a3 3 0 100-6 3 3 0 000 6z M18 22a3 3 0 100-6 3 3 0 000 6z M8.6 13.5l6.8 4 M15.4 6.5l-6.8 4'),
    content: `<div style="display:flex;gap:10px;">${[
      ['Facebook', 'M15 3h-3a4 4 0 00-4 4v3H6v4h2v7h4v-7h3l1-4h-4V7a1 1 0 011-1h3z'],
      ['Instagram', 'M4 4h16v16H4z M12 16a4 4 0 100-8 4 4 0 000 8z M17.5 6.5h.01'],
      ['LinkedIn', 'M4 9h4v11H4z M6 6a2 2 0 100-4 2 2 0 000 4z M10 9h4v2a4 4 0 017 3v6h-4v-6a2 2 0 00-4 0v6h-3z'],
      ['YouTube', 'M2 8a3 3 0 013-3h14a3 3 0 013 3v8a3 3 0 01-3 3H5a3 3 0 01-3-3z M10 9l5 3-5 3z'],
    ]
      .map(
        ([n, d]) =>
          `<a href="#" title="${n}" aria-label="${n}" style="display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:${PRIMARY};color:#fff;">${icon(d, 20)}</a>`,
      )
      .join('')}</div>`,
  },
]

/** The widgets the main library doesn't already have. */
export const EXTRA_WIDGETS: LibraryBlock[] = WIDGETS.filter((w) =>
  ['container', 'columns-4', 'link', 'image-link', 'testimonial'].includes(w.id),
)

/* --------------------------------------------------------------- templates */

type Palette = { bg: string; alt: string; ink: string; muted: string; line: string; card: string; dark: boolean }

const PALETTES: Record<Mode, Palette> = {
  bright: { bg: '#ffffff', alt: '#f6f7fb', ink: '#0f172a', muted: '#475569', line: '#e2e8f0', card: '#ffffff', dark: false },
  dark: { bg: '#0b0f19', alt: '#111827', ink: '#f8fafc', muted: '#94a3b8', line: '#1f2937', card: '#111827', dark: true },
}

const wrap = (p: Palette, inner: string, opts: { alt?: boolean; pad?: string } = {}) =>
  `<section style="background:${opts.alt ? p.alt : p.bg};color:${p.ink};padding:${opts.pad || '96px 24px'};font-family:inherit;"><div style="max-width:1140px;margin:0 auto;">${inner}</div></section>`

const btn = (label: string, solid = true, p?: Palette) =>
  solid
    ? `<a href="#" style="display:inline-block;padding:14px 26px;border-radius:999px;background:${PRIMARY};color:#ffffff;text-decoration:none;font-weight:600;">${label}</a>`
    : `<a href="#" style="display:inline-block;padding:13px 25px;border-radius:999px;border:1px solid ${p?.line || '#cbd5e1'};color:inherit;text-decoration:none;font-weight:600;">${label}</a>`

const eyebrow = (t: string) =>
  `<p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${PRIMARY};">${t}</p>`

const h2 = (t: string) => `<h2 style="font-size:clamp(30px,4vw,44px);line-height:1.1;margin:0 0 16px;font-weight:800;">${t}</h2>`

const lead = (p: Palette, t: string, center = false) =>
  `<p style="font-size:18px;line-height:1.65;color:${p.muted};margin:0 ${center ? 'auto' : '0'} 0;max-width:640px;">${t}</p>`

const head = (p: Palette, kicker: string, title: string, text: string) =>
  `<div style="text-align:center;margin:0 auto 56px;max-width:720px;">${eyebrow(kicker)}${h2(title)}${lead(p, text, true)}</div>`

const card = (p: Palette, inner: string, extra = '') =>
  `<div style="background:${p.card};border:1px solid ${p.line};border-radius:20px;padding:32px;${extra}">${inner}</div>`

const grid = (min: number, inner: string, gap = 24) =>
  `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(${min}px,1fr));gap:${gap}px;">${inner}</div>`

const iconChip = (d: string) =>
  `<div style="display:inline-grid;place-items:center;width:48px;height:48px;border-radius:12px;background:${PRIMARY};color:#fff;margin-bottom:18px;">${icon(d, 22)}</div>`

const ICON = {
  bolt: 'M13 2L3 14h9l-1 8 10-12h-9z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  chart: 'M4 20V10 M10 20V4 M16 20v-7 M22 20H2',
  heart: 'M12 21s-8-5-8-11a5 5 0 019-3 5 5 0 019 3c0 6-8 11-8 11z',
  globe: 'M12 22a10 10 0 100-20 10 10 0 000 20z M2 12h20 M12 2a15 15 0 010 20 M12 2a15 15 0 000 20',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2',
  mail: 'M3 5h18v14H3z M3 7l9 6 9-6',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z M12 12a2 2 0 100-4 2 2 0 000 4z',
}

const logo = (p: Palette) =>
  `<a href="/" style="display:flex;align-items:center;gap:10px;color:${p.ink};text-decoration:none;font-weight:800;font-size:20px;"><span style="display:inline-block;width:30px;height:30px;border-radius:9px;background:${PRIMARY};"></span>YourBrand</a>`

const navLinks = (p: Palette) =>
  ['Home', 'About', 'Services', 'Pricing', 'Contact']
    .map((t) => `<a href="#" style="color:${p.muted};text-decoration:none;font-weight:500;">${t}</a>`)
    .join('')

type Section = { key: string; label: string; media: string; html: (p: Palette) => string }

const SECTIONS: Section[] = [
  // Header
  {
    key: 'header-classic',
    label: 'Header: logo left, menu right',
    media: icon('M3 6h18 M3 6v4h18V6 M5 8h3 M13 8h6'),
    html: (p) =>
      `<header style="background:${p.bg};color:${p.ink};border-bottom:1px solid ${p.line};padding:18px 24px;"><div style="max-width:1140px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;">${logo(p)}<nav style="display:flex;gap:28px;flex-wrap:wrap;align-items:center;">${navLinks(p)}${btn('Get a quote')}</nav></div></header>`,
  },
  {
    key: 'header-centered',
    label: 'Header: centred logo',
    media: icon('M3 6h18v4H3z M10 8h4'),
    html: (p) =>
      `<header style="background:${p.bg};color:${p.ink};border-bottom:1px solid ${p.line};padding:22px 24px;text-align:center;"><div style="display:flex;justify-content:center;margin-bottom:14px;">${logo(p)}</div><nav style="display:flex;gap:28px;justify-content:center;flex-wrap:wrap;">${navLinks(p)}</nav></header>`,
  },
  // Hero
  {
    key: 'hero-split',
    label: 'Hero: text and image',
    media: icon('M3 5h18v14H3z M5 9h6 M5 12h5 M5 15h3 M13 8h6v8h-6z'),
    html: (p) =>
      wrap(
        p,
        `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:56px;align-items:center;"><div>${eyebrow('Welcome')}<h1 style="font-size:clamp(38px,5.5vw,62px);line-height:1.05;margin:0 0 20px;font-weight:800;">A clear promise about what you do</h1>${lead(p, 'One or two sentences that tell visitors who you help and the result they get.')}<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:32px;">${btn('Get started')}${btn('Learn more', false, p)}</div></div>${placeholder(p.dark, '4 / 3')}</div>`,
        { pad: '110px 24px' },
      ),
  },
  {
    key: 'hero-centered',
    label: 'Hero: centred',
    media: icon('M3 5h18v14H3z M7 9h10 M8 12h8 M10 15h4'),
    html: (p) =>
      wrap(
        p,
        `<div style="text-align:center;max-width:820px;margin:0 auto;">${eyebrow('New')}<h1 style="font-size:clamp(40px,6vw,68px);line-height:1.04;margin:0 0 22px;font-weight:800;">Everything your business needs, in one place</h1>${lead(p, 'Explain the main benefit in a sentence. Keep it short and specific.', true)}<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:34px;">${btn('Book a call')}${btn('See our work', false, p)}</div></div><div style="margin-top:64px;">${placeholder(p.dark, '21 / 9')}</div>`,
        { pad: '120px 24px' },
      ),
  },
  {
    key: 'hero-cover',
    label: 'Hero: full cover',
    media: icon('M3 5h18v14H3z M3 15l6-5 5 4 3-2 4 3'),
    html: (p) =>
      `<section style="position:relative;padding:160px 24px;color:#ffffff;background:linear-gradient(120deg,rgba(15,23,42,0.88),rgba(15,23,42,0.55)),${p.dark ? '#0b0f19' : '#1e293b'};text-align:center;"><div style="max-width:820px;margin:0 auto;"><h1 style="font-size:clamp(40px,6vw,70px);line-height:1.04;margin:0 0 22px;font-weight:800;">Make a bold first impression</h1><p style="font-size:19px;line-height:1.6;opacity:0.85;margin:0 auto 34px;max-width:620px;">Set a background image in the Style panel, then write your headline.</p>${btn('Get started')}</div></section>`,
  },
  // About
  {
    key: 'about-split',
    label: 'About: image and story',
    media: icon('M3 5h8v14H3z M13 8h8 M13 12h8 M13 16h5'),
    html: (p) =>
      wrap(
        p,
        `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:56px;align-items:center;">${placeholder(p.dark, '1 / 1')}<div>${eyebrow('About us')}${h2('We have been doing this for 20 years')}${lead(p, 'Tell your story in a few sentences: why you started, who you serve and what makes you different.')}<ul style="list-style:none;padding:0;margin:28px 0 0;display:grid;gap:12px;">${['Local and family owned', 'Fixed prices, no surprises', 'Fully insured and certified']
          .map((t) => `<li style="display:flex;gap:10px;">${check}<span>${t}</span></li>`)
          .join('')}</ul></div></div>`,
      ),
  },
  {
    key: 'about-values',
    label: 'About: mission and values',
    media: icon('M4 5h16 M4 9h10 M4 14h5v5H4z M10 14h5v5h-5z M16 14h4v5h-4z'),
    html: (p) =>
      wrap(
        p,
        `${head(p, 'Our mission', 'What we stand for', 'A short paragraph about your mission and the people behind the business.')}${grid(
          240,
          [
            [ICON.heart, 'Care', 'We treat every customer like our only customer.'],
            [ICON.shield, 'Trust', 'Honest advice and transparent pricing.'],
            [ICON.bolt, 'Speed', 'Fast replies and quick turnaround.'],
          ]
            .map(([d, t, s]) => card(p, `${iconChip(d)}<h3 style="font-size:20px;margin:0 0 8px;">${t}</h3><p style="margin:0;line-height:1.6;color:${p.muted};">${s}</p>`))
            .join(''),
        )}`,
        { alt: true },
      ),
  },
  // Services
  {
    key: 'services-cards',
    label: 'Services: icon cards',
    media: icon('M3 4h5v6H3z M10 4h5v6h-5z M17 4h4v6h-4z M3 14h5v6H3z M10 14h5v6h-5z M17 14h4v6h-4z'),
    html: (p) =>
      wrap(
        p,
        `${head(p, 'Services', 'How we can help', 'Pick the service you need, or ask us for something custom.')}${grid(
          280,
          [
            [ICON.globe, 'Websites', 'Fast, modern websites that bring in customers.'],
            [ICON.chart, 'Marketing', 'Get found on Google and turn visitors into leads.'],
            [ICON.bolt, 'Automation', 'Save hours every week with smart systems.'],
            [ICON.shield, 'Care plans', 'Updates, backups and security, handled.'],
            [ICON.phone, 'Support', 'Real people who answer the phone.'],
            [ICON.heart, 'Consulting', 'Advice from 20 years of experience.'],
          ]
            .map(
              ([d, t, s]) =>
                card(p, `${iconChip(d)}<h3 style="font-size:20px;margin:0 0 8px;">${t}</h3><p style="margin:0 0 18px;line-height:1.6;color:${p.muted};">${s}</p><a href="#" style="color:${PRIMARY};font-weight:600;text-decoration:none;">Learn more →</a>`),
            )
            .join(''),
        )}`,
      ),
  },
  {
    key: 'services-list',
    label: 'Services: image list',
    media: icon('M3 4h7v7H3z M12 5h9 M12 8h6 M3 13h7v7H3z M12 14h9 M12 17h6'),
    html: (p) =>
      wrap(
        p,
        `${head(p, 'What we do', 'Our services', 'Three core services, explained simply.')}<div style="display:grid;gap:28px;">${['Design', 'Build', 'Grow']
          .map(
            (t, i) =>
              `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:36px;align-items:center;">${i % 2 ? '' : placeholder(p.dark, '16 / 10')}<div><p style="margin:0 0 8px;font-weight:700;color:${PRIMARY};">0${i + 1}</p><h3 style="font-size:28px;margin:0 0 12px;">${t}</h3><p style="margin:0;line-height:1.65;color:${p.muted};">Describe this service, what is included and the result your customer gets.</p></div>${i % 2 ? placeholder(p.dark, '16 / 10') : ''}</div>`,
          )
          .join('')}</div>`,
        { alt: true },
      ),
  },
  // Features
  {
    key: 'features-grid',
    label: 'Features: checklist',
    media: icon('M4 7l2 2 3-3 M12 8h8 M4 15l2 2 3-3 M12 16h8'),
    html: (p) =>
      wrap(
        p,
        `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:56px;align-items:center;"><div>${eyebrow('Features')}${h2('Everything included')}${lead(p, 'No add-ons, no hidden extras. Here is what you get.')}</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px;">${['Mobile friendly', 'Fast loading', 'Secure by default', 'Easy to edit', 'SEO ready', 'Free support']
          .map((t) => `<div style="display:flex;gap:10px;align-items:flex-start;font-weight:600;">${check}<span>${t}</span></div>`)
          .join('')}</div></div>`,
        { alt: true },
      ),
  },
  // Stats
  {
    key: 'stats',
    label: 'Stats: numbers',
    media: icon('M4 17h16 M6 13V7 M12 13V5 M18 13V9'),
    html: (p) =>
      wrap(
        p,
        grid(
          200,
          [
            ['00', 'Your number: what it counts'],
            ['00', 'Your number: what it counts'],
            ['00', 'Your number: what it counts'],
            ['00', 'Your number: what it counts'],
          ]
            .map(
              ([n, t]) =>
                `<div style="text-align:center;"><div style="font-size:52px;font-weight:800;line-height:1;color:${PRIMARY};">${n}</div><div style="margin-top:10px;color:${p.muted};">${t}</div></div>`,
            )
            .join(''),
        ),
        { pad: '72px 24px', alt: true },
      ),
  },
  // Pricing
  {
    key: 'pricing-3',
    label: 'Pricing: three plans',
    media: icon('M3 6h5v13H3z M9.5 3h5v16h-5z M16 6h5v13h-5z'),
    html: (p) =>
      wrap(
        p,
        `${head(p, 'Pricing', 'Simple, honest pricing', 'Pick the plan that fits. Change or cancel any time.')}${grid(
          280,
          [
            ['Starter', '€49', ['5 pages', 'Contact form', 'Email support'], false],
            ['Business', '€99', ['15 pages', 'Online booking', 'Priority support', 'Monthly report'], true],
            ['Pro', '€199', ['Unlimited pages', 'Online shop', 'Phone support', 'Strategy call'], false],
          ]
            .map(([name, price, items, hot]) =>
              card(
                p,
                `${hot ? `<span style="display:inline-block;margin-bottom:14px;padding:4px 12px;border-radius:999px;background:${PRIMARY};color:#fff;font-size:12px;font-weight:700;">Most popular</span>` : ''}<h3 style="font-size:20px;margin:0 0 6px;">${name}</h3><div style="margin:0 0 22px;"><span style="font-size:46px;font-weight:800;">${price}</span><span style="color:${p.muted};"> / month</span></div><ul style="list-style:none;padding:0;margin:0 0 28px;display:grid;gap:12px;">${(items as string[])
                  .map((t) => `<li style="display:flex;gap:10px;">${check}<span>${t}</span></li>`)
                  .join('')}</ul>${btn('Choose ' + name, Boolean(hot), p)}`,
                hot ? `border:2px solid ${PRIMARY};` : '',
              ),
            )
            .join(''),
        )}`,
      ),
  },
  {
    key: 'pricing-2',
    label: 'Pricing: two options',
    media: icon('M3 5h8v14H3z M13 5h8v14h-8z'),
    html: (p) =>
      wrap(
        p,
        `${head(p, 'Pricing', 'One-off or monthly', 'Pay once, or spread the cost.')}<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;max-width:860px;margin:0 auto;">${[
          ['One-off', '€2,500', 'Pay once, own it forever.'],
          ['Monthly', '€149', 'Everything included, cancel any time.'],
        ]
          .map(([n, pr, s], i) =>
            card(
              p,
              `<h3 style="font-size:20px;margin:0 0 6px;">${n}</h3><div style="font-size:46px;font-weight:800;margin:0 0 10px;">${pr}</div><p style="margin:0 0 26px;color:${p.muted};line-height:1.6;">${s}</p>${btn('Get started', i === 1, p)}`,
              i === 1 ? `border:2px solid ${PRIMARY};` : '',
            ),
          )
          .join('')}</div>`,
        { alt: true },
      ),
  },
  // Testimonials
  {
    key: 'testimonials-grid',
    label: 'Testimonials: three cards',
    media: icon('M3 5h5v8H3z M10 5h5v8h-5z M17 5h4v8h-4z M4 17h16'),
    html: (p) =>
      wrap(
        p,
        `${head(p, 'Testimonials', 'What our customers say', 'Sample reviews: replace them with real ones from your customers.')}${grid(
          280,
          [
            ['Customer name', 'Their business', 'Sample: paste a real review from a customer here.'],
            ['Customer name', 'Their business', 'Sample: paste a real review from a customer here.'],
            ['Customer name', 'Their business', 'Sample: paste a real review from a customer here.'],
          ]
            .map(([n, r, q]) =>
              card(
                p,
                `<div style="display:flex;gap:2px;margin-bottom:14px;">${star.repeat(5)}</div><p style="margin:0 0 20px;font-size:17px;line-height:1.65;">${q}</p><div style="display:flex;align-items:center;gap:12px;"><span style="display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:${PRIMARY};color:#fff;font-weight:700;">${n[0]}</span><div><strong>${n}</strong><div style="font-size:14px;color:${p.muted};">${esc(r)}</div></div></div>`,
              ),
            )
            .join(''),
        )}`,
        { alt: true },
      ),
  },
  {
    key: 'testimonial-big',
    label: 'Testimonials: one big quote',
    media: icon('M7 7h4v4H7z M7 11c0 3-1 5-3 6 M15 7h4v4h-4z M15 11c0 3-1 5-3 6'),
    html: (p) =>
      wrap(
        p,
        `<figure style="margin:0 auto;max-width:860px;text-align:center;"><div style="display:flex;gap:4px;justify-content:center;margin-bottom:22px;">${star.repeat(5)}</div><blockquote style="margin:0 0 28px;font-size:clamp(22px,3vw,32px);line-height:1.4;font-weight:600;">Sample: paste a real review from a customer here.</blockquote><figcaption><strong>Customer name</strong><div style="color:${p.muted};">Their business</div></figcaption></figure>`,
      ),
  },
  // Team
  {
    key: 'team',
    label: 'Team: people',
    media: icon('M8 11a3 3 0 100-6 3 3 0 000 6z M16 11a3 3 0 100-6 3 3 0 000 6z M2 20a6 6 0 0112 0 M10 20a6 6 0 0112 0'),
    html: (p) =>
      wrap(
        p,
        `${head(p, 'Team', 'Meet the people behind it', 'A friendly team that knows your business.')}${grid(
          220,
          [
            ['Dave', 'Founder'],
            ['Emma', 'Designer'],
            ['Liam', 'Developer'],
            ['Nora', 'Support'],
          ]
            .map(([n, r]) => `<div style="text-align:center;">${placeholder(p.dark, '1 / 1')}<h3 style="font-size:19px;margin:16px 0 4px;">${n}</h3><p style="margin:0;color:${p.muted};">${r}</p></div>`)
            .join(''),
        )}`,
      ),
  },
  // Logos
  {
    key: 'logos',
    label: 'Logos: trusted by',
    media: icon('M3 10h4v4H3z M10 10h4v4h-4z M17 10h4v4h-4z'),
    html: (p) =>
      wrap(
        p,
        `<p style="text-align:center;margin:0 0 28px;color:${p.muted};font-weight:600;">Trusted by local businesses</p><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:48px;opacity:0.7;">${['Acme', 'Northwind', 'Globex', 'Initech', 'Umbrella']
          .map((t) => `<span style="font-size:22px;font-weight:800;letter-spacing:-0.02em;">${t}</span>`)
          .join('')}</div>`,
        { pad: '56px 24px' },
      ),
  },
  // Gallery
  {
    key: 'gallery',
    label: 'Gallery: our work',
    media: icon('M3 3h8v8H3z M13 3h8v8h-8z M3 13h8v8H3z M13 13h8v8h-8z'),
    html: (p) =>
      wrap(
        p,
        `${head(p, 'Portfolio', 'Recent work', 'A few projects we are proud of.')}${grid(260, [1, 2, 3, 4, 5, 6].map(() => placeholder(p.dark, '4 / 3')).join(''), 16)}`,
        { alt: true },
      ),
  },
  // FAQ
  {
    key: 'faq',
    label: 'FAQ: questions',
    media: icon('M4 6h16 M4 12h16 M4 18h16 M17 4l2 2-2 2'),
    html: (p) =>
      wrap(
        p,
        `${head(p, 'FAQ', 'Questions people ask', 'Still unsure? Get in touch.')}<div style="display:grid;gap:12px;max-width:820px;margin:0 auto;">${[
          ['How long does it take?', 'Most projects are ready within two weeks.'],
          ['What does it cost?', 'You get a fixed price before any work starts.'],
          ['Can I edit it myself?', 'Yes. Everything can be changed from your admin.'],
          ['Do you offer support?', 'Yes, by phone and email on every plan.'],
        ]
          .map(
            ([q, a]) =>
              `<details style="background:${p.card};border:1px solid ${p.line};border-radius:14px;padding:18px 22px;"><summary style="cursor:pointer;font-weight:600;font-size:17px;">${q}</summary><p style="margin:12px 0 0;line-height:1.65;color:${p.muted};">${a}</p></details>`,
          )
          .join('')}</div>`,
      ),
  },
  // Call to action
  {
    key: 'cta-banner',
    label: 'Call to action: banner',
    media: icon('M3 7h18v10H3z M7 12h6 M15 11h4v2h-4z'),
    html: (p) =>
      wrap(
        p,
        `<div style="background:${PRIMARY};color:#ffffff;border-radius:24px;padding:56px 40px;display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between;"><div style="max-width:620px;"><h2 style="font-size:clamp(28px,3.6vw,40px);line-height:1.1;margin:0 0 10px;font-weight:800;">Ready to get started?</h2><p style="margin:0;font-size:18px;opacity:0.9;line-height:1.6;">Book a free call and get a plan for your business.</p></div><a href="#" style="display:inline-block;padding:15px 28px;border-radius:999px;background:#ffffff;color:#0f172a;text-decoration:none;font-weight:700;">Book a free call</a></div>`,
        { pad: '72px 24px' },
      ),
  },
  {
    key: 'cta-centered',
    label: 'Call to action: centred',
    media: icon('M3 6h18v12H3z M8 10h8 M10 14h4'),
    html: (p) =>
      wrap(
        p,
        `<div style="text-align:center;max-width:720px;margin:0 auto;">${h2('Let us build something great together')}${lead(p, 'Tell us what you need. We reply within one working day.', true)}<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:30px;">${btn('Contact us')}${btn('See pricing', false, p)}</div></div>`,
        { alt: true },
      ),
  },
  // Contact
  {
    key: 'contact',
    label: 'Contact: details and map',
    media: icon('M3 5h18v14H3z M3 7l9 6 9-6'),
    html: (p) =>
      wrap(
        p,
        `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:48px;align-items:start;"><div>${eyebrow('Contact')}${h2('Get in touch')}${lead(p, 'Call, email or drop in. We would love to hear from you.')}<div style="display:grid;gap:18px;margin-top:30px;">${[
          [ICON.phone, 'Phone', '+353 1 234 5678'],
          [ICON.mail, 'Email', 'hello@yourbrand.com'],
          [ICON.pin, 'Address', 'Main Street, Your Town'],
        ]
          .map(
            ([d, t, v]) =>
              `<div style="display:flex;gap:14px;align-items:center;"><span style="display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:${PRIMARY};color:#fff;flex:none;">${icon(d, 20)}</span><div><div style="font-size:13px;color:${p.muted};">${t}</div><strong>${v}</strong></div></div>`,
          )
          .join('')}</div></div><div style="border-radius:20px;overflow:hidden;border:1px solid ${p.line};"><iframe src="https://maps.google.com/maps?q=Carrick-on-Shannon&amp;z=14&amp;output=embed" style="width:100%;height:420px;border:0;display:block;" loading="lazy" title="Map"></iframe></div></div>`,
      ),
  },
  // Footer
  {
    key: 'footer-columns',
    label: 'Footer: columns',
    media: icon('M3 15h18v6H3z M5 17h3 M10 17h3 M15 17h3'),
    html: (p) =>
      `<footer style="background:${p.dark ? '#05070d' : p.alt};color:${p.ink};padding:72px 24px 32px;border-top:1px solid ${p.line};"><div style="max-width:1140px;margin:0 auto;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:40px;"><div>${logo(p)}<p style="margin:16px 0 0;line-height:1.6;color:${p.muted};max-width:280px;">A short line about your business and who you help.</p></div>${[
        ['Company', ['About', 'Team', 'Careers']],
        ['Services', ['Websites', 'Marketing', 'Support']],
        ['Contact', ['hello@yourbrand.com', '+353 1 234 5678', 'Main Street']],
      ]
        .map(
          ([t, items]) =>
            `<div><h4 style="margin:0 0 14px;font-size:15px;">${t}</h4><ul style="list-style:none;padding:0;margin:0;display:grid;gap:10px;">${(items as string[])
              .map((i) => `<li><a href="#" style="color:${p.muted};text-decoration:none;">${i}</a></li>`)
              .join('')}</ul></div>`,
        )
        .join('')}</div><div style="margin-top:48px;padding-top:24px;border-top:1px solid ${p.line};display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;color:${p.muted};font-size:14px;"><span>© YourBrand. All rights reserved.</span><span><a href="#" style="color:inherit;text-decoration:none;">Privacy</a> · <a href="#" style="color:inherit;text-decoration:none;">Terms</a></span></div></div></footer>`,
  },
  {
    key: 'footer-simple',
    label: 'Footer: simple',
    media: icon('M3 16h18v5H3z M6 18.5h4 M14 18.5h4'),
    html: (p) =>
      `<footer style="background:${p.dark ? '#05070d' : p.bg};color:${p.ink};padding:32px 24px;border-top:1px solid ${p.line};"><div style="max-width:1140px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">${logo(p)}<nav style="display:flex;gap:22px;flex-wrap:wrap;">${navLinks(p)}</nav><span style="color:${p.muted};font-size:14px;">© YourBrand</span></div></footer>`,
  },
]

const PAGES: { key: string; label: string; parts: string[] }[] = [
  { key: 'page-home', label: 'Full page: Home', parts: ['header-classic', 'hero-split', 'logos', 'services-cards', 'about-split', 'stats', 'testimonials-grid', 'pricing-3', 'faq', 'cta-banner', 'footer-columns'] },
  { key: 'page-about', label: 'Full page: About', parts: ['header-classic', 'hero-centered', 'about-split', 'about-values', 'team', 'cta-centered', 'footer-columns'] },
  { key: 'page-services', label: 'Full page: Services', parts: ['header-classic', 'hero-centered', 'services-list', 'features-grid', 'testimonial-big', 'cta-banner', 'footer-columns'] },
  { key: 'page-pricing', label: 'Full page: Pricing', parts: ['header-classic', 'pricing-3', 'features-grid', 'faq', 'cta-centered', 'footer-columns'] },
  { key: 'page-contact', label: 'Full page: Contact', parts: ['header-classic', 'contact', 'faq', 'footer-simple'] },
]

/** Grouped with the main library's categories in the Templates tab. */
const CATEGORY: Record<string, string> = {
  header: 'Headers and footers',
  footer: 'Headers and footers',
  hero: 'Heroes',
  about: 'Content',
  services: 'Content',
  features: 'Content',
  team: 'Content',
  gallery: 'Content',
  stats: 'Social proof',
  testimonials: 'Social proof',
  testimonial: 'Social proof',
  logos: 'Social proof',
  pricing: 'Sales',
  faq: 'Sales',
  cta: 'Sales',
  contact: 'Contact',
}

/** Template blocks for one mode. Ids start with "lib-<mode>-" so the builder can show one mode at a time. */
export function templates(mode: Mode): LibraryBlock[] {
  const p = PALETTES[mode]
  const byKey = new Map(SECTIONS.map((s) => [s.key, s]))
  const sections = SECTIONS.map((s) => ({
    id: `lib-${mode}-${s.key}`,
    label: s.label,
    category: CATEGORY[s.key.split('-')[0]] || 'Sections',
    media: s.media,
    content: s.html(p),
  }))
  // Whole pages leave out the header and footer: the site already has its own.
  const pages = PAGES.map((pg) => ({
    id: `lib-${mode}-${pg.key}`,
    label: `${pg.label.replace(/^[^:]+:\s*/, '')} page (${mode === 'dark' ? 'dark' : 'bright'})`,
    category: 'Whole pages',
    media: icon('M5 2h10l4 4v16H5z M15 2v4h4 M8 10h8 M8 14h8 M8 18h5'),
    content: pg.parts.filter((k) => !/^(header|footer)-/.test(k)).map((k) => byKey.get(k)!.html(p)).join(''),
  }))
  return [...pages, ...sections]
}
