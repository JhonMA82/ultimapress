<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# UltimaPress: project instructions

UltimaPress is a WordPress alternative built on Payload CMS 3 and Next.js. The site owner asks
you to add features in plain English. Build them directly into this codebase, the way WordPress
users would install a plugin, but cleaner: no plugin layer, one codebase.

Read this file first, whatever coding agent you are. Then read the Payload guide at
`.agents/skills/payload/guide.md` and its references under `.agents/skills/payload/reference/`
(links in the guide are relative to it). Claude Code can also load the `payload` skill from
`.claude/skills/payload/SKILL.md`.

## Opening this folder

Open the folder in any agent that can read Markdown and run commands: Oh My Pi (`omp`), OpenCode
V2 (`opencode`), Pi Agent (`pi`), Claude Code (`claude`), or another editor/agent. In the
terminal of this folder, launch the client you use. Pi asks you to review and accept project
trust the first time; accept it so the skill loads. An agent without a skill loader still works:
ask it to read `AGENTS.md` and the Payload guide directly.

## Map of the project

| Where | What |
| --- | --- |
| `src/payload.config.ts` | Registers every collection, global, plugin, endpoint, admin branding, email |
| `src/collections/` | Pages, Posts, Media, Categories, Tags, Comments, Users |
| `src/globals/SiteSettings.ts` | General, Design, Reading, Features, Maintenance, Privacy settings |
| `src/Header/`, `src/Footer/` | Menus (globals) and their front-end components |
| `src/blocks/` | Page builder blocks. Each has `config.ts` (fields) and `Component.tsx` (front end) |
| `src/blocks/RenderBlocks.tsx` | Maps block slugs to components |
| `src/heros/` | Page hero variants |
| `src/access/roles.ts` | Roles (admin, editor, author) and access helpers |
| `src/importer/wordpress.ts` | WordPress (WXR) importer |
| `src/endpoints/wordpressImport.ts` | `/api/wp-import` and `/api/site-export` |
| `src/proxy.ts` | Site-wide redirects (including imported WordPress URLs) |
| `src/plugins/index.ts` (mcpPlugin) | "Connect AI Client": what a connected AI can read and change |
| `src/mcp/tools.ts` | Extra tools for connected AI clients (writePost, writePage, addImage) and their instructions |
| `src/endpoints/siteRefresh.ts` | Refreshes the public site after every change a connected AI client makes (all collections and globals) |
| `src/endpoints/claudeConnect.ts` | One-click connection from the dashboard |
| `src/components/admin/Spine/` | The Spine: the admin menu (replaces Payload's Nav) |
| `src/components/admin/BuildFeature/` | The "Build a feature" admin page (`/admin/build-a-feature`) |
| `src/components/admin/SiteCode/` | The "Site code" admin page (`/admin/site-code`): download the code, upload a new version, go back |
| `src/components/admin/VisualBuilder/` | The visual builder (`/admin/visual-builder?page=<id>`, button on every page): drag and drop on designed sections. Its styles are saved after `/* up-visual-builder */` in a section's CSS (`src/utilities/builderCss.ts`) |
| `src/components/Widgets/` | Builder widgets on the site: shared CSS (`styles.ts`) and the small script that runs sliders, tabs, popups, countdowns and more (`runtime.ts`), loaded only on pages that use them |
| `src/collections/SyncedSections.ts`, `src/blocks/LoopGrid/` | Synced sections (one section on many pages) and the content grid block |
| `src/components/admin/StarterKits/` | Starter kits (`/admin/starter-kits`): designed pages and a look in one click |
| `src/components/Seo/`, `src/fields/seoExtras.ts`, `src/app/(frontend)/llms.txt/` | Structured data (business, website, article, breadcrumbs), per-page SEO fields and live SEO check, llms.txt |
| `src/endpoints/visitors.ts`, `src/analytics/`, `src/components/Visitors/` | Built-in cookieless analytics (`/admin/analytics`), 404 log, cookie banner, optional GA4/GTM/Pixel/Plausible, code snippets, announcement bar |
| `src/security/` | Two-factor login (TOTP), activity log plugin, Cloudflare Turnstile on forms and comments |
| `src/globals/PrivateSettings.ts`, `src/email/adapter.ts` | Admin-only settings with secrets: SMTP (email follows these, logged in Email log), Turnstile keys, backup options |
| `src/siteBackups/`, `src/endpoints/backups.ts` | Daily backups (database + media) on the data volume, optional S3-compatible copy, restore (`/admin/backups`) |
| `src/components/admin/SiteHealth/`, `src/components/admin/PersonalData/` | Site health page and GDPR export/delete |
| `src/instrumentation.ts` | On server start: runs queued jobs (scheduled publishing) every minute and the backup check every 10 minutes, through the site's own API |
| `docker/security-check.mjs`, `src/endpoints/security.ts`, `src/components/admin/Security/` | The security check: runs before `pnpm ship`, on the server before every update (critical problems stop it going live), daily, and from Settings > Security. The optional Deep check add-on (Opengrep with `docker/deep-check-rules.yaml`) is installed and run by `docker/supervisor.mjs`; the optional Scan my site add-on (ZAP and Nuclei, scans only the site's own address) is `docker/site-scan.mjs` |
| `src/endpoints/siteCode.ts`, `src/siteCode/` | `/api/site-code/*`: admin only, password asked again for anything that changes the live site |
| `docker/supervisor.mjs` | Runs the site in Docker and replaces its code safely (backup, build, check, switch, roll back) |
| `docker/upgrade.mjs` | **Update UltimaPress** in Site code: brings a site's own features over to a new UltimaPress (three-way merge), then the usual steps |
| `scripts/ship.mjs` | `pnpm ship`: sends this folder to the owner's site, where it waits for their password |
| `src/app/(frontend)/` | Public website routes |
| `src/app/(frontend)/globals.css` | Theme tokens and the four templates (`html[data-template=...]`) |
| `src/utilities/getSiteSettings.ts` | Read settings on the front end (cached, with safe defaults) |
| `src/migrations/` | Database migrations. Run automatically when the production app starts |

## Rules that keep the site working

1. **Every schema change needs a migration.** After adding or changing a field, collection
   or global, run:
   ```
   pnpm generate:types
   pnpm payload migrate:create <short-name>
   ```
   Commit the new files in `src/migrations/`. Production applies them on start. Without a
   migration the live site will error on the new field.
2. **After adding admin components** (anything referenced by a string path such as
   `'@/components/...'`), run `pnpm generate:importmap`.
3. **Access control on everything.** Use the helpers in `src/access/roles.ts`. Public
   create access is only for things like comments and form submissions, and those need
   spam protection (see the honeypot in `src/collections/Comments.ts`).
4. **Feature toggles live in Site Settings > Features.** Optional features are off by
   default; read them with `getSiteSettings()` and render nothing when off.
5. **Styling uses theme tokens**, never hard-coded colours: `var(--up-primary)`,
   `var(--up-accent)`, `var(--radius)`, Tailwind classes like `bg-card`, `border-border`,
   `text-muted-foreground`, and the helpers `.up-btn`, `.up-link`, `.up-heading`. That way
   every feature works in all four templates and with the owner's colours.
6. **The Docker image builds without a database.** Any `generateStaticParams` must return
   `[]` when `process.env.UP_SKIP_STATIC === '1'`, and front-end code that reads settings
   should go through `getSiteSettings()`.
7. **Revalidate after changes.** Collections that appear on the front end need an
   `afterChange` hook calling `revalidatePath` / `revalidateTag` (see Pages and Posts).
8. Run `npx tsc --noEmit` before finishing. Keep the WordPress importer working if you
   touch Posts, Pages, Categories, Tags or Comments.
9. **The Spine (admin menu) is driven by `admin.group`.** Give every collection and global
   one of these groups: `'Write'` (content), `'Media'`, `'Design'` (look, menus), `'Grow'`
   (visitors, forms, SEO), `'Build'` (AI tools) or `'Settings'` (behind the gear). A new
   feature's own collections go in `'Your features'` (any other group lands there too).
   Never add sidebar links by hand.

10. When you add a collection or global that site owners would want a connected AI client to
   manage, add it to `mcpPlugin` in `src/plugins/index.ts` and to the operations in
   `src/endpoints/claudeConnect.ts`, then generate types and a migration. A new tool in
   `src/mcp/tools.ts` also needs switching on in `claudeConnect.ts`, plus types and a migration.

## Security (read before writing any feature)

The site checks every new version with `docker/security-check.mjs`. A critical problem stops
the update from going live, so write features that pass it, and that are actually safe:

- **Never trust visitor input.** Validate type and length on the server. Escape anything shown
  as HTML (React does this for normal text; never put visitor input in `dangerouslySetInnerHTML`
  without `cleanDesignHtml` or another sanitizer).
- **Database:** use Payload's `find`, `create`, `update`, `delete`. Never build SQL by joining
  text; `sql.raw` only for fixed names, never for values.
- **Every endpoint checks who is calling** at the top of its handler (`req.user` and `hasRole`),
  and returns 403 otherwise. Public endpoints (visitor forms, bookings) need Turnstile or the
  honeypot, rate limits and validation.
- **Access rules:** `update` and `delete` are never open to everyone. Public `create` is only for
  visitor submissions, with spam protection.
- **Secrets** (API keys, passwords, tokens) go in Private Settings or environment variables, are
  read on the server only, and are never written into the code or named `NEXT_PUBLIC_...`.
- **No** `eval`, `new Function`, or shell commands built from text. Use `execFile` with fixed
  arguments. Never switch off certificate checks.
- **Uploads:** keep Payload's default file-type restrictions; never set `allowRestrictedFileTypes`.
- **Random secrets** come from `crypto.randomBytes` or `crypto.randomUUID`, never `Math.random`.

Code that is safe for a reason the check cannot see may say so on the line, or the line above,
with `// up-security: <the real reason>`. Owners see every reason on the Security page, so only
use it when it is true, never to get past the check.

Before shipping, review your own changes as an attacker would: who can call this, what happens
with malicious input, what does it expose to someone not logged in. Then run
`node docker/security-check.mjs` and fix every critical problem and warning it reports.

## Putting changes live

When the owner says "put it live" (or "ship it", "publish my changes"):

1. Run `npx tsc --noEmit` and `node docker/security-check.mjs`, and fix anything they report.
   A version that does not build, or has a critical security problem, is refused by the site.
2. Run `pnpm ship` (or `node scripts/ship.mjs`). It packs this folder and sends it to their
   site, where it waits for the owner. If it says no site is set up, ask the owner to open
   **Build > Site code** in their admin, create a deploy key, and run the line it shows once
   in the terminal of this folder themselves. The key works like a password: never ask the
   owner to paste it into the conversation, and never commit `.ultimapress-deploy.json`.
   After that, `pnpm ship` works from the saved file.
3. Tell the owner to open **Site code** in their admin and confirm with their password.
   Nothing is live until they do. The site backs up their content, builds the new version
   and switches to it only if it starts.

If the owner gives you code downloaded from **Site code** after an UltimaPress update that
"needs attention", some files contain both versions between `<<<<<<< your site` and `>>>>>>>`
markers. Combine them so the owner's features work with the new UltimaPress, remove every
marker (search the whole folder), run the type and security checks, then put it live.

If the Site code page shows that an update did not go live, ask the owner for the text under
"What happened", fix the cause and ship again. Never ask for, store or send the owner's
admin password.

## Recipes

**Add a page builder block**
1. `src/blocks/<Name>/config.ts` with a `Block` (`slug`, `interfaceName`, `fields`).
2. `src/blocks/<Name>/Component.tsx`, typed with the generated interface from
   `@/payload-types`. Wrap content in `<section className="container">`.
3. Add it to the `blocks` array in `src/collections/Pages/index.ts` and to
   `blockComponents` in `src/blocks/RenderBlocks.tsx`.
4. Generate types and a migration.

**Add a new content type** (events, team members, services, listings…)
1. New collection in `src/collections/`, add to `collections` in `payload.config.ts`.
2. Front-end routes in `src/app/(frontend)/<name>/` (list page and `[slug]` page).
3. Access with the role helpers, an `admin.group` (see rule 9), drafts if it is
   public content.
4. Add it to the sitemap and search if visitors should find it.
5. Generate types and a migration.

**Add a setting** to `src/globals/SiteSettings.ts` (pick the right tab), add a default in
`src/utilities/getSiteSettings.ts`, then generate types and a migration.

**Send email** with `req.payload.sendEmail({ to, subject, html })`. It uses the SMTP
settings in `.env` (or logs to the console when none are set).

## Commands

```
pnpm dev                 # local development (needs DATABASE_URL to a Postgres)
pnpm generate:types      # after any schema change
pnpm payload migrate:create <name>
pnpm generate:importmap  # after adding admin components
npx tsc --noEmit         # type check
node docker/security-check.mjs  # security check (also runs in pnpm ship and on the server)
pnpm ship                # send this folder to the owner's site (they confirm in Site code)
./update.sh               # on the server (sites installed from the files): back up, then rebuild
```
