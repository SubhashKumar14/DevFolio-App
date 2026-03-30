# Fixes Log

Last updated: 2026-03-30

## Purpose

Track implemented fixes and open remediation items in a single place.

## Recently Completed Fixes

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

### Quality validation

- frontend lint/build passing in current baseline
- backend smoke tests passing
- backend route-integration tests passing
- dependency audits currently clean

## Open Fixes (Prioritized)

### P2

1. accessibility polish (alt text, keyboard/aria for chart-heavy components)
2. recruiter advanced filtering features
3. observability improvements (structured logs and request correlation)

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
