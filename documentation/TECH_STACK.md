# Tech Stack (Diagram First)

This document models runtime and build stack layers used by DevFolio.

## Theoretical Foundation
Stack decisions follow architecture fitness and operational suitability principles.

- Technology choice is constrained by workload, team velocity, and operability.
- Layered tooling should optimize for reliability before novelty.
- Evolutionary architecture allows component replacement without systemic rewrites.

## 1. Layered Stack Diagram

```mermaid
flowchart TD
  L1[Presentation Layer]
  L2[Client Runtime Layer]
  L3[API Layer]
  L4[Domain Services Layer]
  L5[Data Layer]
  L6[Infrastructure Layer]

  L1 --> L2 --> L3 --> L4 --> L5 --> L6
```

## 2. Frontend Stack Map

```mermaid
flowchart LR
  R[React 19] --> ROUTER[react-router-dom]
  R --> QUERY[@tanstack/react-query]
  R --> STATE[zustand]
  R --> FORM[react-hook-form + zod]
  R --> UI[tailwindcss + radix slot + lucide icons]
  R --> CHARTS[recharts]
  R --> MOTION[framer-motion]
  R --> HTTP[axios]
  BUILD[Vite] --> R
  LINT[ESLint] --> R
```

## 3. Backend Stack Map

```mermaid
flowchart LR
  EX[Express 5] --> MW[helmet cors compression rate-limit]
  EX --> AUTH[jsonwebtoken bcryptjs google-auth-library]
  EX --> DB[Mongoose 9 -> MongoDB]
  EX --> CACHE[ioredis optional]
  EX --> JOBS[node-cron + sync queue worker]
  EX --> HTTP[axios external calls]
  EX --> SAN[dompurify + jsdom]
  TEST[Jest + Supertest] --> EX
```

## 4. Data and Integration Layer

```mermaid
flowchart TD
  MONGO[(MongoDB)] --> MODELS[User Profile Stats DevScore Project PortfolioCode SyncJob]
  MODELS --> API[Express controllers]
  API --> EXT[GitHub LeetCode Codeforces HackerRank CodeChef Kaggle Hugging Face]
```

## 5. Build and Release Toolchain

```mermaid
flowchart LR
  DEV[Local development] --> CDEV[npm --prefix client dev]
  DEV --> SDEV[npm --prefix server dev]
  CHECKS[Quality checks] --> CLINT[npm --prefix client lint]
  CHECKS --> CBUILD[npm --prefix client build]
  CHECKS --> STEST[npm --prefix server test]
  DEPLOY[Deployment targets] --> FRONT[Vercel client]
  DEPLOY --> BACK[Containerized server]
```

## 6. Stack Risk and Hardening Focus

```mermaid
flowchart TD
  R1[External adapter fragility] --> M1[fallback-safe payload normalization]
  R2[Auth lifecycle complexity] --> M2[cookie refresh + bootstrap guard]
  R3[Chart layout edge cases] --> M3[responsive container hardening]
  R4[Background sync reliability] --> M4[queue worker and job status endpoints]
```

## 7. Practical Notes

- There is no root package script orchestrator; run client and server scripts from their own folders.
- Frontend API base URL is from VITE_API_URL or fallback /api.
- Backend env validation fails fast when required secrets are missing.