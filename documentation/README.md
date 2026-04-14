# DevFolio Documentation Hub (Diagram First)

This documentation set is rewritten to be diagram-centric. Use this page as the navigation map.

## Theoretical Foundation
DevFolio documentation follows a multimodal knowledge model where diagrams and prose work together to reduce onboarding time and ambiguity.

- Diagram-first structure supports rapid mental model construction.
- Theoretical narrative captures assumptions, invariants, and trade-offs behind each diagram.
- Cross-document traceability keeps architecture, API, data, and delivery theory aligned.

## Documentation Map

```mermaid
mindmap
  root((DevFolio Docs))
    Architecture
      ARCHITECTURE
      FOLDER_STRUCTURE
      TECH_STACK
    Product
      FEATURES
      CONCEPTS_AND_IMPLEMENTATION
      UI_UX_DESIGN_SYSTEM
      WORKFLOW
    Data and Scoring
      DATABASE_SCHEMA
      SCORING
      DEVSCORE_ALGORITHM_FLOW
      platform_analytics_catalog
    API and Integrations
      API_REFERENCE
      PLATFORM_ADAPTERS
      all_recruiter_platforms
    Delivery and Governance
      implementation_plan
      implementation_plan_status
      ROADMAP
      task
      fixes
      devfolio_project_audit
      summary
    Operations
      ENVIRONMENT_SETUP
```

## System Snapshot

```mermaid
flowchart LR
  U[Users: Developer Recruiter Admin] --> FE[Client SPA React Vite]
  FE --> API[Server Express API]
  API --> DB[(MongoDB)]
  API --> CACHE[(Redis optional)]
  API --> GH[GitHub APIs]
  API --> LC[LeetCode APIs]
  API --> CF[Codeforces APIs]
  API --> HR[HackerRank APIs]
  API --> CC[CodeChef APIs]
  API --> KG[Kaggle APIs]
  API --> HF[Hugging Face APIs]
  API --> SCORE[DevScore Engine]
  SCORE --> DB
  DB --> FE
```

## Read Path By Persona

```mermaid
flowchart TD
  A[Start Here] --> B{What are you doing?}
  B -->|Understand architecture| C[ARCHITECTURE + FOLDER_STRUCTURE + TECH_STACK]
  B -->|Build feature| D[FEATURES + WORKFLOW + API_REFERENCE]
  B -->|Work on scoring| E[SCORING + DEVSCORE_ALGORITHM_FLOW + DATABASE_SCHEMA]
  B -->|Work on platform adapters| F[PLATFORM_ADAPTERS + platform_analytics_catalog]
  B -->|Release safely| G[implementation_plan + implementation_plan_status + devfolio_project_audit]
  B -->|Fix production issues| H[fixes + ENVIRONMENT_SETUP + API_REFERENCE]
```

## Coverage Matrix

| Domain | Primary Docs |
|---|---|
| System design | ARCHITECTURE.md, FOLDER_STRUCTURE.md, TECH_STACK.md |
| Product and UX | FEATURES.md, UI_UX_DESIGN_SYSTEM.md, WORKFLOW.md |
| Data and score | DATABASE_SCHEMA.md, SCORING.md, DEVSCORE_ALGORITHM_FLOW.md |
| API and adapters | API_REFERENCE.md, PLATFORM_ADAPTERS.md |
| Recruiter intelligence | all_recruiter_platforms.md, platform_analytics_catalog.md |
| Delivery and audit | implementation_plan.md, implementation_plan_status.md, task.md, fixes.md, devfolio_project_audit.md, ROADMAP.md, summary.md |
| Local and deployment ops | ENVIRONMENT_SETUP.md |