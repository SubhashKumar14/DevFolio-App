# Folder Structure (Diagram First)

This document explains workspace structure, ownership boundaries, and change flow.

## Theoretical Foundation
Repository structure is organized by cohesion, coupling, and ownership boundaries.

- Domain grouping reduces cognitive load and navigation time.
- Stable interfaces between folders improve parallel team contribution.
- Structure mirrors runtime architecture to simplify traceability from code to behavior.

## 1. High-Level Repository Structure

```mermaid
flowchart TD
  ROOT[Devfolio-1.0.1]
  ROOT --> CLIENT[client]
  ROOT --> SERVER[server]
  ROOT --> DOCS[documentation]
  ROOT --> TESTS[tests]
  ROOT --> UPLOADS[uploads]
  ROOT --> ROOT_FILES[README CHANGELOG CONTRIBUTING]

  CLIENT --> C_SRC[src]
  CLIENT --> C_PUBLIC[public]
  CLIENT --> C_CFG[vite tailwind eslint configs]

  SERVER --> S_SRC[src]
  SERVER --> S_CFG[Dockerfile jest nodemon package]

  S_SRC --> S_CONFIG[config]
  S_SRC --> S_ROUTES[routes]
  S_SRC --> S_CTRL[controllers]
  S_SRC --> S_SRV[services]
  S_SRC --> S_MODELS[models]
  S_SRC --> S_MW[middleware]
  S_SRC --> S_CRON[cron]
  S_SRC --> S_UTILS[utils]

  C_SRC --> C_COMPONENTS[components]
  C_SRC --> C_PAGES[pages]
  C_SRC --> C_SERVICES[services]
  C_SRC --> C_STORES[stores]
  C_SRC --> C_LIB[lib]
  C_SRC --> C_HOOKS[hooks]
  C_SRC --> C_UTILS[utils]
```

## 2. Frontend Ownership Map

```mermaid
flowchart LR
  PAGES[pages] --> LAYOUT[components/layout]
  PAGES --> DOMAIN[components/dashboard and components/portfolio]
  PAGES --> AUTH[components/auth]
  PAGES --> UI[components/ui]
  PAGES --> SERVICES[services/*.js]
  SERVICES --> API[lib/apiClient.js]
  PAGES --> STORES[stores/authStore and stores/themeStore]
  PAGES --> HOOKS[hooks/*]
```

## 3. Backend Ownership Map

```mermaid
flowchart LR
  ROUTES[routes/*.js] --> CTRL[controllers/*.js]
  CTRL --> SRV[services/*.js]
  SRV --> MODELS[models/*.js]
  CTRL --> MODELS
  APP[app.js] --> ROUTES
  APP --> MW[middleware/*.js]
  SERVER[server.js] --> APP
  SERVER --> CRON[cron/scheduler.js]
  SERVER --> QUEUE[services/syncJobQueue.js]
```

## 4. Data Artifacts and Lifecycles

```mermaid
flowchart TD
  INTEGRATIONS[Connected account handles on User] --> STATS[GithubStats DsaStats PlatformStats]
  STATS --> SCORE[DevScore snapshots]
  USER_DATA[User and Profile] --> PORTFOLIO[PortfolioCode]
  USER_DATA --> PROJECTS[Project]
  SCORE --> ANALYTICS[Analytics and Leaderboard]
  STATS --> RECRUITER[Recruiter search ranking]
  JOBS[SyncJob queue records] --> STATS
```

## 5. Change Flow For New Feature

```mermaid
sequenceDiagram
  participant Product as Product requirement
  participant FE as Frontend pages/components
  participant API as Route and controller
  participant Service as Service layer
  participant Data as Model or external adapter
  participant Docs as documentation/*

  Product->>FE: Add UI surface
  FE->>API: Call endpoint contract
  API->>Service: Add business logic
  Service->>Data: Persist or fetch data
  Data-->>Service: Result payload
  Service-->>API: Response object
  API-->>FE: Stable API response
  FE->>Docs: Update docs and diagrams
```

## 6. Boundary Rules

- Keep route files thin and push behavior to controllers/services.
- Keep component-level API calls in client services and lib/apiClient.
- Keep shared auth logic centralized in authStore and AuthBootstrap.
- Keep schema shape changes mirrored in DATABASE_SCHEMA and API_REFERENCE docs.