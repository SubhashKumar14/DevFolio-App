# DevFolio Summary

Last updated: 2026-03-29

## One-Page Project Picture

DevFolio is a platform that turns fragmented developer activity into a unified profile and score system. Users connect coding/AI platforms, sync data, compute DevScore v2, and present themselves through a public profile and live portfolio.

## What Exists Today

### Product surfaces

- Public marketing + authentication pages
- Authenticated dashboard with quick stats, streaks, heatmaps, and diagnostics
- Analytics deep dive with platform tabs and custom visuals
- Public profile pages
- Portfolio editor + live preview + public preview
- Leaderboard with multi-mode ranking
- Compare page with dual-user radar analytics
- Recruiter search panel
- Admin operations panel

### Platform coverage

Core 7 connected platforms:

- GitHub
- LeetCode
- Codeforces
- HackerRank
- CodeChef
- Kaggle
- Hugging Face

### Scoring system

- DevScore v2, score range 0-1000
- 5 pillars: problem solving, building, community, consistency, specialization
- Primary + secondary archetype support (weighted blending)
- Domain fit + platform diagnostics + strengths/improvements

## Runtime Shape

- Frontend: React 19 + Vite + TanStack Query + Zustand + Recharts + Tailwind
- Backend: Express 5 + Mongoose + JWT + Redis (optional) + node-cron
- Data: MongoDB collections for user/profile/platform stats/devscore/projects/portfolio

## Current Quality Snapshot

Validated against current codebase:

- Frontend lint: pass
- Frontend build: pass
- Backend tests: pass (smoke-level)
- Dependency audit (prod deps): 0 vulnerabilities (client + server)

## Readiness Assessment

Overall: partially production ready.

Major strengths:

- Solid feature breadth and coherent data model
- Clear platform adapter boundaries
- Scoring pipeline implemented and persisted
- Good baseline middleware security (helmet, cors, rate limits, csrf-origin checks)

Current blockers before production go-live:

- Authorization/privacy gaps in some read paths
- Token storage architecture still uses localStorage refresh strategy
- Scheduler scaling model can duplicate cron jobs in multi-instance deploys
- Coverage depth is still low (mostly smoke tests)

Detailed breakdown: [devfolio_project_audit.md](./devfolio_project_audit.md)

## If You Need To Onboard Fast

Read these files in sequence:

1. [ARCHITECTURE.md](./ARCHITECTURE.md)
2. [FEATURES.md](./FEATURES.md)
3. [API_REFERENCE.md](./API_REFERENCE.md)
4. [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
5. [WORKFLOW.md](./WORKFLOW.md)
