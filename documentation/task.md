# Engineering Task Board

Last updated: 2026-04-03
Source of truth: [devfolio_project_audit.md](./devfolio_project_audit.md)

## Priority Legend

- P0: release blocker
- P1: high-impact hardening required in near term
- P2: maintainability/performance follow-up
- P3: optional or long-range enhancement

## Recently Completed (Keep Stable)

- persisted sync jobs + worker processing for manual and nightly sync
- aggregation-based recruiter and leaderboard query path
- encrypted GitHub OAuth token at rest
- frontend sync polling and richer sync status UX
- observability middleware with request IDs and structured request logs

## P0 Tasks (Must Close Before Production)

### P0-1 Backend env bootstrap and startup reliability

- status: open
- area: `server/src/config/env.js`, startup runbook
- task:
  - make env loading deterministic for `npm --prefix server run start`
  - add and maintain `server/.env.example`
  - update environment setup docs to match runtime behavior exactly
- done when:
  - clean setup can boot server without undocumented steps
  - startup check passes in CI and local clean shell

### P0-2 Enforce strong server-side password policy parity

- status: open
- area: `server/src/controllers/authController.js`, `server/src/models/User.js`
- task:
  - enforce minimum length and complexity server-side
  - keep backend policy at least as strict as frontend schema
- done when:
  - weak passwords are rejected consistently from all clients
  - registration tests cover invalid policy cases

### P0-3 Remove refresh-token body fallback

- status: open
- area: `server/src/controllers/authController.js`
- task:
  - accept refresh token only from secure cookie
  - update response/error behavior for missing cookie path
- done when:
  - token refresh cannot succeed through request body token payloads
  - auth lifecycle tests validate cookie-only refresh

### P0-4 Guarantee single scheduler execution in production topology

- status: open
- area: `server/src/cron/scheduler.js`, `server/src/config/redisClient.js`
- task:
  - choose and enforce one strategy:
    - dedicated worker instance only, or
    - strict distributed lock requirement for schedulers
  - remove permissive fallback that runs unlocked in multi-instance deployments
- done when:
  - duplicate global sync windows are impossible by architecture
  - tests or staging simulation validate single-run behavior

## P1 Tasks (High-Impact Hardening)

### P1-1 Align CORS runtime behavior with multi-origin docs

- status: open
- area: `server/src/app.js`, `server/src/middleware/csrfOriginProtection.js`, `documentation/ENVIRONMENT_SETUP.md`
- task:
  - implement consistent multi-origin parsing for CORS and CSRF checks
  - document exact env format and precedence

### P1-2 Replace Redis `KEYS`-based invalidation strategy

- status: open
- area: `server/src/config/redisClient.js`, cache write paths
- task:
  - migrate to scan/tag/index-based invalidation strategy
  - limit cache invalidation blast radius by feature key namespaces

### P1-3 Move external enrichments off latency-critical request paths

- status: open
- area: `server/src/controllers/compareController.js`, `server/src/controllers/projectController.js`
- task:
  - cache shared repo and GitHub star enrichment where practical
  - fallback gracefully when upstream APIs are slow or rate-limited

### P1-4 Add frontend refresh de-duplication for concurrent 401s

- status: open
- area: `client/src/lib/apiClient.js`
- task:
  - add a shared in-flight refresh lock/promise queue
  - replay failed requests after single successful refresh

### P1-5 Expand automated test coverage and add CI quality gates

- status: open
- area: `server/tests`, frontend test harness, repository workflows
- include:
  - auth lifecycle and RBAC route matrix
  - privacy and ownership edge cases
  - recruiter/search/compare happy + failure paths
  - CI workflow for lint, build, tests, and dependency audit

## P2 Tasks (Stability and Maintainability)

### P2-1 Split and modularize `AnalyticsPage`

- status: planned
- area: `client/src/pages/AnalyticsPage.jsx`
- task:
  - extract chart sections and heavy logic into feature modules
  - reduce page-level cognitive and bundle complexity

### P2-2 Consolidate duplicated platform mapping/score persistence logic

- status: planned
- area: score/stats controllers and sync orchestrator
- task:
  - centralize platform normalization + persistence contracts
  - prevent drift across update paths

### P2-3 Documentation governance hardening

- status: planned
- area: `documentation/` + repo ignore strategy
- task:
  - ensure status and audit docs are updated in the same PR as fixes
  - refine `.gitignore` behavior for docs additions if needed

## P3 Tasks

- deeper observability (metrics/traces/alerts)
- container/IaC deployment templates
- extended recruiter intelligence and mentor role product expansions

## Validation Checklist Per Task

For each completed task:

1. code merged
2. automated tests added or updated
3. lint/build/test/audit checks pass
4. docs updated in same change set
5. release note added to [fixes.md](./fixes.md)

## Cross-References

- [implementation_plan.md](./implementation_plan.md)
- [implementation_plan_status.md](./implementation_plan_status.md)
- [fixes.md](./fixes.md)
- [devfolio_project_audit.md](./devfolio_project_audit.md)
