# Folder Structure

Last updated: 2026-04-03

## Root Layout

```text
Devfolio-1.0.1/
  client/
  server/
  documentation/
  visualdoc/
  README.md
  .gitignore
```

## Frontend Structure

```text
client/
  public/
    assets/
      icons/
  src/
    components/
      auth/
      common/
      dashboard/
      layout/
      portfolio/
      ui/
    hooks/
    lib/
    pages/
    services/
    stores/
    utils/
    App.jsx
    main.jsx
    index.css
  package.json
  vite.config.js
  tailwind.config.js
  vercel.json
```

### Frontend ownership map

- pages: route-level UI screens
- components: reusable UI modules grouped by domain
- services: API wrappers over axios client
- stores: Zustand state containers
- hooks: query/auth lifecycle hooks
- lib: constants, routing helpers, schemas, generic utilities
- utils: feature-specific helper utilities (portfolio render helpers, etc.)

## Backend Structure

```text
server/
  .env (local-only, not tracked)
  src/
    app.js
    server.js
    config/
      db.js
      env.js
      redisClient.js
    middleware/
      auth.js
      roleGuard.js
      rateLimiter.js
      csrfOriginProtection.js
      errorHandler.js
    models/
      User.js
      Profile.js
      GithubStats.js
      DsaStats.js
      PlatformStats.js
      DevScore.js
      Project.js
      PortfolioCode.js
    routes/
      authRoutes.js
      userRoutes.js
      profileRoutes.js
      integrationRoutes.js
      statsRoutes.js
      scoreRoutes.js
      projectRoutes.js
      leaderboardRoutes.js
      portfolioRoutes.js
      compareRoutes.js
      adminRoutes.js
      recruiterRoutes.js
      contestRoutes.js
      exportRoutes.js
    controllers/
      authController.js
      userController.js
      profileController.js
      integrationController.js
      statsController.js
      scoreController.js
      projectController.js
      leaderboardController.js
      portfolioController.js
      compareController.js
      adminController.js
      recruiterController.js
      contestController.js
      exportController.js
      userSearchController.js
    services/
      devscoreEngine.js
      githubService.js
      leetcodeService.js
      codeforcesService.js
      hackerrankService.js
      codechefService.js
      kaggleService.js
      huggingfaceService.js
      contestService.js
    cron/
      scheduler.js
    utils/
      sanitizer.js
  tests/
    e2e/
      flows.spec.js
    unit/
  package.json
  jest.config.js
```

### Backend ownership map

- routes: endpoint mapping + middleware composition
- controllers: request orchestration and business actions
- services: external API adapters and scoring engine
- models: persistence contracts
- middleware: cross-cutting request controls
- config: environment/bootstrap integrations
- cron: scheduled background operations

## Documentation Structure

```text
documentation/
  README.md
  summary.md
  ARCHITECTURE.md
  API_REFERENCE.md
  DATABASE_SCHEMA.md
  FEATURES.md
  TECH_STACK.md
  FOLDER_STRUCTURE.md
  UI_UX_DESIGN_SYSTEM.md
  WORKFLOW.md
  ENVIRONMENT_SETUP.md
  CONCEPTS_AND_IMPLEMENTATION.md
  PLATFORM_ADAPTERS.md
  platform_analytics_catalog.md
  all_recruiter_platforms.md
  ROADMAP.md
  implementation_plan.md
  implementation_plan_status.md
  task.md
  devfolio_project_audit.md
  fixes.md
```

## Notable Architectural Boundaries

- client and server are independently runnable and deployable
- documentation folder is the canonical project knowledge base
- devscoreEngine is a critical shared decision module for analytics + ranking features

## Maintenance Guidance

- keep route/controller/service/model naming aligned by domain
- when adding a new API route, update both API_REFERENCE and WORKFLOW docs
- when adding a new platform adapter, update PLATFORM_ADAPTERS, FEATURES, and analytics catalog docs
