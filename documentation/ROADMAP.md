# Roadmap

Last updated: 2026-03-29

## Status Legend

- done: implemented and in current codebase
- in-progress: partially implemented or blocked by hardening work
- planned: not yet implemented

## Completed Milestones

### Core platform and scoring

- done: 7 core platform integration pipeline
- done: DevScore v2 with 5 pillars and 0-1000 scale
- done: secondary archetype support in model + UI + score flow
- done: score history retention cap (latest 30)

### Product surfaces

- done: dashboard with heatmap, streak, diagnostics
- done: analytics deep-dive page with per-platform views
- done: public profile page
- done: portfolio editor, save, preview, visibility controls
- done: leaderboard with multi-mode ranking
- done: compare page with radar
- done: recruiter dashboard
- done: admin dashboard

### Ops and baseline security

- done: helmet, cors, rate limits, csrf origin middleware
- done: centralized error middleware
- done: HTML sanitization for portfolio persistence
- done: production-oriented env checks and encryption-key fallback handling

## Current Priority Tracks

### Track A - Production hardening

- in-progress: tighten authorization and privacy consistency for read endpoints
- in-progress: migrate token architecture away from localStorage refresh strategy
- planned: encrypt github access token at rest using dedicated key utility
- planned: scheduler lock or worker split for multi-instance safety

### Track B - Quality and test depth

- in-progress: smoke tests exist
- planned: integration tests for auth refresh, sync, recruiter search, privacy checks
- planned: e2e tests for key user journeys (onboarding -> sync -> score -> profile)

### Track C - Recruiter intelligence

- planned: direct platform filters in recruiter search
- planned: pillar threshold filters
- planned: score recency and trend deltas in result cards

### Track D - UX and accessibility

- in-progress: responsive heatmap and tooltip layering improvements are in place
- planned: improve alt text coverage and keyboard semantics on chart-heavy components
- planned: accessibility pass for interactive visualization controls

## Next 30-Day Plan

1. close P0 security/privacy blockers
2. ship token storage migration path
3. add integration tests for protected endpoints
4. stabilize scheduler for horizontal deployment
5. run full pre-deploy audit and staging verification

## Next 60-90 Day Plan

1. recruiter feature depth and enterprise filters
2. analytics enrichment and trend insights
3. mentoring/mentor-specific experience surface
4. observability upgrade (structured logging + request correlation + metrics)

## Decision Gates

Before production go-live:

- all P0 blockers from task.md resolved
- audit risk score improved to release threshold
- core integration tests passing in CI
- deployment runbook tested in staging

## Cross-References

- [implementation_plan.md](./implementation_plan.md)
- [implementation_plan_status.md](./implementation_plan_status.md)
- [task.md](./task.md)
- [devfolio_project_audit.md](./devfolio_project_audit.md)
- [fixes.md](./fixes.md)
