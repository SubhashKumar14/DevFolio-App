# Features

Last updated: 2026-03-29

## Feature Inventory

This document enumerates the features currently implemented in code, grouped by domain and role.

## Role Model

- developer
- recruiter
- mentor
- admin

Current behavior notes:

- Most product functionality targets developer role.
- Recruiter and admin have dedicated dashboard pages and protected backend routes.
- Mentor role exists in auth model and route defaults but does not yet have a dedicated dashboard surface.

## Public Features

### Landing and Marketing

- Interactive hero and visual storytelling
- Platform-first messaging (7 core platform support)
- Links to auth onboarding

### Authentication Pages

- Register with role selection
- Login with role-based post-auth redirection

### Public Profile

- Route: /p/:handle
- Displays profile bio/college/archetype summary
- Shows score, heatmap, streak and platform cards
- Share and contact actions
- Links to public portfolio and optional resume URL

### Public Portfolio Preview

- Route: /portfolio/:username and /portfolio/preview/:username
- Renders saved HTML/CSS/JS in sandboxed iframe

### Public Contest Feed

- Route: /dashboard/contests (app page)
- Backend endpoint /api/contests/upcoming
- Merged and sorted upcoming entries from Codeforces + LeetCode

## Authenticated Developer Features

### Dashboard

- Quick stats cards
- Platform activity heatmap
- Streak counter
- Profile completeness card
- DevScore pillar preview
- Platform diagnostics blocks
- Export user data action
- Manual sync action

### Onboarding

- Select primary archetype
- Connect platform usernames/handles
- Structured platform field inputs

### Settings

- Profile data edit
- Platform handle updates and save/sync
- Platform disconnect action (soft delete via PATCH, reconnect anytime)
- Archetype + secondary archetype assignment
- Privacy toggle for profile visibility

### Profile Management

- Edit bio
- Edit comma-based tech stack
- Avatar and social metadata (via settings/profile)

### Project Management

- Create/update/delete projects
- List projects in dashboard section
- GitHub stars auto-fetch on create (best effort)

### Portfolio Builder

- Multi-tab editor (HTML/CSS/JS)
- Live preview with optional console panel
- Save and publish visibility controls
- Sanitized HTML persistence for public render

### Analytics

- Tab/query-parameter driven platform selection
- Platform-specific metrics and chart sections
- Multi-platform heatmap and trend rendering
- Supports all 7 core connected platforms

### Compare

- Compare two users by score or platform mode
- Radar chart visualization
- Shared repository signal in backend compare payload

### Leaderboard

- Ranking modes: devscore + 7 platform modes
- Filters: college, archetype, pagination
- Public/optional-auth accessible backend data source

### Wrapped and Goals

- Wrapped: yearly summary style insights
- Goals: milestone and target progression display

## Recruiter Features

### Recruiter Search Dashboard

- Filter by name
- Filter by tech stack
- Filter by college
- Filter by minimum score
- Filter by archetype
- Sort by score or name
- Returns profile + latest score + portfolio availability

## Admin Features

### Admin Dashboard

- Platform usage totals
- User listing
- Role change controls
- User delete with cascading cleanup
- Global sync trigger

## Backend Platform Operations

### Manual Sync

- Endpoint: POST /api/stats/sync
- Pulls connected platform data for authenticated user
- Persists stats documents
- Recomputes and stores DevScore snapshot

### Scheduled Sync

- Nightly cron scheduler
- Iterates users with connected handles
- Fetches adapters in grouped manner
- Persists stats and computes scores

## Scoring Features

### DevScore v2

- Score range 0-1000
- 5 pillars with score, max, percentile, grade
- Archetype and secondary archetype influenced weighting
- Domain and domainFit diagnostics
- platformScores map by connected platform
- strengths and improvements recommendation arrays

### Benchmark and History

- Score history endpoint (up to latest 30 entries)
- Domain benchmark endpoint with percentile-style comparison

## Security and Reliability Features

- JWT authentication middleware
- Role guard middleware for recruiter/admin routes
- Rate limiting: API, auth, sync
- CORS with configured origin
- CSRF origin protection for unsafe methods
- Centralized error handling middleware
- HTML sanitization for stored portfolio output

## Known Feature Gaps / Backlog

- Mentor-specific dashboard is not implemented
- Authorization and privacy consistency needs hardening across all read endpoints
- Token storage model should migrate away from localStorage strategy
- Automated tests need deeper integration/e2e coverage

## Feature-to-Doc Cross-Links

- API contracts: [API_REFERENCE.md](./API_REFERENCE.md)
- Data model backing features: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- Runtime flow detail: [WORKFLOW.md](./WORKFLOW.md)
- Audit and production blockers: [devfolio_project_audit.md](./devfolio_project_audit.md)
