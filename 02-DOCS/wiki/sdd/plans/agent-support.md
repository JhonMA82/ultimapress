---
type: plan
title: Agent support — technical plan
description: How the portable context, shared code-flow copy, repair copy and native MCP picker are built and proven.
tags: [sdd, plan, agents, mcp]
timestamp: 2026-11-21T04:40:00Z
topic: sdd
status: ready
slug: agent-support
spec: 02-DOCS/wiki/sdd/specs/agent-support.md
---

# Plan — agent support

## 0. Global constraints

Every task inherits these verbatim. Do not paraphrase them in code or copy.

- Starter prompt: `Read AGENTS.md first. Then add to my UltimaPress site: `.
- Agent launchers in the shared step: `claude`, `omp`, `opencode` (V2), `pi`.
- Anchor that Spine and README link to: `#build-with-claude` (unchanged).
- Connection response contract: `{ url: string, claudeCode: string, https: boolean }`.
- Native client ids: `'omp' | 'opencode' | 'pi'`; selector values: `''` (generic), `claude`,
  `chatgpt`, `claude-code`, `omp`, `opencode`, `pi`. Labels: `Any MCP-compatible client`,
  `Claude`, `ChatGPT`, `Claude Code`, `Oh My Pi`, `OpenCode V2`, `Pi Agent`.
- Helper parse result:
  `{ ok: true; endpoint: string; key: string } | { ok: false; reason: 'invalid' | 'https-required' }`.
- Parse failures render exactly:
  - `invalid`: `The connection could not be read. Reload the dashboard and create a new connection.`
  - `https-required`: `Use HTTPS to connect an AI client to a remote site.`
- Endpoint: `new URL(url)` with `username`/`password` empty, pathname ending `/api/mcp`, `key`
  non-empty; drop `search` and `hash`; HTTPS always, HTTP only for `localhost`, `127.0.0.1`,
  `[::1]`.
- Env var: `ULTIMAPRESS_MCP_KEY`. Shell line, exact:
  `read -rsp 'UltimaPress MCP key: ' ULTIMAPRESS_MCP_KEY; export ULTIMAPRESS_MCP_KEY; printf '\n'`
- Config shapes (pretty JSON, `JSON.stringify(value, null, 2)`):
  - OMP — `~/.omp/agent/mcp.json` (or `~/.omp/profiles/<profile>/agent/mcp.json`), container
    `mcpServers`, entry `ultimapress`:
    `{"type":"http","url":"<endpoint>","headers":{"Authorization":"Bearer ${ULTIMAPRESS_MCP_KEY}"}}`
  - OpenCode V2 — `~/.config/opencode/opencode.json` or the existing `.jsonc`, container
    `mcp.servers`, entry `ultimapress`:
    `{"type":"remote","url":"<endpoint>","oauth":false,"headers":{"Authorization":"Bearer {env:ULTIMAPRESS_MCP_KEY}"}}`
  - Pi — `~/.pi/agent/mcp.json`, container `mcpServers`, entry `ultimapress`:
    `{"url":"<endpoint>","headers":{"Authorization":"Bearer ${ULTIMAPRESS_MCP_KEY}"}}`
- Repair labels: `Copy repair prompt`; fallback prompt text `Copy the repair prompt:`; conflict
  heading `This update needs attention`; dashboard `Update needs attention: open Site code`;
  staged update `An update is waiting`; action `Put the update live`.
- Neutral repair prompt first line: `Read AGENTS.md first.`; validation commands unchanged:
  `npx tsc --noEmit`, `node docker/security-check.mjs`.
- Wire names `forClaude` / `needsClaude` stay; only display text changes.
- No symlinks in `.agents`/`.claude`; no new packager filter; no `.gitignore` dependency.

## 1. Context & constraints

- Spec `§What the user can do`, `§Behaviour 1–4`, AC1–AC2 fix the context layer. Constitution
  principles 1–3 (Payload/Next, migrations, import map) and 18–19 (owner confirmation, importer)
  bound the copy.
- `AGENTS.md` today is only the block Next writes (`<!-- BEGIN:nextjs-agent-rules -->` … `END`).
  Next 16.4.6 preserves text outside the markers; the generated block must survive both a
  regeneration and a conflict merge.
- ZIP/TGZ keep normal hidden directories; `docker/supervisor.mjs` strips **all** symlinks on
  import and `mergeSites` omits symlinks. So the skill must be real files.
- `src/plugins/index.ts` already accepts `?key=` and Bearer and associates the key to the user;
  no credential logic changes. `src/endpoints/claudeConnect.ts` remains the only key issuer.
- Project lane says code changes land straight on `main`; no worktree/branch. Recorded in
  `decisions.md`, deviating from `plan`'s default isolation proposal.

## 2. Architecture

```text
                 ┌──────────────────────────────────────────────┐
  ZIP / folder ──► AGENTS.md (product rules)                     │
                 │ CLAUDE.md  → @AGENTS.md                       │
                 │ .agents/skills/payload/{SKILL,guide,reference}│
                 │ .claude/skills/payload/SKILL.md (same bytes)  │
                 └──────────────────────────────────────────────┘
                                   ▲ read by
     ┌─────────────┬───────────────┴───────────────┬─────────────┐
   OMP          OpenCode V2                       Pi        Claude / any editor
   skill auto   .agents skill + native MCP        .agents    .claude skill + import

  Dashboard (BuildWithAI)
    ├─ tab Content & design: <select AI client> → connect() → conn
    │     legacy views (Claude / ChatGPT / Claude Code): conn.url / conn.claudeCode
    │     native views (OMP / OpenCode / Pi): parseMcpConnection(conn.url)
    │        → nativeMcpConfig(id, endpoint) + Copy connection key + env command
    │     generic view: endpoint + Copy MCP URL + Authorization instruction
    └─ tab New features: BUILD_FEATURE_STARTER + CodingAgentSetup

  Repair/delivery copy (no logic):
    SiteCodeClient · UpdateButton · BuildFeatureGuide · Security Report · SiteHealth
    docker/supervisor.mjs · docker/upgrade.mjs · src/endpoints/siteCode.ts · src/mcp/tools.ts
```

**One decision that matters:** keep the server untouched and make the browser derive every native
config from the single credential-bearing `url` already returned. It reuses the audited key
issuer, keeps one code path for revocation, and guarantees the key never enters a copied template.
Trade-off: the client must support an env-var reference in a header; where it does not, the UI
falls back to "load the secret into the process environment", never to pasting the key.

Components, single responsibility:

1. **Context layer** (files) — one product instruction source, two discovery entry points.
2. **`nativeMcpSetup.ts`** — pure parsing and serialization; no React, no browser APIs.
3. **`CodingAgentSetup.tsx`** — the shared "open the folder / launch an agent" step and the
   starter constant, no props.
4. **`BuildWithAI.tsx`** — state machine `idle → connecting → connected`, selector, per-client
   views, clipboard fallback.
5. **Copy surfaces** — strings only; no branching changes.

## 3. Interfaces & contracts

```ts
// src/components/BeforeDashboard/nativeMcpSetup.ts
export type McpParse =
  | { ok: true; endpoint: string; key: string }
  | { ok: false; reason: 'invalid' | 'https-required' }
export function parseMcpConnection(url: string): McpParse
export function nativeMcpConfig(client: 'omp' | 'opencode' | 'pi', endpoint: string): string

// src/components/admin/CodingAgentSetup.tsx
export const BUILD_FEATURE_STARTER = 'Read AGENTS.md first. Then add to my UltimaPress site: '
export function CodingAgentSetup(): React.ReactElement

// src/components/BeforeDashboard/BuildWithAI.tsx (renamed)
export function BuildWithAI({ connections }: { connections: number }): React.ReactElement
```

- `parseMcpConnection` never throws; every failure maps to a reason.
- `nativeMcpConfig` assumes a validated endpoint; it does not re-parse or accept the raw URL.
- `BuildWithAI` calls `fetch('/api/claude-connect', { method: 'POST', credentials: 'include' })`
  exactly once per click; `select` is local state only.
- `CopyField` contract: `onClick` attempts `navigator.clipboard.writeText`; on throw uses the
  textarea/`execCommand` fallback; only a resolved attempt sets `Copied`. If both fail, set
  `manual` and render a readonly input with the value selected.
- `SiteCodeClient` keeps `Job.security.forClaude` / `Job.upgrade.forClaude` untouched; labels and
  the `details` summary change only.

## 4. Data model & flow

No schema change, no migration, no import map entry (no new admin component path — `BuildWithAI`
keeps its existing import). Flow:

1. `Connect AI Client` → POST → `{ url, claudeCode, https }` (key exists only in memory).
2. `parseMcpConnection(conn.url)` → `{ endpoint, key }`; `endpoint` is origin + `/api/mcp`.
3. `nativeMcpConfig(id, endpoint)` → file skeleton with the env-var literal; `key` is copied only
   by an explicit `Copy connection key` click.
4. Deploy flow unchanged: `pnpm ship` → `POST /api/site-code/upload` with `x-up-deploy-key` →
   staged → owner password → `supervisor('/deploy')`.
5. Repair flow unchanged: conflict/security job → `job.*.forClaude` text → clipboard.

## 5. Testing strategy

| AC | Level | Check |
| --- | --- | --- |
| AC1 | e2e (real agents) | OMP/OpenCode/Pi on a ZIP copy without `.claude`, prompt asks for the migration rule and `ACCESS-CONTROL.md`; output recorded |
| AC2 | artifact | `unzip -l "$SITE_ZIP"` assertion (exact paths, no deploy key) |
| AC3 | browser e2e | Playwright/manual keyboard run: select OMP → OpenCode → Pi; network log shows 1 POST; reload shows generic |
| AC4 | unit | `nativeMcpSetup.int.spec.ts`: three configs parsed, hierarchy, transport, literal var, `oauth:false` only V2, no `up_fixture`, no `?key=`; mutation test rejects raw key and `mcp.<name>` |
| AC5 | unit + browser | helper cases; UI messages after forcing invalid/remote-HTTP response |
| AC6 | browser | generic view text and `<details>` behaviour |
| AC7 | unit (component) or browser | clipboard stub rejecting both paths → manual field only after click |
| AC8 | browser | three screens render starter and four launchers; grep of visible text |
| AC9 | unit + browser | `conflictsForClaude` output first line/markers; Site code label and prompt |
| AC10 | e2e Docker | marker file 404 before confirm, 200 after; `An update is waiting` |
| AC11 | e2e MCP | real `writePost`/`writePage`/revoke with Author key |
| AC12 | e2e | MCP Inspector tools/list |
| AC13 | commands | vitest, tsc, lint |
| AC14 | grep + review | no UI/repair prompt requires Claude; wire names allowed |

Unit tests live in `tests/int/native-mcp-setup.int.spec.ts` (`@vitest-environment node`), following
the existing `security-check.int.spec.ts` style. Browser/e2e evidence goes to the verification file
with redacted screenshots; no new Playwright suite is added unless the manual run exposes a
regression the unit level cannot catch.

Mutation proof: after the suite is green, temporarily change OpenCode output to
`mcp.ultimapress` and to include `url` with `?key=...`; the test must fail; restore.

## 6. Sequencing & dependencies

1. Context layer (docs/skills) — independent.
2. Helper + its failing test — independent of the UI.
3. Shared copy component — depends on nothing.
4. Copy surfaces consume (3) — after it exists.
5. BuildWithAI consumes (2) and (3) — after both.
6. Verification runs in order: unit/type/lint → Docker smoke + ZIP → agents → MCP → delivery/conflict.

Parallel-safe: context layer and helper/test share no files. Copy surfaces and BuildWithAI both
touch `BuildWithAI/Guide`? No: copy surfaces touch `Guide.client.tsx`, `SiteCode`, `Spine`,
`Security`, `SiteHealth`, docker, endpoints; BuildWithAI touches `BuildWithAI.tsx` and
`BeforeDashboard/index.tsx`. They share no files, but both depend on the shared component; after
that they are parallel-safe.

## 7. Risks & open decisions

| # | Risk | Trigger | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Next regenerates `AGENTS.md` and drops product rules | `next dev` runs with its agent-file writer | Context lost for every agent | Keep rules outside the markers (Next preserves them); verify with a dev run; commit the regenerated block if it changes |
| R2 | `.claude/skills/payload/reference` moved breaks an existing link | A doc or skill link uses the old path | Claude readers lose a reference | Move the directory, keep `SKILL.md` identical, grep for the old path; AC2 checks the ZIP |
| R3 | Tarball/zip drops dot-directories | `scripts/ship.mjs` or supervisor zip filters | Agents never see `.agents` | Verify `unzip -l` on the official download and the conflict ZIP before declaring done |
| R4 | Browser clipboard blocked (non-secure context, permissions) | Local HTTP smoke | "Copied" lies or key unusable | CopyField checks success and exposes a readonly field; AC7 |
| R5 | OpenCode V2 config lives under `mcp.servers` but installed binary is V1 | Old binary on the machine | False negative in smoke | Record `opencode --version`; use V2 for the E2E; never claim V1 support |
| R6 | Pi without integrated MCP | Old Pi or `pi-mcp-adapter` | Native config ignored | Record `pi --version`; use ≥0.99.0; otherwise record pending, do not claim validated |
| R7 | Remote HTTP endpoint accepted | Parser allows `http://` for any host | Key sent in clear | Unit test `https-required` for remote HTTP; loopback only |
| R8 | Conflicted `AGENTS.md` loses the Next block or product rules | Merge prompt too vague | Site breaks agent guidance after update | Explicit prompt instruction; conflict fixture includes `AGENTS.md` |
| R9 | Tier-2 docs (`CLAUDE.md`) merge without human | Local main workflow | Policy breach | Human approval + three-refuter panel recorded; no publish in this run |
| R10 | Docker build/smoke unavailable | No Docker daemon or ports busy | Unverified end-to-end | Record exact failure; keep unit/proof level; never declare compatibility validated |

Open decisions are in the spec's `## Clarifications` and the progress decision queue; none is
blocking.

## Tasks

<!-- generated by tasks on 2026-11-21; IDs are stable, do not renumber -->

| ID | [P] | Task | Done-check | Depends-on | Trace | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| T001 | [P] | Move product rules to `AGENTS.md`, reduce `CLAUDE.md` to `@AGENTS.md`, move the payload skill to `.agents` and mirror the entry in `.claude` | `AGENTS.md` keeps both Next markers and contains the migration rule; `diff .agents/skills/payload/SKILL.md .claude/skills/payload/SKILL.md` empty; `rg -n "skills/payload/reference" CLAUDE.md AGENTS.md` empty; `test -f .agents/skills/payload/guide.md` | — | AC1, AC2 | 2 |
| T002 | [P] | Write the failing `parseMcpConnection` / `nativeMcpConfig` test | `pnpm exec vitest run --config ./vitest.config.mts tests/int/native-mcp-setup.int.spec.ts` fails because the module does not exist | — | AC4, AC5 | 1 |
| T003 |  | Implement `nativeMcpSetup.ts` until T002 is green | T002 command green; manual mutation (raw key or `mcp.<name>`) makes it red; restore | T002 | AC4, AC5 | 1 |
| T004 | [P] | Add `CodingAgentSetup.tsx` with `BUILD_FEATURE_STARTER` | `pnpm exec tsc --noEmit` passes; component renders the four launchers and the starter without props | — | AC8 | 1 |
| T005 |  | Rewire the three code-flow screens to `CodingAgentSetup` and neutral delivery copy | `rg -n "Read CLAUDE.md first" src` and `rg -n "BuildWithClaude" src` empty; `rg -n "<CodingAgentSetup" src/components` returns exactly 3 usages; `pnpm exec tsc --noEmit` passes | T004 | AC8 | 1 |
| T006 | [P] | Neutralize repair/delivery copy across Site code, UpdateButton, Security, SiteHealth, supervisor, upgrade, `siteCode.ts`, `mcp/tools.ts` and the three README labels | `rg -n "Copy for Claude|needs Claude|Sent by Claude|Claude sent|Put the update from Claude live|Change it with Claude|Let Claude put it live|Ask Claude|ask Claude|tell Claude|Give it to Claude" src/components src/endpoints/siteCode.ts src/mcp/tools.ts docker` empty; `rg -n "Copy for Claude|Claude sent|needs Claude|Sent by Claude" README.md` empty; conflict prompt starts `Read AGENTS.md first.`; `pnpm exec tsc --noEmit` passes | — | AC9, AC14 | 1 |
| T007 |  | Rename `BuildWithClaude` to `BuildWithAI` (drop `repoUrl`), add the client selector and native/generic views | `rg -n "BuildWithClaude" src` empty; one POST per click in the browser run; `nativeMcpConfig` output contains no key; `pnpm exec tsc --noEmit` | T003, T004 | AC3, AC6, AC7 | 1 |
| T008 |  | Run the baseline at HEAD and then `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run test:int`, `node docker/security-check.mjs`; record results | each command exits 0; if HEAD already failed, the failing set is identical before and after (same files, same rules) and recorded | T001–T007 | AC13 | 0 |
| T009 |  | Build the disposable Docker site and download the official ZIP | `docker compose … up -d --build --wait` shows healthy; `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:18080/admin` = 200; `unzip -l` matches AC2; no `.ultimapress-deploy.json` | T008 | AC2, AC3 | 0 |
| T010 |  | Run OMP, OpenCode V2, Pi and Claude on the extracted ZIP, then repeat OMP/OpenCode/Pi without `.claude`/`CLAUDE.md` | each agent cites the migration rule and finds `reference/ACCESS-CONTROL.md` via `payload`; versions recorded; second copy still works | T009 | AC1 | 0 |
| T011 |  | Run the MCP E2E with per-client disposable configs, roles, revocation and Inspector | `writePost` returns `Saved as a draft` with the client suffix; `writePage` denied and no doc; revoked key rejected; Inspector lists tools | T009 | AC11, AC12 | 0 |
| T012 |  | Prove delivery and conflict recovery | `pnpm ship` → `An update is waiting`; marker 404 then 200 after password; `mergeSites` fixture conflict shows skills and a prompt starting `Read AGENTS.md first.`; `Copy repair prompt` visible | T009 | AC9, AC10 | 0 |
| T013 |  | Close: verify closing + review panel + progress/verification records | `02-DOCS/wiki/sdd/verifications/agent-support-2026-11-21.md` lists every AC with evidence; tier-2 panel recorded; decision queue updated | all | all ACs | 2 |

**T006 — Interfaces** — consumes nothing at runtime; produces only strings. Keep
`job.security.forClaude` and `job.upgrade.forClaude` field names and payload text.

**T007 — Interfaces** — consumes `parseMcpConnection(conn.url)` and
`nativeMcpConfig(id, endpoint)` from T003, and `BUILD_FEATURE_STARTER` from T004. Produces
`BuildWithAI({ connections: number })`, imported by `src/components/BeforeDashboard/index.tsx`.

## Review workload forecast

| Dimension | Forecast | Why |
| --- | --- | --- |
| Changed lines | ~900–1300 | 3 new/renamed components, 1 helper, 1 test, ~10 copy surfaces, two docs |
| Files / areas | ~18 | `AGENTS.md`, `CLAUDE.md`, `.agents`, `.claude`, dashboard, admin Build/SiteCode/Spine/Security/SiteHealth, docker, endpoints, mcp, README |
| Risk | max tier 2 (T001, T013); rest tier 1 | `CLAUDE.md` is classified harness by `rsc risk`; product docs need the three-refuter panel and a human yes |
| Suggested delivery | ask-on-risk / no publish | Tier-2 docs; the plan forbids publishing and touching the image workflow |
