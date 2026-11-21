# REVIEW.md — how this repo is judged

Reviewer reads the constitution first (`02-DOCS/wiki/sdd/constitution.md`). Summary starts with a
count: "3 findings: 1 blocker, 2 nits", before anything else. Nit cap: 3 per review; the rest are
dropped.

## What failure looks like here

- An endpoint, collection or global whose access rules are weaker than the neighbouring ones, or
  that returns data to a caller who should not see it.
- A schema change without `src/migrations/` and regenerated `payload-types.ts`.
- An admin component path added without `pnpm generate:importmap`.
- Owner-visible copy that claims a capability the code does not have (an agent is "supported"
  when only a config sample exists), or that names one vendor where the flow is generic.
- A secret, MCP key, admin password or `.ultimapress-deploy.json` reachable from the browser
  bundle, a prompt, a log line, a copied template, a ZIP or a committed file.
- Client-side parsing that trusts a credential-bearing URL without checking scheme, host,
  credentials and path.
- Hard-coded colours or template-specific markup that breaks the other three templates.
- Content changes without revalidation.
- `docker/security-check.mjs` critical problems or warnings, hidden behind a false
  `// up-security:` exemption.
- Product packaging that depends on symlinks (the supervisor strips them) or on `.gitignore`
  (packagers ignore it).

## Paths to skip

- `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js` — generated.
- `pnpm-lock.yaml`, `src/migrations/` — generated or append-only.
- `node_modules/`, `.next/`, `.rsc/`, `01-TOOLS/`, `02-DOCS/` — harness or build artifacts, not
  product code (SDD artifacts are reviewed as documents, not as code).

## Always-human paths

Informs only; enforcement would need `risk.raise` in `.rsc/sello-config.json`. Never merge
without a person: `src/access/`, `src/security/`, `src/mcp/`, `src/endpoints/claudeConnect.ts`,
`src/endpoints/siteCode.ts`, `docker/supervisor.mjs`, `docker/upgrade.mjs`, auth, billing,
migrations, CI workflows and anything that handles credentials.
