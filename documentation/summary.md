# DevFolio Project Summary (Current)

> Last updated: 2026-03-29

## 1. What DevFolio Is

DevFolio is a full-stack developer intelligence platform that aggregates coding and contribution activity across 15 platforms into one profile and one DevScore v2. It supports role-aware experiences for developers, recruiters, mentors, and admins.

Core capabilities:
- Unified profile + platform identity graph
- DevScore v2 (5-pillar scoring engine, 0-1000)
- Platform sync + trend analytics
- Portfolio editor (HTML/CSS/JS) with live preview and publish controls
- Leaderboard, compare, recruiter search, and export APIs

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + Tailwind CSS |
| Client State | Zustand + TanStack Query |
| Charts | Recharts |
| Validation | Zod + React Hook Form dependencies present |
| Backend | Node.js + Express 5 |
| Database | MongoDB + Mongoose |
| Auth | JWT access + refresh tokens, GitHub OAuth linking |
| Security | Helmet, CORS, rate-limiting, CSRF origin checks, DOMPurify |
| Jobs | node-cron |
| Tests | Jest + Supertest (basic smoke coverage currently) |

## 3. Platform Coverage

Integrated platform handles and sync support include:
- github
- leetcode
- codeforces
- hackerrank
- codechef
- geeksforgeeks
- kaggle
- atcoder
- stackoverflow
- hackerearth
- huggingface
- tryhackme
- codesignal
- devto
- gitlab

## 4. DevScore v2

DevScore v2 is composed from 5 pillars:
- Problem Solving
- Building
- Community
- Consistency
- Specialization

Score range: 0-1000 with archetype-sensitive weighting profiles.

## 5. Current Health Snapshot

Validated on 2026-03-29:
- Client lint: passing (`npm --prefix client run lint`)
- Client production build: passing (`npm --prefix client run build`)
- Server test suite: passing (`npm --prefix server test`)
- Server production dependency audit: passing with 0 vulnerabilities (`npm --prefix server audit --omit=dev`)

Recent hardening/fixes:
- Added rate limiter to refresh token endpoint
- Reduced OAuth token leakage risk (moved token from query string to URL fragment)
- Added stricter production env checks for encryption key
- Refactored portfolio preview rendering to avoid effect-driven state churn and improve iframe isolation

## 6. Known Gaps / Next Priorities

- Test depth is still minimal (currently smoke-level)
- Refresh token still uses localStorage on client side (security tradeoff remains)
- Documentation and API examples still need periodic alignment as features evolve

## 7. Project Status

Overall status: Active development, functionally rich, and currently in a stable build/test state with recently improved security hygiene.
