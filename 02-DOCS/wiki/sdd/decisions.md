# Decisions

Append-only. Newest last. Every entry: date, decision, options considered, why, and the task it
was taken in.

## 2026-11-21 — SDD lane and base

- **Decision:** run the agent-support feature through ASDD in this session, using the approved
  plan as the up-front authorization; the SDD config keeps `execution_mode: interactive`.
- **Options:** FTD (one feature document) vs ASDD.
- **Why:** the change touches auth, MCP credentials, admin UI, packaging and delivery; the
  approved plan itself says the ASDD gates run before product changes. The plan approval is the
  up-front yes, so phases run without asking to continue; the human still confirms the
  provisional constitution and the spec content through the decision queue.

## 2026-11-21 — Constitution ratified provisionally

- **Decision:** `02-DOCS/wiki/sdd/constitution.md` v1.0.0, `status: provisional`.
- **Options:** leave the onboarding draft (blocks the chain) vs provisional ratification vs wait
  for an explicit yes.
- **Why:** the chain needs a base; autopilot ratifies provisionally and queues a `review-after`
  entry. Every principle is drawn from `CLAUDE.md`, `package.json` and the approved plan — no new
  obligation was invented.

## 2026-11-21 — Plan choices for agent support

- **Decision:** the browser derives every native MCP config from the existing `url`; the server
  and `/api/claude-connect` stay untouched.
- **Options:** new server endpoint per client vs. client-side parse of the existing credential
  URL.
- **Why:** one audited key issuer, one revocation path, no new secret on the wire; the key never
  enters a copied template. Trade-off recorded in the plan §2.
- **Decision:** `nativeMcpConfig` returns the complete minimal file (`mcpServers` or
  `mcp.servers`) with one `ultimapress` entry.
- **Why:** copy-paste must be usable; the UI tells the owner to merge only that entry.
- **Decision:** work lands on `main` without a worktree.
- **Why:** the project lane states main is open and forbids asking about branches; the plan's
  default isolation proposal is overridden by the project rule. No publish in this run.

## 2026-11-21 — Panel outcomes

- **Decision:** keep the legacy `SiteCode`/`Security` clipboard helpers as they are; the strict
  "Copied only on success" rule applies to the new `CopyField` (AC7).
- **Decision:** the deploy-key line is run by the owner in their terminal; the agent never asks
  for the key. This closes the security finding without changing the staging endpoint.
- **Decision:** `LOOPBACK` stays a static record but membership uses `Object.hasOwn`, so prototype
  names cannot pass the HTTPS gate.
