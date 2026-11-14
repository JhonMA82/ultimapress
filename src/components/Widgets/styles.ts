/**
 * Styles for the visual builder's widgets. The same CSS runs on the site (in the
 * layout) and in the builder's canvas, so what you see while editing is what visitors get.
 * Everything uses theme tokens, so widgets follow the site's colours in every template.
 */

const steps = (attr: string, max: number, step: number, prop: string, unit: string) =>
  Array.from({ length: Math.round(max / step) + 1 }, (_, i) => {
    const v = +(i * step).toFixed(1)
    return `[${attr}="${v}"]{${prop}:${(v / max) * 100}${unit}}`
  }).join('')

export const WIDGET_CSS = `
/* Entrance and hover effects (Settings > Entrance effect / Hover effect) */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    [data-up-anim] { animation: var(--up-anim) both linear; animation-timeline: view(); animation-range: entry 0% entry 55%; }
    [data-up-anim="fade"] { --up-anim: up-fade; }
    [data-up-anim="up"] { --up-anim: up-up; }
    [data-up-anim="left"] { --up-anim: up-left; }
    [data-up-anim="right"] { --up-anim: up-right; }
    [data-up-anim="zoom"] { --up-anim: up-zoom; }
  }
  [data-up-hover] { transition: transform .25s ease, box-shadow .25s ease, filter .25s ease; }
  [data-up-hover="lift"]:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgb(0 0 0 / .14); }
  [data-up-hover="grow"]:hover { transform: scale(1.04); }
  [data-up-hover="glow"]:hover { box-shadow: 0 0 0 4px color-mix(in oklab, var(--up-primary) 35%, transparent); }
  [data-up-hover="brighten"]:hover { filter: brightness(1.08) saturate(1.1); }
}
@keyframes up-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes up-up { from { opacity: 0; transform: translateY(40px) } to { opacity: 1; transform: none } }
@keyframes up-left { from { opacity: 0; transform: translateX(-48px) } to { opacity: 1; transform: none } }
@keyframes up-right { from { opacity: 0; transform: translateX(48px) } to { opacity: 1; transform: none } }
@keyframes up-zoom { from { opacity: 0; transform: scale(.92) } to { opacity: 1; transform: none } }

/* Carousel: swipe on phones, arrows added on the site */
.up-w-carousel { position: relative; }
.up-w-carousel .up-w-track { display: grid; grid-auto-flow: column; grid-auto-columns: var(--up-slide, 80%); gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; scrollbar-width: none; padding-bottom: 4px; }
.up-w-carousel .up-w-track::-webkit-scrollbar { display: none; }
.up-w-carousel .up-w-track > * { scroll-snap-align: start; min-width: 0; }
.up-w-carousel[data-up-per="2"] { --up-slide: calc(50% - 8px); }
.up-w-carousel[data-up-per="3"] { --up-slide: calc(33.333% - 11px); }
@media (max-width: 720px) { .up-w-carousel[data-up-per] { --up-slide: 85%; } }
.up-w-arrows { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; }
.up-w-arrows button { width: 44px; height: 44px; border-radius: 50%; border: 1px solid color-mix(in oklab, currentColor 25%, transparent); background: transparent; color: inherit; font-size: 20px; cursor: pointer; }
.up-w-arrows button:hover { background: var(--up-primary); border-color: var(--up-primary); color: #fff; }

/* Logo carousel: a gentle, endless strip */
.up-w-marquee { overflow: hidden; mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent); }
.up-w-marquee .up-w-track { display: flex; gap: 56px; width: max-content; align-items: center; }
@media (prefers-reduced-motion: no-preference) { .up-w-marquee.is-running .up-w-track { animation: up-marquee var(--up-speed, 30s) linear infinite; } .up-w-marquee:hover .up-w-track { animation-play-state: paused; } }
@keyframes up-marquee { to { transform: translateX(-50%); } }

/* Tabs: stacked until the site turns them into tabs */
[data-up-widget="tabs"] .up-w-tabpanel::before { content: attr(data-title); display: block; font-weight: 700; font-size: 1.1em; margin: 18px 0 8px; }
[data-up-widget="tabs"].is-ready .up-w-tabpanel::before { display: none; }
[data-up-widget="tabs"].is-ready .up-w-tabpanel:not(.is-active) { display: none; }
.up-w-tablist { display: flex; flex-wrap: wrap; gap: 6px; border-bottom: 1px solid color-mix(in oklab, currentColor 18%, transparent); margin-bottom: 20px; }
.up-w-tablist button { padding: 12px 18px; border: 0; border-bottom: 2px solid transparent; background: none; color: inherit; font: inherit; font-weight: 600; opacity: .65; cursor: pointer; margin-bottom: -1px; }
.up-w-tablist button[aria-selected="true"] { opacity: 1; border-bottom-color: var(--up-primary); color: var(--up-primary); }

/* Toggle */
.up-w-toggle { border: 1px solid color-mix(in oklab, currentColor 18%, transparent); border-radius: 14px; padding: 16px 20px; }
.up-w-toggle summary { font-weight: 600; cursor: pointer; list-style: none; display: flex; justify-content: space-between; gap: 12px; }
.up-w-toggle summary::after { content: '+'; font-size: 1.3em; line-height: 1; color: var(--up-primary); }
.up-w-toggle[open] summary::after { content: '−'; }

/* Star rating */
.up-w-stars { position: relative; display: inline-block; font-size: 22px; letter-spacing: 2px; line-height: 1; color: color-mix(in oklab, currentColor 20%, transparent); }
.up-w-stars::before { content: '★★★★★'; }
.up-w-stars::after { content: '★★★★★'; position: absolute; left: 0; top: 0; overflow: hidden; width: var(--up-w, 100%); color: #f5b301; white-space: nowrap; }
${steps('data-up-stars', 5, 0.5, '--up-w', '%')}

/* Progress bar */
.up-w-progress .up-w-bar { height: 10px; border-radius: 999px; background: color-mix(in oklab, currentColor 12%, transparent); overflow: hidden; margin-top: 8px; }
.up-w-progress .up-w-bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--up-primary), var(--up-accent)); width: var(--up-w, 50%); }
${steps('data-up-value', 100, 5, '--up-w', '%').replace(/\[data-up-value="([\d.]+)"\]\{/g, '[data-up-value="$1"] .up-w-bar i{')}

/* Alert box */
.up-w-alert { display: flex; gap: 12px; align-items: flex-start; padding: 16px 20px; border-radius: 14px; border-left: 4px solid var(--up-primary); background: color-mix(in oklab, var(--up-primary) 9%, transparent); }
.up-w-alert[data-up-tone="success"] { border-color: #16a34a; background: color-mix(in oklab, #16a34a 10%, transparent); }
.up-w-alert[data-up-tone="warning"] { border-color: #d97706; background: color-mix(in oklab, #d97706 12%, transparent); }

/* Comparison table */
.up-w-table { width: 100%; border-collapse: collapse; }
.up-w-table th, .up-w-table td { padding: 14px 16px; border-bottom: 1px solid color-mix(in oklab, currentColor 14%, transparent); text-align: left; }
.up-w-table thead th { font-size: .95em; }
.up-w-table td:not(:first-child), .up-w-table th:not(:first-child) { text-align: center; }

/* Back to top */
.up-w-top { position: fixed; right: 20px; bottom: 20px; z-index: 40; width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; background: var(--up-primary); color: #fff !important; text-decoration: none; font-size: 22px; box-shadow: 0 10px 30px rgb(0 0 0 / .2); transition: opacity .25s, transform .25s; }
.up-w-top.is-hidden { opacity: 0; transform: translateY(12px); pointer-events: none; }

/* Table of contents */
.up-w-toc { padding: 20px 24px; border-radius: 14px; background: color-mix(in oklab, var(--up-primary) 6%, transparent); }
.up-w-toc ol { margin: 8px 0 0; padding-left: 20px; line-height: 1.9; }
.up-w-toc a { color: inherit; }

/* Share buttons */
.up-w-share { display: flex; flex-wrap: wrap; gap: 8px; }
.up-w-share a { padding: 9px 16px; border-radius: 999px; border: 1px solid color-mix(in oklab, currentColor 22%, transparent); color: inherit; text-decoration: none; font-weight: 600; font-size: 14px; }
.up-w-share a:hover { background: var(--up-primary); border-color: var(--up-primary); color: #fff; }

/* Background video */
.up-w-bgvideo { position: relative; overflow: hidden; isolation: isolate; }
.up-w-bgvideo > video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -2; }
.up-w-bgvideo::before { content: ''; position: absolute; inset: 0; z-index: -1; background: rgb(0 0 0 / var(--up-shade, .45)); }

/* Lightbox gallery */
.up-w-lightbox img { cursor: zoom-in; }
.up-w-lb { position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; background: rgb(0 0 0 / .88); padding: 24px; }
.up-w-lb img { max-width: 100%; max-height: 90vh; border-radius: 10px; }
.up-w-lb button { position: absolute; top: 16px; right: 16px; width: 44px; height: 44px; border-radius: 50%; border: 0; background: #fff; color: #111; font-size: 22px; cursor: pointer; }

/* Popup */
.up-w-popup { display: none; }
.up-w-popup.is-open { display: grid; position: fixed; inset: 0; z-index: 95; place-items: center; padding: 20px; background: rgb(0 0 0 / .55); }
.up-w-popup .up-w-popup__box { position: relative; width: min(560px, 100%); max-height: 90vh; overflow: auto; padding: 36px; border-radius: 22px; background: var(--background, #fff); color: var(--foreground, #111); box-shadow: 0 30px 80px rgb(0 0 0 / .35); }
.up-w-popup__close { position: absolute; top: 12px; right: 12px; width: 38px; height: 38px; border-radius: 50%; border: 0; background: color-mix(in oklab, currentColor 10%, transparent); color: inherit; font-size: 20px; cursor: pointer; }
@media (prefers-reduced-motion: no-preference) { .up-w-popup.is-open .up-w-popup__box { animation: up-zoom .25s ease both; } }

/* Countdown */
.up-w-countdown { display: flex; flex-wrap: wrap; gap: 12px; }
.up-w-countdown > div { min-width: 84px; padding: 16px 12px; border-radius: 16px; text-align: center; background: color-mix(in oklab, var(--up-primary) 9%, transparent); }
.up-w-countdown b { display: block; font-size: 40px; line-height: 1; font-variant-numeric: tabular-nums; }
.up-w-countdown span { display: block; margin-top: 6px; font-size: 13px; opacity: .7; }

/* Before and after */
.up-w-ba { position: relative; overflow: hidden; border-radius: 16px; --up-pos: 50%; user-select: none; }
.up-w-ba img { display: block; width: 100%; height: auto; }
.up-w-ba img + img { position: absolute; inset: 0; height: 100%; object-fit: cover; clip-path: inset(0 0 0 var(--up-pos)); }
.up-w-ba::after { content: ''; position: absolute; top: 0; bottom: 0; left: var(--up-pos); width: 3px; margin-left: -1.5px; background: #fff; box-shadow: 0 0 12px rgb(0 0 0 / .4); pointer-events: none; }
.up-w-ba input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: ew-resize; margin: 0; }

/* Search bar */
.up-w-search form { display: flex; gap: 8px; max-width: 560px; }
.up-w-search input { flex: 1; min-width: 0; padding: 14px 18px; border-radius: 999px; border: 1px solid color-mix(in oklab, currentColor 22%, transparent); background: transparent; color: inherit; font: inherit; }
.up-w-search button { padding: 14px 22px; border-radius: 999px; border: 0; background: var(--up-primary); color: #fff; font: inherit; font-weight: 600; cursor: pointer; }

/* Breadcrumbs */
.up-w-crumbs ol { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0; margin: 0; font-size: 14px; }
.up-w-crumbs li + li::before { content: '›'; margin-right: 8px; opacity: .5; }
.up-w-crumbs a { color: inherit; opacity: .75; text-decoration: none; }
.up-w-crumbs a:hover { opacity: 1; text-decoration: underline; }

/* Designed header menu on phones */
[data-up-widget="menu"] { display: none; }
@media (max-width: 860px) {
  [data-up-widget="menu"] { display: inline-flex; }
  .up-has-menu [data-up-menu] { display: none !important; }
  .up-has-menu.is-open [data-up-menu] { display: flex !important; flex-direction: column; align-items: flex-start; width: 100%; }
}
`

/** In the builder, hidden or animated widgets are shown as they will look, so they can be edited. */
export const WIDGET_CANVAS_CSS = `
.up-w-popup { display: block !important; position: relative; margin: 16px; padding: 12px; border: 2px dashed #b9b4cc; border-radius: 18px; }
.up-w-popup::before { content: 'Popup: shown when a visitor clicks a link to #popup-' attr(data-up-id) ' (or on its timer)'; display: block; font: 13px system-ui, sans-serif; color: #6e6a80; margin: 0 0 10px; }
.up-w-popup .up-w-popup__box { margin: 0 auto; }
.up-w-top { position: static; margin: 8px; }
.up-w-search:empty::after { content: 'Search bar: visitors search your site here'; display: block; padding: 14px 18px; border-radius: 999px; border: 1px dashed #b9b4cc; color: #6e6a80; font: 15px system-ui, sans-serif; }
.up-w-crumbs:empty::after { content: 'Home › Page title (filled in on the site)'; font: 14px system-ui, sans-serif; color: #6e6a80; }
.up-w-toc ol:empty::after { content: 'The page\\'s headings are listed here on the site.'; font: 14px system-ui, sans-serif; color: #6e6a80; }
.up-w-marquee .up-w-track { animation: none !important; }
`
