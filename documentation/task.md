# Engineering Task Board

Last updated: 2026-03-29

## Priority Legend

- P0: release blocker
- P1: high impact, short-term required
- P2: medium-term enhancement
- P3: long-term or optional improvement

## P0 Tasks (Release Blockers)

### P0-1 Secure project read authorization

- status: open
- area: backend routes/controllers
- task:
  - replace GET /api/projects/:userId with self-scope read for authenticated user
  - if public projects are needed, introduce explicit public endpoint with visibility checks
- done when:
  - cross-user private project reads are impossible
  - tests verify unauthorized attempts are denied

### P0-2 Enforce privacy uniformly across read endpoints

- status: open
- area: backend profile/stats/score/search
- task:
  - centralize visibility guard logic
  - apply to profile-adjacent stats and score reads where applicable
- done when:
  - private users do not leak stats/score/search metadata outside allowed audience

### P0-3 Refresh token security migration

- status: open
- area: frontend authStore/apiClient + backend auth controller
- task:
  - move refresh token to httpOnly cookie
  - remove localStorage refresh token usage
  - update interceptor refresh flow
- done when:
  - refresh token is never readable from browser JS

### P0-4 Protect scheduler in multi-instance deployments

- status: open
- area: backend cron
- task:
  - implement distributed lock or worker-only scheduler topology
- done when:
  - nightly sync runs exactly once per schedule window

## P1 Tasks

### P1-1 Add integration test coverage for critical APIs

- status: open
- include:
  - auth lifecycle
  - role guard routes
  - recruiter search contract
  - privacy/visibility checks
  - project ownership checks

### P1-2 Encrypt GitHub OAuth token at rest

- status: open
- area: user model + token utility
- done when:
  - githubAccessToken is encrypted before persistence and decrypted only on use

### P1-3 Cache invalidation hardening

- status: open
- area: redis client + write paths
- task:
  - migrate broad key invalidation to safer strategy
  - wire invalidation hooks where cached reads depend on writes

### P1-4 Improve accessibility defects in profile/avatar surfaces

- status: open
- task:
  - replace empty alt text where image is informational
  - add chart keyboard/aria improvements in key analytics components

## P2 Tasks

### P2-1 Recruiter advanced filters

- status: planned
- additions:
  - platform availability filters
  - pillar threshold filters
  - hasPortfolio toggle
  - score recency filter

### P2-2 Analytics depth expansion

- status: planned
- additions:
  - trend explanations
  - anomaly callouts
  - score deltas and benchmark deltas

### P2-3 Mentor role experience

- status: planned
- scope:
  - dedicated mentor dashboard
  - mentor-relevant filters and insights

## P3 Tasks

- observability stack (structured logging, metrics, request ids)
- CI/CD quality gate automation
- data retention policy granularity beyond DevScore

## Validation Checklist Per Task

For each completed task:

1. code merged
2. tests added/updated
3. lint/build/tests pass
4. docs updated
5. audit delta recorded in fixes.md

## Cross-References

- [implementation_plan.md](./implementation_plan.md)
- [implementation_plan_status.md](./implementation_plan_status.md)
- [fixes.md](./fixes.md)
- [devfolio_project_audit.md](./devfolio_project_audit.md)
