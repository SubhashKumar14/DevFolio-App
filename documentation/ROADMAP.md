# Roadmap (Diagram First)

This roadmap visualizes completed milestones, active tracks, and near-term plans.

## Theoretical Foundation
Roadmapping is outcome-oriented and uncertainty-aware.

- Time horizons represent confidence bands, not deterministic promises.
- Track-based planning separates foundational risk from feature expansion.
- Decision gates maintain strategic focus under changing constraints.

## 1. Milestone Timeline

```mermaid
timeline
  title DevFolio Delivery Timeline
  section Completed
    Core architecture and feature surfaces : done
    DevScore v2 integration : done
    Privacy and security hardening P0/P1 : done
    Sync queue reliability and admin controls : done
  section In Progress
    Quality automation depth : active
    Recruiter intelligence expansion : active
    UX and accessibility refinements : active
  section Planned
    Ops tooling improvements : queued
    Expanded testing matrix : queued
    Search and recommendation enhancements : queued
```

## 2. Priority Tracks

```mermaid
flowchart LR
  A[Track A: Production hardening] --> A1[security consistency and operational confidence]
  B[Track B: Quality and test depth] --> B1[integration and e2e coverage]
  C[Track C: Recruiter intelligence] --> C1[richer ranking and filter semantics]
  D[Track D: UX and accessibility] --> D1[chart ergonomics and inclusive design]
```

## 3. Next 30 Day Plan

```mermaid
flowchart TD
  N1[Stabilize regression suite] --> N2[Cover auth refresh and role routes]
  N2 --> N3[Cover sync and score recompute]
  N3 --> N4[Cover recruiter and admin workflows]
  N4 --> N5[Publish release confidence report]
```

## 4. Next 60-90 Day Plan

```mermaid
flowchart TD
  M1[Expand recruiter search intelligence] --> M2[Platform-aware filters and explainability]
  M2 --> M3[Improve recommendation quality]
  M3 --> M4[Operational dashboarding and alerting]
  M4 --> M5[Continuous quality gate maturity]
```

## 5. Decision Gate Model

```mermaid
flowchart TD
  G1[Feature complete] --> G2[Security and privacy checks pass]
  G2 --> G3[Quality gate pass]
  G3 --> G4[Operational readiness pass]
  G4 --> G5[Release go]
  G2 -->|fail| R1[Remediate and retest]
  G3 -->|fail| R1
  G4 -->|fail| R1
```

## 6. Strategic Risks and Mitigations

```mermaid
flowchart LR
  R1[External API volatility] --> M1[adapter fallback and normalization guards]
  R2[Test gap regressions] --> M2[incremental test matrix expansion]
  R3[Ranking trust concerns] --> M3[diagnostics transparency and score explainability]
  R4[Operational blind spots] --> M4[sync job observability and status endpoints]
```