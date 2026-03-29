# Concepts and Implementation

Last updated: 2026-03-29

## Why DevFolio Exists

Developers often spread activity across multiple platforms, making it hard to represent skill and consistency in one place. DevFolio unifies those signals into profile, analytics, and ranking experiences.

## Core Product Concepts

### 1. Unified Developer Identity

Identity combines:

- account identity (User)
- public profile metadata (Profile)
- platform handles (User)
- platform activity snapshots (GithubStats/DsaStats/PlatformStats)
- computed scoring intelligence (DevScore)
- public code artifact (PortfolioCode)

### 2. Archetype System

Primary archetypes in code:

- builder
- problem_solver
- ai_engineer
- security_expert
- open_source
- competitor

Secondary archetype support:

- user can set a secondary archetype
- score engine blends primary + secondary weighting

Implementation touchpoints:

- user model fields
- onboarding/settings UI
- devscoreEngine weighting and diagnostics output

### 3. Platform Signal Model

Core connected platforms:

- github
- leetcode
- codeforces
- hackerrank
- codechef
- kaggle
- huggingface

Signal ingestion pattern:

1. resolve username/handle
2. fetch source payload using adapter service
3. normalize to internal shape
4. persist stats model
5. aggregate into platformData for scoring

### 4. DevScore v2 Concept

DevScore v2 transforms heterogeneous platform activity into:

- overall score (0-1000)
- rawScore and weightedRawScore
- 5 pillars
- domain label and fit diagnostics
- platformScores map
- strengths and improvement hints

Pillars:

- problemSolving
- building
- community
- consistency
- specialization

Implementation boundaries:

- scoring logic: server/src/services/devscoreEngine.js
- persistence and retention: score/stats/admin/scheduler controllers
- consumers: dashboard, leaderboard, compare, public profile

### 5. Visibility and Privacy Model

Current visibility controls:

- profile.isPublic controls public profile route visibility
- portfolio.isPublic controls public portfolio preview visibility

Current implementation caveat:

- privacy intent is not yet uniformly enforced across all optional-auth read endpoints

### 6. Portfolio Concept

Portfolio is a programmable artifact:

- rawHtml for editing
- sanitized htmlContent for safer rendering
- cssContent and jsContent
- iframe sandbox render

Implementation:

- save path sanitizes raw HTML with DOMPurify
- preview path assembles html/css/js and escapes script closing tags

### 7. Recruiter Discovery Concept

Recruiter value comes from ranking + profile context:

- public profile constraints
- latest DevScore snapshot
- archetype fit
- college and tech stack filters
- portfolio availability flag

### 8. Operational Concepts

#### Sync

- manual sync: user-triggered stats refresh
- nightly sync: cron refresh for connected users

#### Caching

- read-through cache helper
- used on contest and leaderboard paths

#### Retention

- DevScore history capped to latest 30 entries per user

## Implementation Decisions

### Chosen

- Mongoose document-oriented schema for flexible platform payloads
- adapter-per-platform service files
- centralized error middleware pattern
- interceptor-driven token refresh on frontend

### Deferred / Backlog

- secure cookie refresh-token architecture
- stronger authorization consistency across read endpoints
- scheduler lock strategy for multi-instance runtime
- deeper integration/e2e testing

## Practical Mental Model

Think in three layers:

1. ingestion layer: adapters gather external data
2. intelligence layer: devscoreEngine computes normalized scoring outputs
3. experience layer: dashboard/analytics/leaderboard/recruiter/public-profile present outputs

## Cross-References

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [PLATFORM_ADAPTERS.md](./PLATFORM_ADAPTERS.md)
- [platform_analytics_catalog.md](./platform_analytics_catalog.md)
- [WORKFLOW.md](./WORKFLOW.md)
