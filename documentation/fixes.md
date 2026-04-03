# Fixes Log

Last updated: 2026-04-03

## Purpose

Track implemented fixes and open remediation items in a single place.

## Recently Completed Fixes

### Phase 1 (2026-03-30) - API contract and cache refresh stability

- added shared client response unwrapping helper to normalize service payload handling
- refactored all frontend service modules to use a consistent return contract
- replaced broad `queryClient.invalidateQueries()` calls in dashboard, goals, onboarding, and settings flows with scoped query-key invalidation
- fixed admin sync success banner to read the actual API message payload shape

Validation:

- frontend lint passing
- frontend production build passing
- backend e2e tests passing (9/9)

### Phase 2 (2026-03-30) - immutable public handle migration

- added `publicHandle` to user identity model with unique index and immutable constraints
- implemented safe public-handle generation and lazy backfill for legacy users
- migrated public profile and portfolio resolution to prefer `publicHandle` (with temporary displayName fallback)
- updated auth/user/integration/recruiter/compare payloads to include `publicHandle`
- migrated frontend public URL generation (navbar, recruiter cards, profile links, and portfolio links) to use `publicHandle` first

Validation:

- frontend lint passing
- frontend production build passing
- backend e2e tests passing (9/9)

### Phase 3 (2026-03-30) - access-token storage hardening

- removed `localStorage` persistence for access tokens and migrated client auth state to runtime memory only
- added startup auth bootstrap flow to rehydrate session using secure httpOnly refresh cookie
- updated protected-route gating to wait for auth bootstrap completion before redirect decisions
- removed client-side refresh-token localStorage fallback and made refresh interceptor cookie-first only

Validation:

- frontend lint passing
- frontend production build passing
- backend e2e tests passing (9/9)

### Platform and analytics improvements

- integrated all 7 core platforms into analytics deep-view sections
- improved heatmap rendering behavior for platform-specific and combined views
- improved tooltip layering behavior for analytics heatmap interactions
- normalized year/all-time heatmap rendering behavior

### Scoring and data consistency

- standardized DevScore retention cap to latest 30 snapshots across compute paths
- expanded secondary archetype support through model, score pipeline, and UI consumers
- improved platformData mapping for missing-signal resilience

### Environment and baseline security hardening

- enforced required env var checks at startup
- strengthened encryption key resolution logic and production warnings
- refreshed docs around setup and api behavior

### P0 security and privacy completion

- enforced strict project read authorization (owner-only, with admin override)
- unified owner-or-public privacy enforcement across profile, stats, score, search, compare, and leaderboard surfaces
- migrated refresh-token flow to cookie-first (httpOnly cookie rotation and logout clear)
- hardened scheduler with distributed lock to reduce multi-instance duplicate runs

### P1 reliability and security implementation

- added route-level integration tests for auth, privacy boundaries, and role-critical access control
- encrypted GitHub OAuth access token at rest and added decrypt-on-read for sync paths
- improved cache invalidation wiring for leaderboard-related write paths
- hardened regex handling and URL validation policies for user search, recruiter filters, profile URLs, and project URLs

### P2 accessibility, recruiter filtering, and observability completion

- improved chart accessibility across analytics and compare surfaces (keyboard focus regions, ARIA labels, and heatmap keyboard tooltip support)
- expanded recruiter search with advanced filters (score range, primary/secondary archetypes, portfolio-only toggle, tech match mode, sort controls, and pagination metadata)
- added backend observability middleware with request correlation IDs (`x-request-id`) and structured JSON logs for requests and errors

### Phase 4 (2026-04-03) - P1 performance and sync offloading completion

- moved recruiter search heavy filtering/sorting/pagination fully into Mongo aggregation pipelines with faceted pagination and metadata
- moved leaderboard mode rankings to Mongo aggregation-based filtering/sorting/pagination across devscore, github, leetcode, codeforces, hackerrank, codechef, kaggle, and huggingface
- introduced persisted sync-job model and background worker queue for manual user sync and admin/cron global sync workflows
- changed manual and global sync endpoints to enqueue background jobs and exposed job-status polling endpoints
- switched nightly scheduler from inline global sync execution to enqueue-only job trigger under distributed lock
- updated frontend sync flows (dashboard, analytics, goals, onboarding, settings, admin panel) to poll job completion before showing success and refreshing data

Validation:

- frontend lint passing
- frontend production build passing
- backend e2e tests passing (9/9)

### Quality validation

- frontend lint/build passing in current baseline
- backend smoke tests passing
- backend route-integration tests passing
- dependency audits currently clean

## Open Fixes (Prioritized)

### P1

- no remaining P1 items in current scope (completed 2026-04-03)

### P2

- no remaining P2 items in current scope (completed 2026-03-30)

## Verification Checklist for Each Fix

For every completed item:

- unit/integration/e2e tests updated
- lint/build/test checks pass
- docs updated
- audit delta noted

## Change Recording Format

Use this template for future entries:

```text
Date:
Fix ID:
Area:
Summary:
Files touched:
Validation run:
Residual risk:
```

## Related Documents

- [task.md](./task.md)
- [implementation_plan_status.md](./implementation_plan_status.md)
- [devfolio_project_audit.md](./devfolio_project_audit.md)
