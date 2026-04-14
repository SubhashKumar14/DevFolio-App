# Concepts and Implementation (Diagram First)

This document captures the product concepts and how they map to implementation modules.

## Theoretical Foundation
Product concepts are modeled as domain abstractions that map directly to implementation modules.

- Domain-driven thinking aligns user intent with persistent business concepts.
- Archetypes behave as weighting lenses, not hard segmentation gates.
- Concept-to-code traceability reduces drift between product language and runtime behavior.

## 1. Product Concept Graph

```mermaid
mindmap
  root((DevFolio Concepts))
    Unified Developer Identity
      One profile across coding and AI platforms
      Public handle and visibility model
    Archetype System
      Primary archetype
      Secondary archetype
      Domain affinity mapping
    Platform Signal Model
      GitHub
      DSA platforms
      AI and data platforms
    DevScore v2
      Per-platform scoring
      Domain-aware aggregation
      Diagnostics and improvement hints
    Recruiter Discovery
      Search and ranking
      Public evidence surfaces
    Portfolio Concept
      Editable code portfolio
      Public preview route
```

## 2. Unified Identity Concept To Implementation

```mermaid
flowchart LR
  C1[Identity concept] --> C2[User model with handles and archetypes]
  C2 --> C3[Profile model with visibility and social metadata]
  C3 --> C4[Public profile route /p/:handle]
  C3 --> C5[Owner-aware protected profile route]
```

## 3. Archetype and Domain Concept Model

```mermaid
flowchart TD
  A[Primary archetype] --> D[Resolved domain]
  B[Secondary archetype optional] --> D2[Secondary domain]
  D --> M[Domain affinity weights]
  D2 --> M
  M --> S[Platform weighted aggregation]
  S --> O[Final DevScore]
```

## 4. Signal Model Concept

```mermaid
flowchart LR
  subgraph Inputs
    I1[Platform stats collections]
    I2[Recency and activity metadata]
    I3[Confidence by available signals]
  end
  subgraph Engine
    E1[Normalize per signal]
    E2[Platform scorer]
    E3[Domain affinity blend]
    E4[Nonlinear transform]
  end
  subgraph Outputs
    O1[overallScore]
    O2[pillars]
    O3[platformScores]
    O4[diagnostics]
  end

  Inputs --> Engine --> Outputs
```

## 5. Privacy and Visibility Concept

```mermaid
stateDiagram-v2
  [*] --> PrivateData
  PrivateData --> PublicViewable: isPublic true
  PublicViewable --> OwnerViewable: owner access always
  PublicViewable --> RecruiterViewable: recruiter role + allowed fields
  PrivateData --> OwnerViewable
```

## 6. Implementation Decision Map

```mermaid
flowchart TD
  D1[Chosen: Express + Mongo + React] --> D2[Fast delivery and schema flexibility]
  D3[Chosen: Adapter-based platform ingestion] --> D4[Independent platform evolution]
  D5[Chosen: Score snapshots not mutable single row] --> D6[History and benchmarking]
  D7[Deferred: strict schema for all platform payloads] --> D8[Future hardening]
  D9[Deferred: full e2e matrix] --> D10[Planned quality expansion]
```

## 7. Practical Mental Model

```mermaid
flowchart TD
  U[User activity everywhere] --> A[Adapters normalize evidence]
  A --> S[Score engine evaluates quality]
  S --> P[Product surfaces present evidence]
  P --> R[Recruiters evaluate candidates]
  P --> U2[Users improve signals and resync]
  U2 --> U
```

## 8. Concept Invariants

- Product value is evidence aggregation, not single-platform ranking.
- Archetype is a weighting lens, not a hard gate.
- Score quality depends on recency, consistency, and breadth.
- Privacy and role rules constrain all read surfaces.