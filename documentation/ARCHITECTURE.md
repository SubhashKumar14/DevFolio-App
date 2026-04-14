# Architecture (Diagram First)

This document models DevFolio as runtime topology, module boundaries, data flows, and security boundaries.

## Theoretical Foundation
The system architecture applies separation-of-concerns and bounded-context design for maintainability.

- Layering isolates presentation, application, domain, and persistence concerns.
- Adapter boundaries localize external API volatility to service modules.
- Controlled async workflows balance consistency, throughput, and operational safety.

## 1. System Topology

```mermaid
flowchart LR
  subgraph Client[Frontend: React SPA]
    R[React Router]
    Q[React Query Cache]
    Z[Zustand Stores]
    UI[Pages and Components]
    R --> UI
    UI --> Q
    UI --> Z
  end

  subgraph Server[Backend: Express API]
    APP[app.js middleware chain]
    ROUTES[Route modules]
    CTRL[Controllers]
    SRV[Services and DevScore Engine]
    APP --> ROUTES --> CTRL --> SRV
  end

  subgraph Data[Persistence]
    MONGO[(MongoDB Collections)]
    REDIS[(Redis lock and cache optional)]
  end

  subgraph External[External Platforms]
    GITHUB[GitHub]
    LEETCODE[LeetCode]
    CODEFORCES[Codeforces]
    HACKERRANK[HackerRank]
    CODECHEF[CodeChef]
    KAGGLE[Kaggle]
    HUGGINGFACE[Hugging Face]
    CONTESTS[Contest providers]
  end

  Client -->|HTTP /api| Server
  Server --> MONGO
  Server --> REDIS
  SRV --> GITHUB
  SRV --> LEETCODE
  SRV --> CODEFORCES
  SRV --> HACKERRANK
  SRV --> CODECHEF
  SRV --> KAGGLE
  SRV --> HUGGINGFACE
  ROUTES --> CONTESTS
```

## 2. Request Lifecycle Through Middleware

```mermaid
sequenceDiagram
  participant Browser
  participant Express as Express App
  participant Security as Helmet+CORS+CSRF
  participant Obs as Request Context+Logger
  participant RL as Rate Limiter
  participant Route as Domain Route
  participant Controller
  participant Service
  participant Mongo

  Browser->>Express: Request /api/*
  Express->>Security: Security headers and origin checks
  Express->>Obs: Attach requestId and request metadata
  Express->>RL: API limiter
  Express->>Route: Route match
  Route->>Controller: Validated request
  Controller->>Service: Business logic
  Service->>Mongo: Read/Write
  Mongo-->>Service: Data
  Service-->>Controller: Response payload
  Controller-->>Browser: JSON with requestId
```

## 3. Frontend and Backend Module UML

```mermaid
classDiagram
  class AppRouter {
    +Public routes
    +Protected routes
    +Role guards
  }
  class AuthStore {
    +user
    +accessToken
    +isAuthHydrated
    +setAccessToken()
    +logout()
  }
  class ApiClient {
    +axios instance
    +auth interceptor
    +refresh lock
  }
  class Controllers {
    +auth
    +profile
    +stats
    +score
    +recruiter
    +admin
  }
  class Services {
    +adapter services
    +devscoreEngine
    +sync queue
  }
  class Models {
    +User
    +Profile
    +DevScore
    +Stats collections
  }

  AppRouter --> AuthStore
  AppRouter --> ApiClient
  ApiClient --> Controllers
  Controllers --> Services
  Services --> Models
```

## 4. Data and Scoring Pipeline

```mermaid
flowchart TD
  A[User connects platforms] --> B[Adapters pull raw platform data]
  B --> C[Persist to stats collections]
  C --> D[Compute DevScore]
  D --> E[Store DevScore snapshot]
  E --> F[Dashboard Analytics Leaderboard Recruiter]
  E --> G[Score history and benchmark]
  C --> H[Heatmaps and deep platform analytics]
```

## 5. Runtime Startup Topology

```mermaid
flowchart TD
  S1[Load env and validate required vars] --> S2[Connect MongoDB]
  S2 --> S3[Start sync job worker]
  S3 --> S4[Start Express server]
  S4 --> S5[Schedule cron jobs]
  S5 --> S6[Accept traffic]
```

## 6. Security Boundary Model

```mermaid
flowchart LR
  subgraph Public
    P1[Landing]
    P2[Public profile]
    P3[Portfolio preview]
    P4[Leaderboard optional auth]
  end

  subgraph Authenticated
    A1[Developer pages]
    A2[Recruiter dashboard]
    A3[Admin dashboard]
  end

  subgraph Controls
    C1[JWT access token]
    C2[Refresh cookie]
    C3[Role guard]
    C4[Owner/public visibility checks]
    C5[Rate limit and origin protection]
  end

  Public --> Controls
  Authenticated --> Controls
```

## 7. Architecture Invariants

- Frontend talks only to /api via shared apiClient.
- All protected backend domains use authenticate middleware.
- Role-sensitive routes use explicit roleGuard.
- DevScore persists snapshots and retains bounded history.
- Sync operations can run as queued background jobs.