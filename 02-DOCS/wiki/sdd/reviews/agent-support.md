---
type: review
title: Agent support — closing review
description: Tier-2 three-refuter panel over the product diff; findings and outcomes.
tags: [sdd, review, agents]
timestamp: 2026-11-21T05:50:00Z
topic: sdd
slug: agent-support
---

# Closing review — agent support

Scope: `git diff HEAD` plus the new files (`BuildWithAI.tsx`, `nativeMcpSetup.ts`,
`CodingAgentSetup.tsx`, the two new test files, `.agents/skills/payload/*`), against
`02-DOCS/wiki/sdd/specs/agent-support.md` and `02-DOCS/wiki/sdd/plans/agent-support.md`.
Harness install noise (`.rsc/`, `.omp/`, `01-TOOLS/`, `.gitignore`) is out of scope.
Risk: tier 2 (`CLAUDE.md` is classified harness); panel: correctness, security, tests.

## Findings

| # | Lens | Severity | Finding | Outcome |
| --- | --- | --- | --- | --- |
| 1 | security | should-fix | `AGENTS.md` told the agent to ask the owner for the deploy-key line and run it, putting the key in the conversation; contradicted the same change's Site code text and spec Behaviour 7. | **Fixed**: the owner is told to run the line themselves; the agent never asks for it. |
| 2 | tests | should-fix | The key was never asserted absent from the rendered page; a visible key leak passed. | **Fixed**: native view asserts `up_fixture` absent; generic asserts the keyed URL lives only inside `<details>`; only the manual field may hold it. |
| 3 | tests | should-fix | AC5's two exact error messages were never rendered. | **Fixed**: tests for remote HTTP (`Use HTTPS…`) and malformed (`The connection could not be read…`), both in `role="alert"`, with no config/key. |
| 4 | tests | should-fix | ChatGPT, Claude Code and the legacy HTTPS warning were unpinned. | **Fixed**: one test selects all three and asserts their text plus the warning. |
| 5 | tests | should-fix | "No persistence / reload resets" was unfalsifiable. | **Fixed**: storage spies (`setItem` never called), unmount/remount returns to the generic client. |
| 6 | tests | nit | The clipboard success branch never ran; `waitFor(readOnly)` could not fail. | **Fixed**: success test asserts `Copied` and no manual field; the no-op assertion is gone; manual field asserted absent before the click. |
| 7 | tests | nit | The jsdom tests missed the 5 s default on a cold run. | **Fixed**: per-test timeout 15 s. |
| 8 | correctness | nit | `LOOPBACK[hostname]` read the prototype chain, so `http://constructor/...` passed the HTTPS gate. | **Fixed**: `Object.hasOwn`; tests for `constructor` and `__proto__`. |
| 9 | correctness | nit | `CopyField` kept `Copied` when the native config changed on a client switch. | **Fixed**: the native config field is keyed by client, so it remounts. |
| 10 | correctness | nit | The V1-hierarchy mutation test threw on the dummy OMP fixture before reaching the V2 assertion. | **Fixed**: valid OMP/Pi configs plus the mutated V2, so the failure comes from the V2 hierarchy. |

## Deliberately not changed

- Legacy `SiteCode`/`Security` copy helpers still report `Copied` when both clipboard paths fail;
  same shape at HEAD, AC7 scopes the honesty requirement to the new card.
- README marketing still says "Claude"; the spec bounds the README change to the UI labels.
- `forClaude`/`needsClaude` stay as wire names; the spec requires it.
- `https://host//api/mcp` reconstruction keeps a doubled slash; the server URL comes from env and
  the raw URL has the same shape at HEAD.

## Verdict

No blocker and no surviving should-fix. The reviewed state passes the 12 targeted tests, `tsc`
and the security check. Pending (recorded in the verification): Docker delivery/rollback, admin
browser hydration, Pi model call, Inspector UI.
