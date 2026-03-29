# Implementation Plan

Last updated: 2026-03-29
Planning horizon: production hardening and reliability completion

## Goal

Move DevFolio from feature-complete beta toward production-safe release by closing security/privacy gaps, improving reliability, and expanding test coverage.

## Phase 0 - Baseline and Guardrails (completed)

- established 7-platform ingestion architecture
- implemented DevScore v2 with diagnostics and retention
- wired dashboard, analytics, profile, leaderboard, compare, recruiter, admin surfaces
- added core middleware controls and basic operational checks

## Phase 1 - Security and Privacy Hardening (current)

### 1.1 Authorization consistency

Deliverables:

- enforce owner-only project reads (self-scope endpoint)
- unify visibility checks for profile/stat/score read routes
- ensure public search only exposes approved fields

Success criteria:

- no cross-user read leaks for private data
- privacy behavior consistent across profile, stats, score, and recruiter-adjacent endpoints

### 1.2 Token architecture migration

Deliverables:

- migrate refresh token to httpOnly secure cookie strategy
- remove localStorage dependency for refresh token
- use in-memory access token strategy where feasible

Success criteria:

- token theft surface reduced
- refresh flow still seamless across page refresh and 401 retry

### 1.3 Secret handling hardening

Deliverables:

- encrypt githubAccessToken at rest using dedicated utility
- key rotation documentation and migration notes

Success criteria:

- raw OAuth token no longer stored directly in database

## Phase 2 - Reliability and Scale Hardening

### 2.1 Scheduler safety

Deliverables:

- move scheduler to worker process OR introduce distributed lock
- add job instrumentation and collision detection logs

Success criteria:

- no duplicate nightly sync execution in multi-instance deployments

### 2.2 Cache invalidation correctness

Deliverables:

- wire cache invalidation where writes affect cached reads
- replace broad KEYS invalidation strategy with safer scan/versioning approach

Success criteria:

- fresh leaderboard/contest data with controlled cache operations

### 2.3 External call resilience

Deliverables:

- improve retry/backoff strategy for adapter calls
- separate enrichment calls from user-interactive latency paths

Success criteria:

- lower request tail latency and fewer user-facing failures during upstream instability

## Phase 3 - Test and Quality Expansion

### 3.1 API integration tests

Target suites:

- auth register/login/refresh/logout
- privacy and authorization matrix (profile/stats/score/projects)
- recruiter and admin role enforcement
- sync and score recompute behavior

### 3.2 E2E flows

Target journeys:

- register -> onboarding -> connect -> sync -> dashboard
- settings updates reflected in public profile
- portfolio save/publish and public preview
- recruiter search and candidate access

### 3.3 Regression gates

- require test suite pass in CI before release
- maintain lint/build/test/audit checks as release gate

## Phase 4 - Product Depth

- recruiter advanced filters and ranking insights
- mentor role UX surface
- richer analytics trend narratives and benchmark contextualization
- observability and operational dashboarding

## Work Breakdown Structure

| Workstream | Owner | Priority | Dependencies |
| --- | --- | --- | --- |
| auth and token migration | backend + frontend | P0 | cookie strategy, auth middleware updates |
| authorization/privacy matrix | backend | P0 | route/controller updates + tests |
| scheduler hardening | backend/platform | P1 | redis or worker deployment model |
| test expansion | backend + qa | P1 | stable endpoint contracts |
| recruiter enhancements | frontend + backend | P2 | stabilized scoring and privacy model |
| mentor experience | product + frontend | P3 | role UX definitions |

## Exit Criteria for Production Release

1. P0 tasks complete and validated
2. integration test suite added for critical routes
3. no known critical findings in audit report
4. staging smoke + regression pass complete
5. rollout and rollback runbooks validated

## Cross-References

- [implementation_plan_status.md](./implementation_plan_status.md)
- [task.md](./task.md)
- [devfolio_project_audit.md](./devfolio_project_audit.md)
- [fixes.md](./fixes.md)
