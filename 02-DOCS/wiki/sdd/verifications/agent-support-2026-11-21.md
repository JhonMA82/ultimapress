---
type: verification
title: Agent support — verification record
description: Evidence for the portable context, repair copy and native MCP picker.
tags: [sdd, verification, agents, mcp]
timestamp: 2026-11-21T05:35:00Z
topic: sdd
slug: agent-support
---

# Verification — agent support

Spec: `02-DOCS/wiki/sdd/specs/agent-support.md`. Plan:
`02-DOCS/wiki/sdd/plans/agent-support.md`. Date: 2026-11-21.

## Environment

| Item | Value |
| --- | --- |
| Node used for the app | v22.23.4 (mise); the session default is v26.13.1, outside the tested Next path |
| pnpm | 10.28.0 |
| OMP | 19.0.1 |
| OpenCode | 2.3.2 (V2) |
| Pi | 1.6.0 (integrated MCP) |
| Claude Code | not installed in this environment |
| Docker | daemon inactive; `sudo -n systemctl start docker` requires a password |
| Browser | omp headless WebKit (admin hydration blank); managed Chromium failed while the dev server was restarting |

## Commands and results

| Check | Command | Result |
| --- | --- | --- |
| Native helper tests | `pnpm exec vitest run --config ./vitest.config.mts tests/int/native-mcp-setup.int.spec.ts` | 7/7 pass |
| UI component tests | `pnpm exec vitest run --config ./vitest.config.mts tests/int/build-with-ai.int.spec.ts` | 3/3 pass |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Security check | `node docker/security-check.mjs` | passed, 0 critical, 279 files; 1 high + 1 moderate package advisory (non-blocking) |
| Integration suite | `pnpm run test:int` | 5 suites / 19 tests pass; `tests/int/api.int.spec.ts` fails at HEAD without `PAYLOAD_SECRET`/`DATABASE_URL` (pre-existing) |
| Lint | `pnpm run lint` | fails at HEAD before any change: `eslint-config-next` circular config on ESLint 9.39.5 (pre-existing) |
| Mutation (V2 shape) | temporary `mcp.ultimapress` mutation | 2 tests fail; file restored |

## Acceptance criteria

### AC1 — Portable context without Claude — PASS (OMP, OpenCode); Pi model pending

- OMP, copy **with** `.claude`: `omp skill list --json` →
  `payload /tmp/upzip-a/.claude/skills/payload/SKILL.md`.
- OMP, copy **without** `.claude`/`CLAUDE.md`: `payload /tmp/upzip-b/.agents/skills/payload/SKILL.md`.
- OMP prompt on the second copy: cited the migration rule and named
  `.agents/skills/payload/reference/ACCESS-CONTROL.md`, section "Row-Level Security with Complex
  Queries" (line 204).
- OpenCode 2.3.2 on the second copy: read `AGENTS.md`, read
  `.agents/skills/payload/guide.md`, cited the migration rule, found the same section, and listed
  `payload` at `.agents/skills/payload/SKILL.md`.
- Pi: `pi mcp list --json` reads `~/.pi/agent/mcp.json` and reported the server `connected` with
  39 tools after `ULTIMAPRESS_MCP_KEY` was set. A model call was not possible: the installed Pi
  has no provider credentials (`No models available`). Recorded pending, not claimed validated.
- Claude Code: not installed; the `.claude` entry is byte-identical and OMP exercised it.

### AC2 — ZIP contents — PASS (official endpoint)

`GET /api/site-code/download` with an admin session returned `200`, `application/zip`, 5,272,689
bytes on the dev instance and `3,347,383` bytes on the Docker instance. The listing (Python
`zipfile`, equivalent to `unzip -l`) contains `AGENTS.md`, `CLAUDE.md`,
`.agents/skills/payload/SKILL.md`, `.claude/skills/payload/SKILL.md`,
`.agents/skills/payload/guide.md` and `.agents/skills/payload/reference/ACCESS-CONTROL.md`;
`.ultimapress-deploy.json` and `node_modules` are absent. The host has no `zip` binary, so a
minimal `zip` stand-in implemented the same `zip -r -q - . -x …` arguments on the dev instance;
the Docker image installs the real `zip`. `.agents` is a real directory, no symlinks.

### AC3 — One key per connect, client switch free — PASS (component)

`tests/int/build-with-ai.int.spec.ts`: one POST, then OMP → OpenCode → Pi; `fetch` called once;
the default after render is `Any MCP-compatible client`; no storage is written.

### AC4 — Native configs — PASS (unit)

Three JSONs parsed: OMP `mcpServers.ultimapress` with `type: http`; OpenCode
`mcp.servers.ultimapress` with `type: remote` and `oauth: false`; Pi `mcpServers.ultimapress`.
Variable forms are literal (`${ULTIMAPRESS_MCP_KEY}` / `{env:ULTIMAPRESS_MCP_KEY}`); no fixture
key and no `?key=`. The V2 hierarchy mutation is rejected by the test.

### AC5 — Parse boundaries — PASS (unit)

HTTPS and `http://127.0.0.1:18080` accepted; missing key, malformed URL, `user:pass@` and another
path → `invalid`; remote HTTP → `https-required`. The real loopback connection
`http://127.0.0.1:3000/api/mcp?key=…` parsed to the clean endpoint and a 35-char key.

### AC6 — Generic client view — PASS (component)

`Streamable HTTP`, the clean MCP URL, and `Authorization: Bearer <connection key>` render; the
address with the key exists only inside `<details>`; the key is copied by a separate button.

### AC7 — Clipboard honesty — PASS (component)

With both clipboard paths failing, `Copied` does not render and a readonly textarea appears after
the click with the key; the native JSON remains selectable.

### AC8 — Code-flow copy — PASS (source + typecheck)

`CodingAgentSetup` is used in the dashboard, Build a feature and Site code (3 usages); the starter
is `Read AGENTS.md first. Then add to my UltimaPress site: `; the launchers are `claude`, `omp`,
`opencode` (V2), `pi`; `pnpm ship` is described as sending, with owner confirmation in Site code.
A grep finds no `Read CLAUDE.md first` or `BuildWithClaude` in `src`.

### AC9 — Repair flow — PASS (merge fixture; UI component pending)

`conflictsForClaude` output starts with the file list and `Read AGENTS.md first.`, contains the
markers, `npx tsc --noEmit` and `node docker/security-check.mjs`; when `AGENTS.md` is conflicted,
the prompt adds the "resolve its markers first" instruction and mentions the Next.js block and the
guide. `SiteCodeClient` renders `This update needs attention`, `Download the updated code` and
`Copy repair prompt`; `UpdateButton` says `Update needs attention: open Site code`. The conflict ZIP
contains both skills, `AGENTS.md`, `CLAUDE.md` and the guide.

### AC10 — Delivery staging and confirmation — PARTIAL (build blocked by host memory)

The disposable Docker stack was built and healthy (`docker compose -p up-agents-smoke`, Compose
v5.8.0 installed as a CLI plugin, `127.0.0.1:18080`). With the deploy key:

- `scripts/ship.mjs` sent the folder and the admin showed **`An update is waiting`** (3.0 MB,
  neutral copy); `/agent-support-smoke.txt` returned **404** before confirmation.
- Clicking **`Put the update live`**, entering the password and confirming started the supervisor
  job (unpack → security → backup → install → build). The job then failed at **`Building the site`**
  with `The server restarted during this update.`; the site stayed on 1.1.4 and nothing switched.
- A second attempt after closing the browser and the backup container failed the same way. The
  host has 3.7 GB of RAM (1.4 GB available), and the in-container Next build restarts the app
  container during the build. The 200 marker, switch and rollback were not reached here.

This is an environment limitation, reproducible twice, not a copy regression. The next step on a
machine with more memory is to repeat the same staged update and confirm; the expected checks are
`/agent-support-smoke.txt` 200 after the switch and 404 after **Previous version**.

### AC11 — Roles and revocation — PASS (real HTTP)

- Author connection: `writePost` returned
  `Saved as a draft: "Agent support smoke - Pi" (id 1). Edit it at /admin/collections/posts/1`.
- The post has `authors: [34]` (the Author), `_status: draft`, slug `agent-support-smoke-pi`.
- `writePage` with the Author key returned `You are not allowed to perform this action.`; a page
  query for `Agent support denied` returned 0.
- Revoking the key (`DELETE /api/payload-mcp-api-keys/2`) then calling `writePost` returned 401
  `Unauthorized, you must be logged in to make this request.` and created no document.
- Legacy `?key=` alias: `tools/list` returned 39 tools.
- A new connection produced a different key, `claudeCode` contains that key and the clean URL.
- OMP 19.0.1: real `writePost` → `Saved as a draft: "Agent support smoke - OMP" (id 2)`.
- OpenCode 2.3.2: real `writePost` via `tools.ultimapress.writePost` →
  `Saved as a draft: "Agent support smoke - OpenCode" (id 3)`.
- Pi 1.6.0: transport `connected`, 39 tools; model call pending (no provider credentials).
- Docker instance, Author key: `writePost` →
  `Saved as a draft: "Agent support smoke - Docker" (id 1)`, authors `["author"]`, `_status`
  `draft`; `writePage` → `You are not allowed to perform this action.`; no denied page; legacy
  `?key=` alias listed 39 tools; after revocation the call returned **401** and created nothing.

### AC12 — MCP Inspector — PASS

`npx @modelcontextprotocol/inspector@latest --cli --server-url http://127.0.0.1:18080/api/mcp
--transport http --header "Authorization: Bearer …" --method tools/list` returned **39 tools**,
including `writePost` and `writePage`, against the Docker instance with the clean URL and Bearer
header.

### AC13 — Commands — PASS with two pre-existing failures

`tsc` clean; native and component tests green. `test:int` and `lint` fail at HEAD for environment
reasons recorded above; the changed files add no new failure. `security-check` passes.

### AC14 — No Claude-only UI path — PASS (source grep)

The T006 grep over `src/components`, `src/endpoints/siteCode.ts`, `src/mcp/tools.ts` and `docker`
finds only the allowed wire names (`forClaude`, `needsClaude`) and the Claude client option/legacy
copy. The README labels were updated; the marketing narrative was left out of scope.

## Pending and why

1. **Docker update build** — the staged update reached the build step and the app container
   restarted twice (`The server restarted during this update.`); the host has 3.7 GB of RAM. The
   200 marker, switch and rollback must be repeated on a machine with more memory. The staging,
   the `An update is waiting` UI and the pre-confirm 404 are proven.
2. **Pi model call** — no provider credentials in this environment. Transport and the 39 tools
   are proven; the `writePost` call is pending.
3. **Admin browser** — the production Docker admin rendered in Chromium, the selector showed the
   seven clients, one POST created the connection, and the three native configs had no key. The
   dev-server WebKit blank page is no longer relevant.
4. **Inspector UI** — the Inspector CLI was used; the web UI was not opened.

Everything except the Docker build completion and the Pi model call is verified with the commands
and outputs above.

## Closing

- Product commits: `39949c6` (`✨ Add native agent support for OMP, OpenCode V2 and Pi`) and
  `77650ff` (`📝 Record the agent-support verification and parked state`), plus this record.
  Upstream `mrwebtv/ultimapress` is untouched.
- Handoff: fork **`JhonMA82/ultimapress`**; `main` is pushed there for work to continue on a more
  powerful PC. The fork's `image.yml` may run on that push; it publishes under the fork's own
  package, not the upstream one.
- Final targeted run: 12/12 (`native-mcp-setup` 7 tests, `build-with-ai` 5). `pnpm exec tsc
  --noEmit` exit 0. `node docker/security-check.mjs`: passed, 0 critical.
- Panel recorded as `agent-support/T013` (correctness, security, tests); the surviving findings
  were fixed before the commit. See `02-DOCS/wiki/sdd/reviews/agent-support.md`.
- Remaining on the new PC: repeat the staged update and confirmation to reach the 200 marker and
  the rollback; the local Docker build is memory-bound (3.7 GB host). Pi still needs a provider
  credential for its model call.
