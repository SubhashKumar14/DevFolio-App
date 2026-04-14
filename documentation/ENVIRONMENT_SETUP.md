# Environment Setup (Diagram First)

This guide shows local setup, required environment variables, run commands, and troubleshooting flows.

## Theoretical Foundation
Environment setup follows reproducibility and fail-fast configuration principles.

- Externalized configuration supports twelve-factor style deployment consistency.
- Deterministic bootstrap steps reduce machine-specific setup variance.
- Early validation of secrets and endpoints prevents late runtime failures.

## 1. Setup Workflow

```mermaid
flowchart TD
  A[Clone repository] --> B[Install client dependencies]
  B --> C[Install server dependencies]
  C --> D[Create server .env]
  D --> E[Set required secrets and URLs]
  E --> F[Start backend]
  F --> G[Start frontend]
  G --> H[Open app and validate auth bootstrap]
```

## 2. Runtime Prerequisites

```mermaid
flowchart LR
  P1[Node.js 18+] --> READY[Ready for local run]
  P2[MongoDB reachable URI] --> READY
  P3[Optional Redis URL] --> READY
  P4[GitHub OAuth keys optional for OAuth flow] --> READY
  P5[Google client id optional for Google sign in] --> READY
```

## 3. Environment Variable Map

```mermaid
flowchart TD
  REQUIRED[Required vars] --> R1[MONGODB_URI]
  REQUIRED --> R2[JWT_SECRET]
  REQUIRED --> R3[JWT_REFRESH_SECRET]

  OPTIONAL[Optional vars] --> O1[PORT]
  OPTIONAL --> O2[NODE_ENV]
  OPTIONAL --> O3[CLIENT_URL]
  OPTIONAL --> O4[REDIS_URL]
  OPTIONAL --> O5[ENCRYPTION_KEY]
  OPTIONAL --> O6[GITHUB_CLIENT_ID]
  OPTIONAL --> O7[GITHUB_CLIENT_SECRET]
  OPTIONAL --> O8[GITHUB_CALLBACK_URL]
  OPTIONAL --> O9[GOOGLE_CLIENT_ID]
```

## 4. Local Run Commands

```mermaid
flowchart LR
  T1[npm --prefix server dev] --> T2[API at :5000 default]
  T3[npm --prefix client dev] --> T4[Vite dev server :5173 default]
  T2 --> T5[Client calls API via VITE_API_URL or /api]
```

## 5. Verification Flow

```mermaid
sequenceDiagram
  participant Dev
  participant Backend
  participant Frontend
  participant Browser

  Dev->>Backend: Start server process
  Backend-->>Dev: env validated and DB connected
  Dev->>Frontend: Start client process
  Frontend-->>Dev: Vite running
  Dev->>Browser: Open app URL
  Browser->>Backend: GET /api/health
  Backend-->>Browser: status ok
```

## 6. Troubleshooting Decision Tree

```mermaid
flowchart TD
  T[Issue observed] --> A{Server starts?}
  A -->|No| A1[Check required env vars and Mongo URI]
  A -->|Yes| B{Client auth loops to login?}
  B -->|Yes| B1[Check refresh cookie, CLIENT_URL, CORS, /auth/refresh behavior]
  B -->|No| C{CORS or CSRF origin errors?}
  C -->|Yes| C1[Verify CLIENT_URL list and origin protection config]
  C -->|No| D{OAuth callback failing?}
  D -->|Yes| D1[Validate callback URL and OAuth credentials]
  D -->|No| E[Inspect logs and requestId trace]
```

## 7. Quality Check Pipeline

```mermaid
flowchart LR
  Q1[npm --prefix client lint] --> Q2[npm --prefix client build]
  Q2 --> Q3[npm --prefix server test]
  Q3 --> Q4[Smoke test auth sync score recruiter admin flows]
```

## 8. Developer Workflow Recommendation

- Keep two terminals: one for server, one for client.
- Trigger sync after connecting platform handles.
- Validate score and analytics after each adapter-related change.
- Update docs in the same PR as contract or workflow changes.