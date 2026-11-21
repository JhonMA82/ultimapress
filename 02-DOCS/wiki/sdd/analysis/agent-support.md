---
type: analysis
title: Agent support — consistency report
description: Cross-read of constitution, spec, plan and tasks before implementation.
tags: [sdd, analysis, agents]
timestamp: 2026-11-21T04:50:00Z
topic: sdd
slug: agent-support
---

# Analyze — agent support

**GATE: PASS** — 0 CRITICAL, 0 HIGH, 2 MEDIUM (both resolved in the task list before code),
5 LOW (accepted or resolved). Constitution: no principle violated.

## Coverage map

| REQ | Spec requirement (short) | Plan section | Task(s) | Status |
| --- | --- | --- | --- | --- |
| AC1 | Portable context discoverable by OMP/OpenCode/Pi without `.claude` | §1, §2, §5 | T001, T010 | covered |
| AC2 | ZIP contains instructions, both skills, guide, reference; no deploy key | §1, §5 | T001, T009 | covered |
| AC3 | Client switch after connect does not issue a second key | §2, §3, §5 | T007, T009 | covered |
| AC4 | Three native configs with correct hierarchy, literal env var, no key | §0, §3, §5 | T002, T003 | covered |
| AC5 | Parse accepts HTTPS/loopback, rejects malformed/missing key/userinfo/remote HTTP | §0, §3, §5 | T002, T003, T007 | covered |
| AC6 | Generic view: Streamable HTTP, clean URL, Bearer instruction | §2, §5 | T007 | covered |
| AC7 | `Copied` only on real success; manual field after double failure | §3, §5 | T007 | covered |
| AC8 | Starter + four launchers in the three code screens | §2, §5 | T004, T005 | covered |
| AC9 | Conflict repair: heading, download, `Copy repair prompt`, AGENTS prompt | §3, §5 | T006, T012 | covered |
| AC10 | Deploy key stages; 404 until password; 200 after | §4, §5 | T012 | covered |
| AC11 | Author writePost draft, writePage denied, revocation blocks | §4, §5 | T011 | covered |
| AC12 | Inspector Streamable HTTP with Bearer lists tools | §5 | T011 | covered |
| AC13 | vitest + tsc + lint pass | §5 | T008 | covered |
| AC14 | No UI/repair prompt requires Claude; wire names only | §2, §5 | T006, T013 | covered |

No plan section or task lacks a spec trace. README label alignment is bounded by the spec's
Clarifications and AC9/AC14; the marketing narrative stays out.

## Findings

| # | Severity | Type | Artifact A | Artifact B | Conflict | Resolve in |
| --- | --- | --- | --- | --- | --- | --- |
| F1 | LOW | Ambiguity / policy | Plan T001 (risk 2) | Spec frontmatter | `rsc risk` says a tier-2 change needs a spec linked to the branch; the spec had no `branch:` key | plan — **resolved**: added `branch: main` |
| F2 | MEDIUM | Ambiguity (done-check) | Plan T006 | AC9, AC14 | The grep missed `Put the update from Claude live`, `Ask Claude`, `tell Claude`, `Give it to Claude`, and would fail on README marketing | tasks — **resolved**: broadened the source grep and split the README check |
| F3 | MEDIUM | Ambiguity (done-check) | Plan T008 | AC13 | "or only pre-existing failures" let any failure through | tasks — **resolved**: require the identical failing set at HEAD and after |
| F4 | LOW | Ambiguity (done-check) | Plan T005 | AC8 | The check proved the old string was gone, not that the shared component is used three times | tasks — **resolved**: exact `<CodingAgentSetup` count |
| F5 | LOW | Scope drift | Plan T006 (README) | Spec §Clarifications | README is not an AC on its own | accepted — bounded to the three changed labels |
| F6 | LOW | Ambiguity | AC7 | Plan §3 (CopyField) | AC7 does not say where the manual field appears | accepted — plan fixes it as a readonly input inside `CopyField` |
| F7 | LOW | Duplication | AC9 / T006 | T012 | Repair copy appears in both the string task and the browser proof | accepted — string change vs end-to-end observation, not duplicate work |
| F8 | LOW | Constitution check | Principle 10 (MCP wiring) | Plan T007 | Could be read as requiring `claudeConnect.ts` changes | accepted — no new collection or tool, so the existing wiring is enough |
| F9 | LOW | Ambiguity (environment) | AC1 | Plan R10 / spec deferred decision | Real agent binaries may be unavailable | accepted — record versions; if unavailable, record pending and do not claim validated |

## Constitution compliance

- Principles 1–3: no schema change, no migration, no import map entry (the renamed component keeps
  the same import path from `BeforeDashboard/index.tsx`).
- Principles 4–10: no collection/global/tool change; access and MCP key association untouched.
- Principles 11–17: the MCP key is treated as a password; parse rejects userinfo and remote HTTP;
  no key enters copied templates; the security check runs in the closing tasks.
- Principles 18–19: `pnpm ship` still only stages; owner confirmation unchanged; importer untouched.
- Principles 20–21: commits human-authored; decisions logged.

## Routing

Nothing blocks. Proceed to `implement` with T001–T007; the verification tasks run in order.
