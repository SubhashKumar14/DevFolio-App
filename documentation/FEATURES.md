# Features (Diagram First)

This file catalogs product features by role and system capability.

## Theoretical Foundation
Feature modeling is capability-driven and role-aware.

- Role-based surface design ensures each user class gets relevant workflows.
- Capability decomposition supports incremental delivery without breaking core journeys.
- Feature reliability depends on consistency across API, data, and UI boundaries.

## 1. Feature Inventory Graph

```mermaid
flowchart LR
  PUBLIC[Public] --> LANDING[Landing and marketing]
  PUBLIC --> AUTH[Login Register OAuth]
  PUBLIC --> PROFILE[Public profile]
  PUBLIC --> PORTFOLIO[Public portfolio preview]
  PUBLIC --> CONTESTS[Contest feed]

  DEV[Developer and Mentor] --> DASH[Dashboard]
  DEV --> ONBOARDING[Onboarding]
  DEV --> SETTINGS[Settings and integrations]
  DEV --> ANALYTICS[Analytics]
  DEV --> PROJECTS[Project management]
  DEV --> PORT_EDIT[Portfolio editor]
  DEV --> LEADERBOARD[Leaderboard]
  DEV --> COMPARE[Compare]
  DEV --> GOALS[Goals and wrapped]

  RECRUITER[Recruiter] --> RECRUIT[Recruiter search dashboard]
  ADMIN[Admin] --> ADMIN_PANEL[Admin dashboard and sync ops]
```

## 2. Role Model Diagram

```mermaid
flowchart TD
  R1[developer] --> F1[full developer workflow]
  R2[mentor] --> F2[same as developer workflow]
  R3[recruiter] --> F3[recruiter dashboard + settings]
  R4[admin] --> F4[admin operations + recruiter access + settings]
```

## 3. Feature Lifecycle Flow

```mermaid
sequenceDiagram
  participant User
  participant Client
  participant API
  participant Data

  User->>Client: Perform action from feature page
  Client->>API: Call route contract
  API->>Data: Read or write models
  Data-->>API: Updated state
  API-->>Client: Response payload
  Client-->>User: UI feedback and refreshed cards
```

## 4. Scoring and Analytics Feature Map

```mermaid
flowchart TD
  S1[Manual or scheduled sync] --> S2[Adapters fetch data]
  S2 --> S3[Stats collections updated]
  S3 --> S4[DevScore recompute]
  S4 --> S5[Dashboard cards]
  S4 --> S6[Analytics deep sections]
  S4 --> S7[Leaderboard and compare]
  S4 --> S8[Recruiter ranking]
```

## 5. Operations Feature Map

```mermaid
flowchart LR
  O1[Manual sync endpoint] --> O2[SyncJob queue]
  O2 --> O3[Worker processes users]
  O3 --> O4[Status polling endpoints]
  O4 --> O5[Admin observability]
```

## 6. Security and Reliability Features

```mermaid
flowchart TD
  X1[JWT access token in memory] --> X2[Refresh token in httpOnly cookie]
  X2 --> X3[Auth bootstrap at app start]
  X3 --> X4[Role guard on frontend and backend]
  X4 --> X5[Owner/public visibility checks]
  X5 --> X6[Rate limiting and origin protection]
```

## 7. Backlog and Gaps

- Expand automated e2e feature coverage.
- Add richer recruiter platform filters.
- Continue UX accessibility hardening for all cards and charts.
- Add stronger operational dashboards for sync failures.