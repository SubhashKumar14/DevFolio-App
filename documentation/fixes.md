# Fixes Log

Last updated: 2026-03-29

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

### Quality validation

- frontend lint/build passing in current baseline
- backend smoke tests passing
- dependency audits currently clean

## Open Fixes (Prioritized)

### P0

1. enforce strict project read authorization boundaries
2. unify privacy enforcement across profile/stats/score/search surfaces
3. migrate refresh token storage away from localStorage
4. harden scheduler for multi-instance deployments

### P1

1. add integration tests for auth/privacy/role-critical routes
2. encrypt GitHub access token at rest
3. improve cache invalidation strategy and write-path wiring
4. harden regex and URL validation policies

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
