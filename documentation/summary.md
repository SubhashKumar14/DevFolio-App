# DevFolio Summary (Diagram First)

This is the one-page visual summary of product, architecture, status, and release readiness.

## Theoretical Foundation
The summary uses systems thinking to unify product, engineering, and operations views.

- Platform value emerges from feedback loops between user behavior and analytics.
- Socio-technical alignment is required for trustworthy scoring and recruiter insight.
- Release readiness depends on both capability breadth and control maturity.

## 1. One-Page Project Picture

```mermaid
flowchart LR
  U[Developers Recruiters Admins] --> FE[React client]
  FE --> API[Express API]
  API --> DB[(MongoDB)]
  API --> EXT[Developer platform APIs]
  API --> SCORE[DevScore engine]
  SCORE --> FE
```

## 2. Product Surface Overview

```mermaid
flowchart TD
  PUBLIC[Public surfaces] --> P1[Landing]
  PUBLIC --> P2[Public profile]
  PUBLIC --> P3[Portfolio preview]
  PUBLIC --> P4[Contest feed]

  AUTH[Authenticated developer surfaces] --> D1[Dashboard]
  AUTH --> D2[Analytics]
  AUTH --> D3[Projects]
  AUTH --> D4[Portfolio editor]
  AUTH --> D5[Leaderboard and compare]

  ROLE[Role-specific surfaces] --> R1[Recruiter dashboard]
  ROLE --> R2[Admin dashboard]
```

## 3. Data and Scoring Lifecycle

```mermaid
flowchart TD
  A[Connect handles and OAuth] --> B[Sync adapters fetch metrics]
  B --> C[Persist stats collections]
  C --> D[Compute DevScore]
  D --> E[Persist score history and diagnostics]
  E --> F[Dashboard analytics leaderboard recruiter]
```

## 4. Current Quality Snapshot

```mermaid
pie title Quality Snapshot
  "Security and privacy hardening" : 30
  "Reliability and sync safety" : 25
  "Feature completeness" : 20
  "Quality automation" : 15
  "UX and accessibility polish" : 10
```

## 5. Readiness Assessment Model

```mermaid
flowchart TD
  R1[Critical blockers resolved] --> R2[Security controls in place]
  R2 --> R3[Core workflows stable]
  R3 --> R4[Quality expansion ongoing]
  R4 --> R5[Ready with monitored rollout]
```

## 6. Fast Onboarding Path

```mermaid
flowchart LR
  O1[Read README docs hub] --> O2[Read ARCHITECTURE and API reference]
  O2 --> O3[Run environment setup]
  O3 --> O4[Trace workflow and scoring docs]
  O4 --> O5[Pick tasks from plan and status docs]
```