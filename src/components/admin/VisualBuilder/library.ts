/**
 * What the visual builder offers: elements (Add tab) and ready-designed sections
 * (Templates tab). Templates use the site's own colours and fonts through the theme
 * tokens, so they fit every template and colour scheme. Sample text is marked as
 * sample: never invented reviews or figures.
 */

export const ICONS: Record<string, string> = {
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  check: 'M4 12l5 5L20 6',
  heart: 'M12 20s-7-4.4-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.6-9 9-9 9z',
  home: 'M3 11l9-7 9 7 M5 10v10h14V10',
  phone: 'M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z',
  mail: 'M3 5h18v14H3z M3 6l9 7 9-7',
  pin: 'M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z M12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2',
  calendar: 'M3 5h18v16H3z M3 10h18 M8 3v4 M16 3v4',
  user: 'M20 21a8 8 0 00-16 0 M12 13a5 5 0 100-10 5 5 0 000 10z',
  users: 'M17 21a6 6 0 00-12 0 M11 11a4 4 0 100-8 4 4 0 000 8z M22 21a5 5 0 00-4-4.9 M16 3.1a4 4 0 010 7.8',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  bolt: 'M13 2L3 14h8l-1 8 10-12h-8z',
  sparkle: 'M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z',
  leaf: 'M11 20A7 7 0 014 13c0-6 6-10 16-10 0 10-4 16-10 16 M4 21c3-5 6-8 11-11',
  camera: 'M3 7h4l2-3h6l2 3h4v13H3z M12 17a4 4 0 100-8 4 4 0 000 8z',
  globe: 'M12 22a10 10 0 100-20 10 10 0 000 20z M2 12h20 M12 2a15 15 0 010 20 15 15 0 010-20z',
  award: 'M12 15a6 6 0 100-12 6 6 0 000 12z M8.2 13.9L7 22l5-3 5 3-1.2-8.1',
  truck: 'M1 4h14v12H1z M15 9h4l4 4v3h-8z M5.5 21a2 2 0 100-4 2 2 0 000 4z M18.5 21a2 2 0 100-4 2 2 0 000 4z',
  tool: 'M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z',
  briefcase: 'M3 7h18v13H3z M8 7V4h8v3 M3 12h18',
  chat: 'M21 12a8 8 0 01-11.6 7.1L3 21l1.9-6.4A8 8 0 1121 12z',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  key: 'M15 7a4 4 0 11-3.9 5H3v3h3v3h3v-3h2.1A4 4 0 0115 7z',
}

export const ICON_OPTIONS = Object.keys(ICONS).map((id) => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1) }))

export const svgIcon = (name: string, size = '1em') =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name] || ICONS.star}"/></svg>`

const SOCIAL: Record<string, string> = {
  Facebook: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
  Instagram: 'M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z M16 11.4A4 4 0 1112.6 8 4 4 0 0116 11.4z M17.5 6.5h.01',
  LinkedIn: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z M2 9h4v12H2z M4 2a2 2 0 110 4 2 2 0 010-4z',
  YouTube: 'M2.5 17a24 24 0 010-10 2 2 0 011.4-1.4 50 50 0 0116.2 0A2 2 0 0121.5 7a24 24 0 010 10 2 2 0 01-1.4 1.4 50 50 0 01-16.2 0A2 2 0 012.5 17z M10 15l5-3-5-3z',
  X: 'M4 4l16 16 M20 4L4 20',
}

/** A neutral picture to swap: double-click it in the builder. */
export const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><rect width='800' height='600' fill='%23e7e5ee'/><path d='M300 380l80-90 70 70 50-50 100 110H300z' fill='%23c9c5d6'/><circle cx='330' cy='250' r='34' fill='%23c9c5d6'/></svg>"

const icon = (d: string) =>
  `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`

const iconSpan = (name: string, style = '') =>
  `<span class="up-icon" data-icon="${name}" style="display:inline-flex;font-size:32px;color:var(--up-primary);${style}">${svgIcon(name)}</span>`

const embedBox = (kind: 'video' | 'map') =>
  `<div class="up-embed" data-kind="${kind}" data-link="" style="position:relative;width:100%;aspect-ratio:${kind === 'video' ? '16/9' : '4/3'};border-radius:12px;overflow:hidden;background:#e7e5ee;"></div>`

export type BuilderBlock = {
  id: string
  label: string
  category: string
  media: string
  content: unknown
  activate?: boolean
}

/** Whole sections can only sit on the page itself, between other sections. */
export const WRAP = (_source: unknown, target: { is?: (type: string) => boolean } | undefined) => Boolean(target?.is?.('wrapper'))

/** Elements: the Add tab. */
export const ELEMENTS: BuilderBlock[] = [
  { id: 'section', label: 'Section', category: 'Layout', media: icon('M3 5h18v14H3z M7 9h10 M7 13h6'),
    content: `<section style="padding:72px 24px;"><div style="max-width:1100px;margin:0 auto;"><h2 style="font-size:40px;line-height:1.1;margin:0 0 16px;">A new section</h2><p style="font-size:18px;line-height:1.6;margin:0;">Write something here.</p></div></section>` },
  { id: 'columns-2', label: 'Two columns', category: 'Layout', media: icon('M3 5h8v14H3z M13 5h8v14h-8z'),
    content: `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:32px;padding:32px 24px;max-width:1100px;margin:0 auto;"><div><h3 style="font-size:24px;margin:0 0 8px;">First column</h3><p style="line-height:1.6;margin:0;">Some text.</p></div><div><h3 style="font-size:24px;margin:0 0 8px;">Second column</h3><p style="line-height:1.6;margin:0;">Some text.</p></div></div>` },
  { id: 'columns-3', label: 'Three columns', category: 'Layout', media: icon('M3 5h5v14H3z M9.5 5h5v14h-5z M16 5h5v14h-5z'),
    content: `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:28px;padding:32px 24px;max-width:1100px;margin:0 auto;"><div><h3 style="font-size:22px;margin:0 0 8px;">One</h3><p style="line-height:1.6;margin:0;">Some text.</p></div><div><h3 style="font-size:22px;margin:0 0 8px;">Two</h3><p style="line-height:1.6;margin:0;">Some text.</p></div><div><h3 style="font-size:22px;margin:0 0 8px;">Three</h3><p style="line-height:1.6;margin:0;">Some text.</p></div></div>` },
  { id: 'spacer', label: 'Spacer', category: 'Layout', media: icon('M12 4v16 M8 8l4-4 4 4 M8 16l4 4 4-4'), content: `<div style="height:48px;"></div>` },
  { id: 'divider', label: 'Divider', category: 'Layout', media: icon('M3 12h18'), content: `<hr style="border:0;border-top:1px solid currentColor;opacity:.15;margin:32px 0;">` },

  { id: 'heading', label: 'Heading', category: 'Content', media: icon('M6 4v16 M18 4v16 M6 12h12'), content: `<h2 style="font-size:40px;line-height:1.1;margin:0 0 16px;">Heading</h2>` },
  { id: 'text', label: 'Text', category: 'Content', media: icon('M4 6h16 M4 10h16 M4 14h12 M4 18h9'), content: `<p style="font-size:18px;line-height:1.6;margin:0 0 16px;">Your text here.</p>` },
  { id: 'image', label: 'Image', category: 'Content', media: icon('M4 5h16v14H4z M4 15l5-5 4 4 3-3 4 4'), activate: true,
    content: { type: 'image', style: { width: '100%', height: 'auto', display: 'block', 'border-radius': '12px' } } },
  { id: 'button', label: 'Button', category: 'Content', media: icon('M4 8h16v8H4z M9 12h6'),
    content: `<a href="#" style="display:inline-block;padding:14px 26px;border-radius:999px;background:var(--up-primary);color:#ffffff;text-decoration:none;font-weight:600;">Button</a>` },
  { id: 'list', label: 'List', category: 'Content', media: icon('M9 6h11 M9 12h11 M9 18h11 M5 6h.01 M5 12h.01 M5 18h.01'),
    content: `<ul style="font-size:18px;line-height:1.7;padding-left:22px;margin:0 0 16px;"><li>First point</li><li>Second point</li><li>Third point</li></ul>` },
  { id: 'quote', label: 'Quote', category: 'Content', media: icon('M7 7h4v4H7z M7 11c0 3-1 5-3 6 M15 7h4v4h-4z M15 11c0 3-1 5-3 6'),
    content: `<blockquote style="border-left:4px solid var(--up-primary);padding-left:20px;margin:24px 0;font-size:22px;line-height:1.5;font-style:italic;">A short quote.</blockquote>` },
  { id: 'badge', label: 'Badge', category: 'Content', media: icon('M4 9h16v6H4z'),
    content: `<span style="display:inline-block;padding:6px 14px;border-radius:999px;background:var(--up-primary);color:#ffffff;font-size:13px;font-weight:600;">New</span>` },
  { id: 'icon', label: 'Icon', category: 'Content', media: icon(ICONS.star), content: iconSpan('star') },
  { id: 'icon-box', label: 'Icon box', category: 'Content', media: icon('M4 4h16v16H4z M12 8l1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 14l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z'),
    content: `<div style="padding:28px;border-radius:16px;border:1px solid rgba(127,127,127,.25);">${iconSpan('sparkle')}<h3 style="font-size:22px;margin:14px 0 8px;">A clear benefit</h3><p style="line-height:1.6;margin:0;opacity:.8;">One or two sentences about it.</p></div>` },
  { id: 'card', label: 'Card', category: 'Content', media: icon('M4 3h16v18H4z M4 11h16 M7 15h7'),
    content: `<div style="border-radius:16px;overflow:hidden;border:1px solid rgba(127,127,127,.25);max-width:380px;"><img src="${PLACEHOLDER_IMG}" alt="" style="width:100%;aspect-ratio:4/3;object-fit:cover;display:block;"><div style="padding:22px;"><h3 style="font-size:22px;margin:0 0 8px;">Card title</h3><p style="line-height:1.6;margin:0 0 16px;opacity:.8;">A short description.</p><a href="#" style="color:var(--up-primary);font-weight:600;text-decoration:none;">Learn more</a></div></div>` },

  { id: 'video', label: 'Video', category: 'Media', media: icon('M3 5h18v14H3z M10 9l5 3-5 3z'), content: embedBox('video') },
  { id: 'map', label: 'Map', category: 'Media', media: icon(ICONS.pin), content: embedBox('map') },
  { id: 'gallery', label: 'Gallery', category: 'Media', media: icon('M3 3h8v8H3z M13 3h8v8h-8z M3 13h8v8H3z M13 13h8v8h-8z'),
    content: `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">${Array.from({ length: 6 }, () => `<img src="${PLACEHOLDER_IMG}" alt="" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;display:block;">`).join('')}</div>` },

  { id: 'accordion', label: 'Accordion', category: 'Interactive', media: icon('M4 6h16 M4 12h16 M4 18h16 M18 4l2 2-2 2'),
    content: `<div style="max-width:800px;">${['First question', 'Second question', 'Third question'].map((q) => `<details style="border-bottom:1px solid rgba(127,127,127,.25);padding:16px 0;"><summary style="font-size:18px;font-weight:600;cursor:pointer;">${q}</summary><p style="line-height:1.6;margin:12px 0 0;opacity:.85;">The answer goes here.</p></details>`).join('')}</div>` },
  { id: 'social', label: 'Social links', category: 'Interactive', media: icon('M18 8a3 3 0 100-6 3 3 0 000 6z M6 15a3 3 0 100-6 3 3 0 000 6z M18 22a3 3 0 100-6 3 3 0 000 6z M8.6 13.5l6.8 4 M15.4 6.5l-6.8 4'),
    content: `<div style="display:flex;gap:12px;">${Object.entries(SOCIAL).map(([name, d]) => `<a href="#" aria-label="${name}" style="display:inline-flex;width:44px;height:44px;align-items:center;justify-content:center;border-radius:50%;border:1px solid rgba(127,127,127,.3);color:inherit;"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg></a>`).join('')}</div>` },
  { id: 'form', label: 'Form', category: 'Interactive', media: icon('M4 4h16v16H4z M8 9h8 M8 13h8 M8 17h4'),
    content: { tagName: 'div', attributes: { 'data-up-newform': '', class: 'up-ref' }, draggable: WRAP,
      components: '<strong>Form</strong><span>Choose which form in the Settings tab.</span>' } },
]

export type SectionTemplate = { key: string; label: string; category: string; html: string; css: string }

const btn = 'display:inline-block;padding:15px 28px;border-radius:999px;font-weight:600;text-decoration:none;'
const wrapCss = (cls: string, extra = '') => `.${cls}{padding:clamp(64px,9vw,120px) 24px;${extra}}.${cls} .in{max-width:1160px;margin:0 auto}`

/** Ready-designed sections: the Templates tab. */
export const TEMPLATES: SectionTemplate[] = [
  {
    key: 'hero-split', label: 'Hero: text and photo', category: 'Heroes',
    html: `<section class="t-hs"><div class="in"><div class="txt"><span class="eyebrow">Your business</span><h1>A headline that says what you do</h1><p class="lead">One or two sentences on who you help and why they should pick you.</p><div class="btns"><a href="#contact" class="b1">Get in touch</a><a href="#services" class="b2">See what we do</a></div></div><img src="${PLACEHOLDER_IMG}" alt="" class="pic"></div></section>`,
    css: `${wrapCss('t-hs')}.t-hs .in{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:56px;align-items:center}.t-hs .eyebrow{display:inline-block;padding:6px 14px;border-radius:999px;background:color-mix(in oklab,var(--up-primary) 14%,transparent);color:var(--up-primary);font-weight:600;font-size:14px}.t-hs h1{font-size:clamp(40px,5.5vw,72px);line-height:1.02;letter-spacing:-.02em;margin:20px 0}.t-hs .lead{font-size:20px;line-height:1.6;opacity:.8;margin:0 0 32px;max-width:52ch}.t-hs .btns{display:flex;flex-wrap:wrap;gap:12px}.t-hs .b1{${btn}background:var(--up-primary);color:#fff}.t-hs .b2{${btn}border:1px solid currentColor;color:inherit}.t-hs .pic{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:28px}`,
  },
  {
    key: 'hero-center', label: 'Hero: bold colour', category: 'Heroes',
    html: `<section class="t-hc"><div class="in"><h1>Big promise, said simply</h1><p>A short line that backs it up.</p><a href="#contact" class="b1">Start today</a></div></section>`,
    css: `${wrapCss('t-hc', 'background:linear-gradient(135deg,var(--up-primary),var(--up-accent));color:#fff;text-align:center')}.t-hc h1{font-size:clamp(44px,7vw,96px);line-height:1;letter-spacing:-.03em;margin:0 auto 20px;max-width:14ch}.t-hc p{font-size:21px;opacity:.9;margin:0 0 36px}.t-hc .b1{${btn}background:#fff;color:#111}`,
  },
  {
    key: 'hero-photo', label: 'Hero: full photo', category: 'Heroes',
    html: `<section class="t-hp"><img src="${PLACEHOLDER_IMG}" alt="" class="bg"><div class="in"><h1>A headline over a great photo</h1><p>Say what makes you different.</p><a href="#contact" class="b1">Book now</a></div></section>`,
    css: `.t-hp{position:relative;min-height:78vh;display:grid;align-items:end;color:#fff;overflow:hidden}.t-hp .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.t-hp::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05) 30%,rgba(0,0,0,.72))}.t-hp .in{position:relative;z-index:1;max-width:1160px;margin:0 auto;padding:0 24px 72px;width:100%}.t-hp h1{font-size:clamp(42px,6.5vw,88px);line-height:1;letter-spacing:-.02em;margin:0 0 16px;max-width:15ch}.t-hp p{font-size:20px;margin:0 0 30px;opacity:.9}.t-hp .b1{${btn}background:var(--up-primary);color:#fff}`,
  },
  {
    key: 'features', label: 'Services or features', category: 'Content',
    html: `<section class="t-fe"><div class="in"><h2>What we do</h2><p class="intro">A short introduction to your services.</p><div class="grid">${['First service', 'Second service', 'Third service'].map((t, i) => `<div class="card">${iconSpan(['sparkle', 'shield', 'heart'][i], 'font-size:30px')}<h3>${t}</h3><p>Describe it in a sentence or two.</p></div>`).join('')}</div></div></section>`,
    css: `${wrapCss('t-fe')}.t-fe h2{font-size:clamp(34px,4.5vw,56px);letter-spacing:-.02em;margin:0 0 12px}.t-fe .intro{font-size:19px;opacity:.75;margin:0 0 48px;max-width:56ch}.t-fe .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}.t-fe .card{padding:32px;border-radius:20px;border:1px solid rgba(127,127,127,.22);transition:transform .2s ease,border-color .2s ease}.t-fe .card:hover{transform:translateY(-4px);border-color:var(--up-primary)}.t-fe h3{font-size:22px;margin:18px 0 8px}.t-fe .card p{line-height:1.6;opacity:.78;margin:0}`,
  },
  {
    key: 'about', label: 'About with photo', category: 'Content',
    html: `<section class="t-ab"><div class="in"><img src="${PLACEHOLDER_IMG}" alt="" class="pic"><div><h2>About us</h2><p>Tell your story: how you started, what you care about, and who you work with.</p><ul><li>${svgIcon('check')} Something you do well</li><li>${svgIcon('check')} Something customers value</li><li>${svgIcon('check')} Something that sets you apart</li></ul></div></div></section>`,
    css: `${wrapCss('t-ab')}.t-ab .in{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:64px;align-items:center}.t-ab .pic{width:100%;aspect-ratio:1;object-fit:cover;border-radius:28px}.t-ab h2{font-size:clamp(34px,4.5vw,56px);letter-spacing:-.02em;margin:0 0 18px}.t-ab p{font-size:19px;line-height:1.7;opacity:.82;margin:0 0 26px}.t-ab ul{list-style:none;padding:0;margin:0;display:grid;gap:12px}.t-ab li{display:flex;gap:12px;align-items:center;font-size:18px}.t-ab li svg{color:var(--up-primary);flex:none}`,
  },
  {
    key: 'steps', label: 'How it works (steps)', category: 'Content',
    html: `<section class="t-st"><div class="in"><h2>How it works</h2><ol>${['Get in touch', 'We plan it together', 'You get the result'].map((t) => `<li><h3>${t}</h3><p>A sentence about this step.</p></li>`).join('')}</ol></div></section>`,
    css: `${wrapCss('t-st')}.t-st h2{font-size:clamp(34px,4.5vw,56px);letter-spacing:-.02em;margin:0 0 48px}.t-st ol{list-style:none;counter-reset:s;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:32px}.t-st li{counter-increment:s;padding-top:24px;border-top:2px solid var(--up-primary)}.t-st li::before{content:"0" counter(s);font-size:15px;font-weight:700;color:var(--up-primary)}.t-st h3{font-size:24px;margin:12px 0 8px}.t-st p{line-height:1.6;opacity:.78;margin:0}`,
  },
  {
    key: 'stats', label: 'Key numbers', category: 'Social proof',
    html: `<section class="t-ns"><div class="in">${['Your number', 'Your number', 'Your number', 'Your number'].map((n, i) => `<div><strong>${n}</strong><span>${['What it counts', 'What it counts', 'What it counts', 'What it counts'][i]}</span></div>`).join('')}</div></section>`,
    css: `${wrapCss('t-ns', 'padding-top:56px;padding-bottom:56px')}.t-ns .in{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px}.t-ns div div{padding:24px;border-left:3px solid var(--up-primary)}.t-ns strong{display:block;font-size:clamp(32px,4vw,52px);line-height:1;letter-spacing:-.02em}.t-ns span{display:block;margin-top:8px;opacity:.7}`,
  },
  {
    key: 'testimonials', label: 'Reviews', category: 'Social proof',
    html: `<section class="t-te"><div class="in"><h2>What customers say</h2><div class="grid">${[1, 2, 3].map(() => `<figure><blockquote>Sample: paste a real review from a customer here.</blockquote><figcaption><strong>Customer name</strong><span>Where they're from</span></figcaption></figure>`).join('')}</div></div></section>`,
    css: `${wrapCss('t-te')}.t-te h2{font-size:clamp(34px,4.5vw,56px);letter-spacing:-.02em;margin:0 0 40px}.t-te .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}.t-te figure{margin:0;padding:32px;border-radius:20px;background:color-mix(in oklab,var(--up-primary) 7%,transparent)}.t-te blockquote{margin:0 0 24px;font-size:19px;line-height:1.6}.t-te strong{display:block}.t-te span{opacity:.65;font-size:15px}`,
  },
  {
    key: 'logos', label: 'Logo strip', category: 'Social proof',
    html: `<section class="t-lo"><div class="in"><p>Trusted by</p><div class="row">${[1, 2, 3, 4, 5].map(() => `<img src="${PLACEHOLDER_IMG}" alt="Logo">`).join('')}</div></div></section>`,
    css: `${wrapCss('t-lo', 'padding-top:48px;padding-bottom:48px')}.t-lo p{text-align:center;opacity:.6;margin:0 0 24px}.t-lo .row{display:flex;flex-wrap:wrap;justify-content:center;gap:40px;align-items:center}.t-lo img{height:44px;width:140px;object-fit:contain;filter:grayscale(1);opacity:.75}`,
  },
  {
    key: 'pricing', label: 'Prices', category: 'Sales',
    html: `<section class="t-pr"><div class="in"><h2>Prices</h2><div class="grid">${['Basic', 'Standard', 'Premium'].map((p, i) => `<div class="plan${i === 1 ? ' pop' : ''}">${i === 1 ? '<span class="tag">Most popular</span>' : ''}<h3>${p}</h3><p class="price">€00</p><ul><li>What is included</li><li>What is included</li><li>What is included</li></ul><a href="#contact">Choose ${p}</a></div>`).join('')}</div></div></section>`,
    css: `${wrapCss('t-pr')}.t-pr h2{font-size:clamp(34px,4.5vw,56px);letter-spacing:-.02em;margin:0 0 40px;text-align:center}.t-pr .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;align-items:stretch}.t-pr .plan{position:relative;padding:36px;border-radius:24px;border:1px solid rgba(127,127,127,.25);display:flex;flex-direction:column}.t-pr .pop{border:2px solid var(--up-primary)}.t-pr .tag{position:absolute;top:-14px;left:36px;padding:5px 12px;border-radius:999px;background:var(--up-primary);color:#fff;font-size:13px;font-weight:600}.t-pr h3{font-size:22px;margin:0}.t-pr .price{font-size:48px;font-weight:700;margin:12px 0 20px}.t-pr ul{padding-left:20px;line-height:1.9;margin:0 0 28px;flex:1}.t-pr a{${btn}text-align:center;background:var(--up-primary);color:#fff}`,
  },
  {
    key: 'cta', label: 'Call to action', category: 'Sales',
    html: `<section class="t-ct"><div class="in"><h2>Ready when you are</h2><p>One line on what happens next.</p><a href="#contact">Get started</a></div></section>`,
    css: `.t-ct{padding:24px}.t-ct .in{max-width:1160px;margin:0 auto;padding:clamp(48px,7vw,96px) 32px;border-radius:32px;text-align:center;color:#fff;background:linear-gradient(120deg,var(--up-primary),var(--up-accent))}.t-ct h2{font-size:clamp(34px,5vw,64px);letter-spacing:-.02em;margin:0 0 14px}.t-ct p{font-size:20px;opacity:.9;margin:0 0 32px}.t-ct a{${btn}background:#fff;color:#111}`,
  },
  {
    key: 'faq', label: 'FAQ', category: 'Sales',
    html: `<section class="t-fq"><div class="in"><h2>Questions</h2><div>${['First question', 'Second question', 'Third question', 'Fourth question'].map((q) => `<details><summary>${q}</summary><p>The answer goes here.</p></details>`).join('')}</div></div></section>`,
    css: `${wrapCss('t-fq')}.t-fq .in{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:48px}.t-fq h2{font-size:clamp(34px,4.5vw,56px);letter-spacing:-.02em;margin:0}.t-fq details{border-bottom:1px solid rgba(127,127,127,.25);padding:20px 0}.t-fq summary{font-size:19px;font-weight:600;cursor:pointer}.t-fq summary:hover{color:var(--up-primary)}.t-fq p{line-height:1.7;opacity:.82;margin:12px 0 0}`,
  },
  {
    key: 'gallery', label: 'Photo gallery', category: 'Content',
    html: `<section class="t-ga"><div class="in"><h2>Our work</h2><div class="grid">${Array.from({ length: 6 }, (_, i) => `<img src="${PLACEHOLDER_IMG}" alt=""${i === 0 ? ' class="big"' : ''}>`).join('')}</div></div></section>`,
    css: `${wrapCss('t-ga')}.t-ga h2{font-size:clamp(34px,4.5vw,56px);letter-spacing:-.02em;margin:0 0 36px}.t-ga .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}.t-ga img{width:100%;height:100%;min-height:220px;object-fit:cover;border-radius:16px;transition:transform .3s ease}.t-ga img:hover{transform:scale(1.02)}.t-ga .big{grid-row:span 2}`,
  },
  {
    key: 'team', label: 'Team', category: 'Content',
    html: `<section class="t-tm"><div class="in"><h2>Meet the team</h2><div class="grid">${[1, 2, 3, 4].map(() => `<div><img src="${PLACEHOLDER_IMG}" alt=""><h3>Name</h3><p>Role</p></div>`).join('')}</div></div></section>`,
    css: `${wrapCss('t-tm')}.t-tm h2{font-size:clamp(34px,4.5vw,56px);letter-spacing:-.02em;margin:0 0 36px}.t-tm .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px}.t-tm img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:20px}.t-tm h3{font-size:20px;margin:14px 0 2px}.t-tm p{margin:0;opacity:.65}`,
  },
  {
    key: 'video', label: 'Video feature', category: 'Content',
    html: `<section class="t-vi"><div class="in"><h2>See it in action</h2><p>A sentence about the video.</p>${embedBox('video')}</div></section>`,
    css: `${wrapCss('t-vi', 'text-align:center')}.t-vi .in{max-width:960px}.t-vi h2{font-size:clamp(34px,4.5vw,56px);letter-spacing:-.02em;margin:0 0 12px}.t-vi p{font-size:19px;opacity:.75;margin:0 0 36px}`,
  },
  {
    key: 'contact', label: 'Contact details and map', category: 'Contact',
    html: `<section class="t-co" id="contact"><div class="in"><div><h2>Get in touch</h2><p class="intro">We usually reply within a day.</p><ul><li>${svgIcon('phone')}<span>Your phone number</span></li><li>${svgIcon('mail')}<span>you@example.com</span></li><li>${svgIcon('pin')}<span>Your address</span></li><li>${svgIcon('clock')}<span>Your opening hours</span></li></ul></div>${embedBox('map')}</div></section>`,
    css: `${wrapCss('t-co')}.t-co .in{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:56px;align-items:center}.t-co h2{font-size:clamp(34px,4.5vw,56px);letter-spacing:-.02em;margin:0 0 12px}.t-co .intro{font-size:19px;opacity:.75;margin:0 0 32px}.t-co ul{list-style:none;padding:0;margin:0;display:grid;gap:18px}.t-co li{display:flex;gap:14px;align-items:center;font-size:18px}.t-co li svg{color:var(--up-primary);width:22px;height:22px;flex:none}`,
  },
]

export const templateIcon = (category: string) =>
  icon(
    {
      Heroes: 'M3 4h18v16H3z M6 9h9 M6 13h6',
      Content: 'M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h5',
      'Social proof': ICONS.star,
      Sales: 'M12 2v20 M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
      Contact: ICONS.mail,
    }[category] || 'M4 4h16v16H4z',
  )

/** Hero text from the page, to rebuild it as a designed section. */
export type HeroData = { heading: string; text: string; image: string; buttons: { label: string; url: string }[] }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function heroTemplate(h: HeroData): { html: string; css: string } {
  const base = TEMPLATES.find((t) => t.key === (h.image ? 'hero-photo' : 'hero-split'))!
  const buttons = h.buttons.length ? h.buttons : [{ label: 'Get in touch', url: '#contact' }]
  if (h.image) {
    return {
      css: base.css,
      html: `<section class="t-hp"><img src="${esc(h.image)}" alt="" class="bg"><div class="in"><h1>${esc(h.heading || 'Your headline')}</h1>${h.text ? `<p>${esc(h.text)}</p>` : ''}${buttons.map((b) => `<a href="${esc(b.url)}" class="b1">${esc(b.label)}</a>`).join(' ')}</div></section>`,
    }
  }
  return {
    css: base.css,
    html: `<section class="t-hs"><div class="in"><div class="txt"><h1>${esc(h.heading || 'Your headline')}</h1>${h.text ? `<p class="lead">${esc(h.text)}</p>` : ''}<div class="btns">${buttons.map((b, i) => `<a href="${esc(b.url)}" class="${i ? 'b2' : 'b1'}">${esc(b.label)}</a>`).join('')}</div></div><img src="${PLACEHOLDER_IMG}" alt="" class="pic"></div></section>`,
  }
}

// ---------------------------------------------------------------------------
// Widgets (second round): sliders, tabs, popups, countdowns and more. Their
// behaviour on the site comes from src/components/Widgets.

const ph = (ratio = '4/3', extra = '') =>
  `<img src="${PLACEHOLDER_IMG}" alt="" style="width:100%;aspect-ratio:${ratio};object-fit:cover;border-radius:14px;display:block;${extra}">`
const line = (d: string) => icon(d)

export const WIDGETS: BuilderBlock[] = [
  { id: 'image-box', label: 'Image box', category: 'Content', media: line('M3 4h18v16H3z M3 13l5-4 4 3 3-2 6 4 M7 17h10'),
    content: `<div style="border-radius:18px;overflow:hidden;border:1px solid rgba(127,127,127,.22);" data-up-hover="lift">${ph('16/10', 'border-radius:0')}<div style="padding:22px;"><h3 style="font-size:22px;margin:0 0 8px;">Image box title</h3><p style="line-height:1.6;margin:0;opacity:.8;">A short description.</p></div></div>` },
  { id: 'icon-list', label: 'Icon list', category: 'Content', media: line('M4 6l1.5 1.5L8 5 M11 6h9 M4 12l1.5 1.5L8 11 M11 12h9 M4 18l1.5 1.5L8 17 M11 18h9'),
    content: `<ul style="list-style:none;padding:0;margin:0;display:grid;gap:12px;">${['First point', 'Second point', 'Third point'].map((t) => `<li style="display:flex;gap:12px;align-items:center;font-size:18px;">${iconSpan('check', 'font-size:22px')}<span>${t}</span></li>`).join('')}</ul>` },
  { id: 'stars', label: 'Star rating', category: 'Content', media: line(ICONS.star),
    content: `<span class="up-w-stars" data-up-stars="5" role="img" aria-label="Rated 5 out of 5"></span>` },
  { id: 'progress', label: 'Progress bar', category: 'Content', media: line('M3 10h18v4H3z M3 10h11v4H3z'),
    content: `<div class="up-w-progress" data-up-value="75"><div style="display:flex;justify-content:space-between;font-weight:600;"><span>Skill or goal</span><span class="up-w-pct">75%</span></div><div class="up-w-bar"><i></i></div></div>` },
  { id: 'table', label: 'Comparison table', category: 'Content', media: line('M3 4h18v16H3z M3 10h18 M3 15h18 M9 4v16 M15 4v16'),
    content: `<table class="up-w-table"><thead><tr><th>What you get</th><th>Basic</th><th>Premium</th></tr></thead><tbody>${['First feature', 'Second feature', 'Third feature'].map((f, i) => `<tr><td>${f}</td><td>${i < 2 ? '✓' : '–'}</td><td>✓</td></tr>`).join('')}</tbody></table>` },
  { id: 'alert', label: 'Alert box', category: 'Content', media: line('M12 3l10 18H2z M12 10v4 M12 17h.01'),
    content: `<div class="up-w-alert" data-up-tone="info">${iconSpan('bolt', 'font-size:22px')}<p style="margin:0;line-height:1.6;">An important note for your visitors.</p></div>` },
  { id: 'toggle', label: 'Toggle', category: 'Interactive', media: line('M4 7h16 M4 12h10 M18 10l2 2-2 2'),
    content: `<details class="up-w-toggle"><summary>Click to read more</summary><p style="margin:12px 0 0;line-height:1.6;">The hidden text appears here.</p></details>` },
  { id: 'tabs', label: 'Tabs', category: 'Interactive', media: line('M3 8h18v12H3z M3 8V5h6v3 M9 5h6v3'),
    content: `<div data-up-widget="tabs">${['First tab', 'Second tab', 'Third tab'].map((t) => `<div class="up-w-tabpanel" data-title="${t}"><p style="line-height:1.7;margin:0;">Content for the ${t.toLowerCase()}. Select the panel to rename its tab in Settings.</p></div>`).join('')}</div>` },
  { id: 'popup', label: 'Popup', category: 'Interactive', media: line('M4 6h16v12H4z M15 3l6 6'),
    content: `<div class="up-w-popup" data-up-widget="popup" data-up-id="offer" data-up-trigger="button" data-up-delay="5"><div class="up-w-popup__box"><h3 style="font-size:28px;line-height:1.2;margin:0 0 10px;">A special offer</h3><p style="line-height:1.6;margin:0 0 22px;">Tell visitors about it in a sentence or two.</p><a href="#contact" style="${btn}background:var(--up-primary);color:#fff;">Find out more</a></div></div>` },
  { id: 'countdown', label: 'Countdown', category: 'Interactive', media: line(ICONS.clock),
    content: `<div class="up-w-countdown" data-up-widget="countdown" data-up-until="2026-12-31 18:00">${['days', 'hours', 'minutes', 'seconds'].map((u) => `<div><b>00</b><span>${u}</span></div>`).join('')}</div>` },
  { id: 'counter', label: 'Counting number', category: 'Interactive', media: line('M4 18V8l3-2v12 M10 8h5l-5 10h6'),
    content: `<div style="text-align:center;"><strong data-up-count="250" data-up-suffix="+" style="display:block;font-size:56px;line-height:1;letter-spacing:-.02em;">250+</strong><span style="opacity:.7;">What it counts</span></div>` },
  { id: 'before-after', label: 'Before and after', category: 'Media', media: line('M3 4h18v16H3z M12 4v16 M9 12l-2-2 M9 12l-2 2 M15 12l2-2 M15 12l2 2'),
    content: `<div class="up-w-ba" data-up-widget="beforeafter"><img src="${PLACEHOLDER_IMG}" alt="Before"><img src="${PLACEHOLDER_IMG}" alt="After"></div>` },
  { id: 'bg-video', label: 'Video background', category: 'Media', media: line('M3 5h18v14H3z M10 9l5 3-5 3z M3 15h18'),
    content: `<section class="up-w-bgvideo" style="padding:120px 24px;color:#ffffff;text-align:center;background:#222;"><video autoplay muted loop playsinline></video><h2 style="font-size:48px;line-height:1.1;margin:0 0 12px;">A headline over video</h2><p style="font-size:20px;margin:0;opacity:.9;">Select the section and choose a video in Settings.</p></section>` },
  { id: 'carousel', label: 'Image carousel', category: 'Sliders', media: line('M7 6h10v12H7z M3 8v8 M21 8v8'),
    content: `<div class="up-w-carousel up-w-lightbox" data-up-per="3" data-up-autoplay="0"><div class="up-w-track">${Array.from({ length: 6 }, () => ph('4/3')).join('')}</div></div>` },
  { id: 'testimonial-slider', label: 'Testimonial slider', category: 'Sliders', media: line('M7 6h10v12H7z M3 8v8 M21 8v8 M10 11h4'),
    content: `<div class="up-w-carousel" data-up-per="2" data-up-autoplay="6"><div class="up-w-track">${[1, 2, 3, 4].map(() => `<figure style="margin:0;padding:30px;border-radius:20px;background:color-mix(in oklab,var(--up-primary) 7%,transparent);"><span class="up-w-stars" data-up-stars="5" role="img" aria-label="Rated 5 out of 5"></span><blockquote style="margin:14px 0 18px;font-size:18px;line-height:1.6;">Sample: paste a real review from a customer here.</blockquote><figcaption><strong>Customer name</strong></figcaption></figure>`).join('')}</div></div>` },
  { id: 'logo-carousel', label: 'Logo carousel', category: 'Sliders', media: line('M3 9h5v6H3z M10 9h4v6h-4z M16 9h5v6h-5z'),
    content: `<div class="up-w-marquee" style="--up-speed:30s;"><div class="up-w-track">${Array.from({ length: 6 }, () => `<img src="${PLACEHOLDER_IMG}" alt="Logo" style="height:44px;width:140px;object-fit:contain;filter:grayscale(1);opacity:.75;">`).join('')}</div></div>` },
  { id: 'lightbox-gallery', label: 'Lightbox gallery', category: 'Media', media: line('M3 3h8v8H3z M13 3h8v8h-8z M3 13h8v8H3z M16 16h5v5 M21 16l-5 5'),
    content: `<div class="up-w-lightbox" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">${Array.from({ length: 6 }, () => ph('4/3')).join('')}</div>` },
  { id: 'share', label: 'Share buttons', category: 'Engagement', media: line('M4 12v7h16v-7 M12 3v12 M8 7l4-4 4 4'),
    content: `<div class="up-w-share" data-up-widget="share">${[['facebook', 'Facebook'], ['x', 'X'], ['linkedin', 'LinkedIn'], ['whatsapp', 'WhatsApp'], ['email', 'Email']].map(([k, n]) => `<a href="#" data-up-net="${k}">${n}</a>`).join('')}</div>` },
  { id: 'to-top', label: 'Back to top', category: 'Engagement', media: line('M12 19V5 M5 12l7-7 7 7'),
    content: `<a href="#" class="up-w-top" data-up-widget="totop" aria-label="Back to top">↑</a>` },
  { id: 'toc', label: 'Table of contents', category: 'Site', media: line('M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01'),
    content: `<nav class="up-w-toc" data-up-widget="toc" aria-label="On this page"><strong>On this page</strong><ol></ol></nav>` },
  { id: 'search', label: 'Search bar', category: 'Site', media: line('M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4.3-4.3'),
    content: `<div class="up-w-search" data-up-widget="search" data-up-placeholder="Search the site"></div>` },
  { id: 'breadcrumbs', label: 'Breadcrumbs', category: 'Site', media: line('M4 12h4 M10 12h4 M16 12h4 M8 10l2 2-2 2 M14 10l2 2-2 2'),
    content: `<nav class="up-w-crumbs" data-up-widget="breadcrumbs"></nav>` },
  { id: 'grid', label: 'Content grid', category: 'Site', media: line('M3 3h8v8H3z M13 3h8v8h-8z M3 13h8v8H3z M13 13h8v8h-8z'),
    content: { tagName: 'div', attributes: { 'data-up-newblock': 'loopGrid', class: 'up-ref' }, draggable: WRAP,
      components: '<strong>Content grid</strong><span>Choose what to show in the Settings tab: posts, listings or any other content.</span>' } },
]

/** Header and footer designs. */
export const CHROME_TEMPLATES: SectionTemplate[] = [
  {
    key: 'header-simple', label: 'Header: logo, menu, button', category: 'Headers and footers',
    html: `<header class="t-hd"><div class="in"><a href="/" class="logo">Your brand</a><button type="button" class="menu" data-up-widget="menu" aria-label="Menu">☰</button><nav class="nav" data-up-menu><a href="/">Home</a><a href="/about">About</a><a href="/services">Services</a><a href="/contact" class="cta">Contact us</a></nav></div></header>`,
    css: `.t-hd{position:sticky;top:0;z-index:30;background:color-mix(in oklab,var(--background,#fff) 88%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid rgba(127,127,127,.18)}.t-hd .in{max-width:1200px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}.t-hd .logo{font-family:var(--up-font-heading);font-weight:800;font-size:22px;text-decoration:none;color:inherit}.t-hd .nav{display:flex;align-items:center;gap:26px}.t-hd .nav a{color:inherit;text-decoration:none;font-weight:500}.t-hd .nav a:hover{color:var(--up-primary)}.t-hd .nav .cta{padding:10px 20px;border-radius:999px;background:var(--up-primary);color:#fff}.t-hd .menu{border:1px solid rgba(127,127,127,.3);background:none;color:inherit;border-radius:10px;padding:8px 12px;font-size:20px}@media (max-width:860px){.t-hd .nav{gap:14px;padding:12px 0}}`,
  },
  {
    key: 'header-bold', label: 'Header: coloured bar', category: 'Headers and footers',
    html: `<header class="t-hb"><div class="in"><a href="/" class="logo">Your brand</a><button type="button" class="menu" data-up-widget="menu" aria-label="Menu">☰</button><nav class="nav" data-up-menu><a href="/">Home</a><a href="/about">About</a><a href="/blog">Blog</a><a href="/contact" class="cta">Get in touch</a></nav></div></header>`,
    css: `.t-hb{background:var(--up-primary);color:#fff}.t-hb .in{max-width:1200px;margin:0 auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}.t-hb .logo{font-family:var(--up-font-heading);font-weight:800;font-size:22px;color:#fff;text-decoration:none}.t-hb .nav{display:flex;align-items:center;gap:26px}.t-hb .nav a{color:#fff;text-decoration:none;opacity:.9}.t-hb .nav a:hover{opacity:1}.t-hb .nav .cta{padding:10px 20px;border-radius:999px;background:#fff;color:#111;opacity:1}.t-hb .menu{border:1px solid rgba(255,255,255,.4);background:none;color:#fff;border-radius:10px;padding:8px 12px;font-size:20px}`,
  },
  {
    key: 'footer-columns', label: 'Footer: columns', category: 'Headers and footers',
    html: `<footer class="t-ft"><div class="in"><div><p class="logo">Your brand</p><p class="about">One line about your business.</p></div><div><p class="h">Pages</p><a href="/">Home</a><a href="/about">About</a><a href="/contact">Contact</a></div><div><p class="h">Contact</p><p>Your phone number</p><p>you@example.com</p></div><div><p class="h">Follow</p><a href="#">Instagram</a><a href="#">Facebook</a></div></div><p class="legal">© Your brand</p></footer>`,
    css: `.t-ft{background:color-mix(in oklab,var(--up-primary) 80%,black);color:#fff;padding:64px 24px 28px}.t-ft .in{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:36px}.t-ft p{margin:0 0 8px}.t-ft .logo{font-family:var(--up-font-heading);font-weight:800;font-size:22px}.t-ft .about{opacity:.75;max-width:30ch}.t-ft .h{font-weight:700;margin-bottom:12px}.t-ft a{display:block;color:#fff;opacity:.8;text-decoration:none;margin-bottom:8px}.t-ft a:hover{opacity:1}.t-ft .legal{max-width:1200px;margin:48px auto 0;padding-top:20px;border-top:1px solid rgba(255,255,255,.15);opacity:.6;font-size:14px}`,
  },
  {
    key: 'footer-simple', label: 'Footer: one line', category: 'Headers and footers',
    html: `<footer class="t-fs"><div class="in"><p>© Your brand</p><nav><a href="/privacy">Privacy</a><a href="/contact">Contact</a></nav></div></footer>`,
    css: `.t-fs{border-top:1px solid rgba(127,127,127,.2);padding:28px 24px}.t-fs .in{max-width:1200px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;align-items:center}.t-fs p{margin:0;opacity:.7}.t-fs nav{display:flex;gap:20px}.t-fs a{color:inherit;text-decoration:none;opacity:.8}`,
  },
]

/** Whole pages: several templates dropped together. */
export const PAGE_TEMPLATES: { key: string; label: string; sections: string[] }[] = [
  { key: 'page-home', label: 'Home page', sections: ['hero-split', 'logos', 'features', 'about', 'testimonials', 'cta'] },
  { key: 'page-landing', label: 'Landing page', sections: ['hero-center', 'features', 'steps', 'pricing', 'faq', 'cta'] },
  { key: 'page-about', label: 'About page', sections: ['hero-photo', 'about', 'stats', 'team', 'cta'] },
  { key: 'page-services', label: 'Services page', sections: ['hero-split', 'features', 'steps', 'testimonials', 'faq', 'cta'] },
  { key: 'page-pricing', label: 'Pricing page', sections: ['hero-center', 'pricing', 'faq', 'cta'] },
  { key: 'page-contact', label: 'Contact page', sections: ['hero-center', 'contact', 'faq'] },
  { key: 'page-portfolio', label: 'Portfolio page', sections: ['hero-split', 'gallery', 'testimonials', 'cta'] },
]

/** Starter kits: a look plus a set of pages, created in one go. */
export const STARTER_KITS: {
  key: string
  name: string
  description: string
  look: { primaryColor: string; accentColor: string; headingFont: string; bodyFont: string; template: string }
  pages: { title: string; slug: string; template: string }[]
}[] = [
  {
    key: 'local',
    name: 'Local business',
    description: 'For trades, salons, clinics and shops: services, about, prices and contact.',
    look: { primaryColor: '#1F6F5C', accentColor: '#F2A541', headingFont: 'Fraunces', bodyFont: 'Inter', template: 'bright' },
    pages: [
      { title: 'Home', slug: 'home', template: 'page-home' },
      { title: 'Services', slug: 'services', template: 'page-services' },
      { title: 'About', slug: 'about', template: 'page-about' },
      { title: 'Prices', slug: 'prices', template: 'page-pricing' },
      { title: 'Contact', slug: 'contact', template: 'page-contact' },
    ],
  },
  {
    key: 'studio',
    name: 'Agency or studio',
    description: 'For agencies, consultants and creatives: work, services, about and contact.',
    look: { primaryColor: '#3A2BFF', accentColor: '#FF4D8D', headingFont: 'Space Grotesk', bodyFont: 'Inter', template: 'swiss' },
    pages: [
      { title: 'Home', slug: 'home', template: 'page-home' },
      { title: 'Work', slug: 'work', template: 'page-portfolio' },
      { title: 'Services', slug: 'services', template: 'page-services' },
      { title: 'About', slug: 'about', template: 'page-about' },
      { title: 'Contact', slug: 'contact', template: 'page-contact' },
    ],
  },
  {
    key: 'launch',
    name: 'Product launch',
    description: 'One strong landing page with prices and questions, plus contact.',
    look: { primaryColor: '#7B2BFF', accentColor: '#00C2FF', headingFont: 'Manrope', bodyFont: 'Inter', template: 'dark' },
    pages: [
      { title: 'Home', slug: 'home', template: 'page-landing' },
      { title: 'Pricing', slug: 'pricing', template: 'page-pricing' },
      { title: 'Contact', slug: 'contact', template: 'page-contact' },
    ],
  },
]

export const ALL_SECTION_TEMPLATES = (): SectionTemplate[] => [...TEMPLATES, ...CHROME_TEMPLATES]
