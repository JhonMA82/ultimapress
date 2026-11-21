# Progress — agent-support

Append-only ledger for the ASDD run. Spec: `02-DOCS/wiki/sdd/specs/agent-support.md`.
Plan: `02-DOCS/wiki/sdd/plans/agent-support.md`.

## Decision queue

- [review-after] Q1 — La constitución v1.0.0 se ratificó provisionalmente bajo el plan aprobado; confírmala o pide cambios, `02-DOCS/wiki/sdd/constitution.md`, base.
- [review-after] Q2 — La configuración MCP nativa copia el archivo completo con una entrada `ultimapress`, no solo la entrada; el dueño debe fusionar esa entrada, `02-DOCS/wiki/sdd/specs/agent-support.md#clarifications`, spec.
- [review-after] Q3 — El selector de cliente no persiste: tras recargar vuelve a `Any MCP-compatible client`, spec.
- [review-after] Q4 — Las dos entradas `SKILL.md` son idénticas y `.claude` apunta a la guía bajo `.agents`; la copia sin `.claude` es la prueba de que no hay dependencia oculta, spec.
- [review-after] Q5 — El README solo se alinea en las etiquetas de UI cambiadas; su narrativa de marketing queda fuera, spec.

## Log

### 2026-11-21 — Base

- `02-DOCS/wiki/sdd/config.yaml` written: pnpm, Next/React/Payload/Postgres, vitest + playwright,
  strict TDD on, execution mode interactive (this run uses the plan as up-front yes).
- Constitution v1.0.0, provisional; `REVIEW.md` drafted; knowledge map created.

### 2026-11-21 — Spec and clarify

- Spec written with the plan's observable contract; `rsc spec gate` run.
- Clarify pass: no blocking gap; seven assumptions recorded in the spec and five `review-after`
  entries above (the rest live in the spec only).

### 2026-11-21 — Implement (T001–T007)

- T001: `AGENTS.md` now carries the product rules outside the Next markers; `CLAUDE.md` is the
  header plus `@AGENTS.md`; the payload guide moved to `.agents/skills/payload/guide.md` with the
  reference tree; `.agents` and `.claude` entries are byte-identical.
- T002/T003: `tests/int/native-mcp-setup.int.spec.ts` written red (module missing), then green
  (7 tests); the V2 hierarchy mutation made 2 tests fail and was reverted.
- T004/T005: `CodingAgentSetup` + `BUILD_FEATURE_STARTER` used by the dashboard, Build a feature
  and Site code (3 usages).
- T006: repair/delivery copy neutralized in Site code, UpdateButton, Security, SiteHealth, Spine,
  supervisor, upgrade, `siteCode.ts`, `mcp/tools.ts` and the three README labels.
- T007: `BuildWithAI` (renamed, no `repoUrl`) with the seven-option `AI client` selector, native
  configs, generic Streamable HTTP view, key copy without display, clipboard manual fallback.
- Evidence: `pnpm exec tsc --noEmit` exit 0; `node docker/security-check.mjs` passed; vitest
  native suite 7/7. `pnpm run test:int` has a pre-existing `api.int.spec.ts` failure (no
  `PAYLOAD_SECRET`/`DATABASE_URL` in the test env); 5 suites/19 tests pass. `pnpm run lint` fails
  at HEAD before any change with a circular `eslint-config-next` config error on ESLint 9.39.5.

### 2026-11-21 — Verification

- Contract and component tests: 7/7 native, 3/3 `BuildWithAI` (one POST, native configs, manual
  copy fallback, legacy Claude view). `tsc` clean; security check passed; V2 mutation rejected.
- Real MCP: Author `writePost` draft (post id 1, authors [34]), `writePage` denied, revocation
  401 and no doc, legacy `?key=` alias and `claudeCode` checked. OMP 19.0.1 `writePost` (id 2);
  OpenCode 2.3.2 `writePost` via `tools.ultimapress.writePost` (id 3); Pi 1.6.0 transport
  connected with 39 tools (model call pending: no provider credentials).
- Context: OMP finds `.agents` without `.claude`; OpenCode reads `AGENTS.md` + the guide and lists
  `payload` in a copy without `.claude`; both cite the migration rule and the ACCESS-CONTROL
  section.
- ZIP: official `GET /api/site-code/download` 200, `application/zip`, 5,272,689 bytes; all
  required files present, no deploy key. Host `zip` replaced by a stand-in (Docker installs it).
- Conflict: `mergeSites` + `conflictsForClaude` fixture, skills in the merged tree and the
  conflict ZIP, prompt starts with `Read AGENTS.md first.`, markers/checks present, and the
  conflicted-`AGENTS.md` branch adds the markers-first instruction.
- Pending: Docker daemon (deploy/rollback/404→200), admin browser hydration (component tests
  instead), Pi model call, Inspector UI. See the verification record.

### 2026-11-21 — Review panel (tier 2)

- Recorded `agent-support/T013` with lenses correctness, security, tests.
- Fixed: deploy-key line now owned by the owner (never pasted to the agent); loopback gate uses
  `Object.hasOwn`; native config field remounts on client switch; mutation test now fails at the
  V2 hierarchy; tests for the two AC5 messages, the three legacy flows, storage spies, the
  clipboard success path and 15 s cold-run timeouts.
- No surviving should-fix; three nits and four test gaps closed. Verification record updated.
