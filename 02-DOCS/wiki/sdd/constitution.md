---
type: constitution
title: ultimapress — Constitution
description: Non-negotiables for UltimaPress product work; ratified provisionally under the approved agent-support plan.
tags: [sdd, constitution]
timestamp: 2026-11-21T04:20:00Z
topic: sdd
status: provisional
version: v1.0.0
---

# ultimapress — Constitution

UltimaPress is a WordPress alternative built on Payload CMS 3 and Next.js: the owner asks for
features in plain English and the agent builds them into this one codebase. These rules are
inherited by every later phase; if a rule here is violated the work is wrong even when it runs.

Ratified provisionally on 2026-11-21 under the approved plan for native agent support; the
human confirmation is queued as `review-after`. Last amended: 2026-11-21.

## Principles

### Stack canon

1. **Payload CMS 3 + Next.js App Router + PostgreSQL, TypeScript, pnpm.** `package.json` pins
   `pnpm@10.28.0` and Node `^22.23.4 || >=24.22.1`; the lockfile (`pnpm-lock.yaml`) is committed
   and installs use pnpm, never npm or yarn.
2. **Every schema change ships a migration.** After adding or changing a field, collection or
   global, run `pnpm generate:types` and `pnpm payload migrate:create <short-name>`, and commit
   the new files under `src/migrations/`. Production applies them on start; a missing migration
   makes the live site error on the new field.
3. **Admin component paths regenerate the import map.** Anything referenced by a string path
   (for example `'@/components/...'`) requires `pnpm generate:importmap` before it works.

### Product conventions

4. **Access control on everything.** Collections and globals use the helpers in
   `src/access/roles.ts`. Public `create` exists only for visitor submissions (comments, form
   entries) and carries spam protection; public `update` or `delete` is never allowed.
5. **Feature toggles live in Site Settings > Features, off by default.** Optional features are
   read with `getSiteSettings()` and render nothing when off.
6. **Styling uses theme tokens, never hard-coded colours.** Use `var(--up-primary)`,
   `var(--up-accent)`, `var(--radius)`, `bg-card`/`border-border`/`text-muted-foreground` and the
   `.up-btn`/`.up-link`/`.up-heading` helpers so every feature works in all four templates.
7. **The Docker image builds without a database.** Any `generateStaticParams` returns `[]` when
   `process.env.UP_SKIP_STATIC === '1'`, and front-end settings reads go through
   `getSiteSettings()`.
8. **Front-end content changes revalidate.** Collections shown on the front end carry an
   `afterChange` hook calling `revalidatePath`/`revalidateTag` (see Pages and Posts).
9. **The Spine is driven by `admin.group`.** Every collection and global sets one of `Write`,
   `Media`, `Design`, `Grow`, `Build` or `Settings`; owner features go in `Your features`.
   Sidebar links are never added by hand.
10. **Owner-facing content added to the MCP surface is wired end to end.** A collection or global
    the owner should manage from a connected AI client is added to `mcpPlugin` in
    `src/plugins/index.ts`, to the operations in `src/endpoints/claudeConnect.ts` and, for a new
    tool, switched on in `src/mcp/tools.ts`, with generated types and a migration.

### Security floor

11. **Never trust visitor input.** Validate type and length on the server; escape anything shown
    as HTML; never pass visitor input to `dangerouslySetInnerHTML` without `cleanDesignHtml` or
    another sanitizer.
12. **Database access goes through Payload's `find`/`create`/`update`/`delete`.** SQL is never
    built by joining text; `sql.raw` is only for fixed names.
13. **Every endpoint checks the caller first.** Each handler reads `req.user` and uses `hasRole`
    at the top and returns 403 otherwise; public endpoints (forms, bookings) additionally need
    Turnstile or the honeypot, rate limits and validation.
14. **Secrets stay server-side.** API keys, passwords and tokens live in Private Settings or
    environment variables, are read only on the server, and are never named `NEXT_PUBLIC_*` or
    written into code, prompts or committed files.
15. **No dynamic code or shell execution.** No `eval`, `new Function`, or shell commands built
    from text; use `execFile` with fixed arguments; never disable certificate checks; keep
    Payload's upload restrictions (`allowRestrictedFileTypes` stays off).
16. **Random secrets come from `crypto.randomBytes` or `crypto.randomUUID`, never `Math.random`.**
17. **The security check is a merge gate.** `node docker/security-check.mjs` reports no unfixed
    critical problem or warning; a `// up-security: <reason>` exemption is used only when the
    stated reason is true.

### Delivery

18. **Nothing is live until the owner confirms.** `pnpm ship` only sends the folder; the owner
    confirms in Site code with their password. The agent never asks for, stores or sends the
    owner's admin password, and never commits `.ultimapress-deploy.json`.
19. **The WordPress importer keeps working.** Changes to Posts, Pages, Categories, Tags or
    Comments preserve `src/importer/wordpress.ts` and the `/api/wp-import` flow.

### Fixed project principles

20. **Git authorship is the human's.** Commits and PRs are authored by the configured git user;
    no `Co-Authored-By` for an AI and no "generated with" footer.
21. **Decisions are logged.** Every significant decision is appended to
    `02-DOCS/wiki/sdd/decisions.md` with date, options and why; this constitution is the
    highest-order decision record.

## Definition of Done (the merge bar `verify` runs against)

- [ ] Every spec acceptance criterion has an observable check and recorded evidence.
- [ ] `pnpm exec tsc --noEmit` passes.
- [ ] `pnpm run lint` passes (or the diff introduces no new lint error).
- [ ] `pnpm run test:int` passes; new behaviour on an uncertain edge has a deterministic test.
- [ ] `node docker/security-check.mjs` reports no unfixed critical problem or warning.
- [ ] Schema changes come with generated types and a committed migration; admin paths with a
      regenerated import map.
- [ ] Access rules were reviewed as an attacker would: who can call it, what it returns.
- [ ] No secret, key or owner password appears in code, docs, prompts, logs, dialogs or the ZIP.
- [ ] User-facing copy names agents by capability, not by requiring one vendor.
- [ ] Docs and changelog updated where the owner-visible behaviour changed.
- [ ] Commits carry human authorship only.

## Amendment log (append-only)

| Date | Version | Change | Why |
|------|---------|--------|-----|
| 2026-11-21 | draft | Draft generated by `rsc onboard`. | The SDD floor needs a constitution; ratification is the `constitution` phase's. |
| 2026-11-21 | v1.0.0 | Filled all principles, security floor, delivery rules and the Definition of Done; status `provisional`. | Approved agent-support plan requires a ratified base before product changes; human confirmation queued. |
