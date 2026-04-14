# Workflow (Diagram First)

This document captures all core user and system workflows as executable-style diagrams.

## Theoretical Foundation
Workflow modeling combines state-transition and process-orchestration concepts.

- Each workflow represents a finite sequence of guarded state changes.
- Async queue boundaries improve throughput while preserving control points.
- Feedback loops are necessary for adaptation, observability, and continuous improvement.

## Workflow Index

```mermaid
flowchart LR
  W1[1 Onboarding and Auth]
  W2[2 Platform Connect and Sync]
  W3[3 DevScore Lifecycle]
  W4[4 Portfolio Lifecycle]
  W5[5 Recruiter Discovery]
  W6[6 Admin Operations]
  W7[7 Contest Feed]
  W8[8 Release Validation]
```

## 1. User Onboarding and Authentication

```mermaid
sequenceDiagram
  participant User
  participant Client
  participant API
  participant Auth as Auth Controller
  participant DB as User and Profile

  User->>Client: Register or Google sign in
  Client->>API: POST /api/auth/register or /api/auth/google
  API->>Auth: Validate and issue tokens
  Auth->>DB: Create User and Profile
  DB-->>Auth: Persisted identity
  Auth-->>Client: access token + refresh cookie
  Client->>API: GET /api/user/me
  API-->>Client: Hydrated user session
```

## 2. Platform Connection and Sync

```mermaid
flowchart TD
  A[User opens Settings Integrations] --> B[Save platform handles or OAuth link]
  B --> C[POST /api/integrations/*]
  C --> D[POST /api/stats/sync]
  D --> E{Sync mode}
  E -->|Immediate| F[Fetch adapters now]
  E -->|Queued| G[Create SyncJob and worker pulls]
  F --> H[Persist GithubStats DsaStats PlatformStats]
  G --> H
  H --> I[Recompute DevScore]
  I --> J[Refresh dashboard analytics leaderboard recruiter]
```

## 3. DevScore Lifecycle

```mermaid
stateDiagram-v2
  [*] --> DataAvailable
  DataAvailable --> Normalized: platform shaping
  Normalized --> PlatformScores: scorer per platform
  PlatformScores --> DomainAggregation: domain affinity weighting
  DomainAggregation --> DevScoreComputed: nonlinear transform to 0..1000
  DevScoreComputed --> Persisted: save snapshot and diagnostics
  Persisted --> Exposed: score api benchmark history
  Exposed --> [*]
```

## 4. Portfolio Lifecycle

```mermaid
sequenceDiagram
  participant Dev as Developer
  participant Editor as Portfolio Editor
  participant API
  participant Model as PortfolioCode
  participant Public as Public Portfolio Viewer

  Dev->>Editor: Edit HTML CSS JS
  Editor->>API: POST /api/portfolio
  API->>Model: Save raw and sanitized content
  Dev->>API: PATCH /api/portfolio/visibility
  API->>Model: Toggle isPublic
  Public->>API: GET /api/portfolio/:identifier
  API-->>Public: Public portfolio payload
```

## 5. Recruiter Discovery Workflow

```mermaid
flowchart LR
  R1[Recruiter login] --> R2[Open recruiter dashboard]
  R2 --> R3[Apply filters skill college role score platform]
  R3 --> R4[GET /api/recruiter/search]
  R4 --> R5[Aggregate user+profile+score+platform stats]
  R5 --> R6[Return ranked candidates with signal cards]
  R6 --> R7[Open public profile and portfolio]
```

## 6. Admin Operations Workflow

```mermaid
flowchart TD
  A1[Admin dashboard] --> A2[View global stats and users]
  A2 --> A3[Manage user role or delete user]
  A2 --> A4[Trigger global sync]
  A4 --> A5[Create global SyncJob]
  A5 --> A6[Worker processes users]
  A6 --> A7[Admin polls /api/admin/sync-jobs/:jobId]
```

## 7. Contest Feed Workflow

```mermaid
sequenceDiagram
  participant Client
  participant API
  participant ContestService
  participant Sources as Contest sources

  Client->>API: GET /api/contests/upcoming
  API->>ContestService: fetch upcoming contests
  ContestService->>Sources: provider fetch
  Sources-->>ContestService: normalized contests
  ContestService-->>API: sorted feed
  API-->>Client: upcoming contests list
```

## 8. Release Validation Workflow

```mermaid
flowchart TD
  V1[Update code and docs] --> V2[Run client lint and build]
  V2 --> V3[Run server tests]
  V3 --> V4[Verify auth refresh and protected routes]
  V4 --> V5[Verify sync and score recompute]
  V5 --> V6[Verify recruiter and admin flows]
  V6 --> V7[Audit risk and status docs]
  V7 --> V8[Release decision]
```

## Workflow Gaps To Track

- Expand e2e workflow automation for recruiter and admin paths.
- Keep queued sync observability and retry metrics visible.
- Keep docs and route contract changes synchronized.