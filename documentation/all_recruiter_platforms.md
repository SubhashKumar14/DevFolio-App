# Recruiter Platform Signals Catalog (Diagram First)

This document explains how recruiter search is powered by platform and score signals.

## Theoretical Foundation
Recruiter intelligence is based on evidence synthesis rather than single-metric ranking.

- Signal detection theory motivates combining multiple weak and strong indicators.
- Confidence-aware interpretation reduces false positives from sparse platform activity.
- Explainability is essential so ranking outcomes can be audited and trusted.

## 1. Recruiter Search Surface

```mermaid
flowchart LR
  R[Recruiter/Admin] --> UI[Recruiter dashboard filters]
  UI --> API[GET /api/recruiter/search]
  API --> AGG[Aggregate user + profile + score + stats]
  AGG --> RANK[Signal projection and ranking]
  RANK --> RESULT[Candidate cards]
  RESULT --> PROFILE[Public profile and portfolio drilldown]
```

## 2. Platform Signal Coverage

```mermaid
flowchart TD
  S[Candidate signal envelope] --> GH[GitHub activity and quality]
  S --> LC[LeetCode depth and contest quality]
  S --> CF[Codeforces rating and trend]
  S --> HR[HackerRank stars and badge quality]
  S --> CC[CodeChef rating and contests]
  S --> KG[Kaggle tier medals impact]
  S --> HF[Hugging Face models downloads community]
  S --> DS[DevScore domain and pillars]
```

## 3. Candidate Projection ER View

```mermaid
erDiagram
  Candidate {
    ObjectId userId
    string displayName
    string publicHandle
    string role
  }

  RecruiterView {
    number overallScore
    string grade
    string domainLabel
    object pillars
    object platformSignals
    string college
    boolean profilePublic
  }

  Candidate ||--|| RecruiterView : projected_as
```

## 4. Recruiter Query Workflow

```mermaid
sequenceDiagram
  participant Recruiter
  participant Frontend
  participant API
  participant DB

  Recruiter->>Frontend: Enter filters and sorting
  Frontend->>API: /api/recruiter/search?params
  API->>DB: Aggregate Users Profiles DevScores Stats
  DB-->>API: Matched candidates + signal fields
  API-->>Frontend: Paged ranked result set
  Frontend-->>Recruiter: Candidate cards + signal badges
```

## 5. Practical Interpretation Map

```mermaid
flowchart TD
  A[High score + broad platform confidence] --> A1[Generalist strong signal]
  B[High score + narrow platform concentration] --> B1[Specialist signal]
  C[Medium score + strong recent trend] --> C1[Growth candidate]
  D[Low score + sparse signals] --> D1[Insufficient evidence, request profile review]
  E[Private profile indicators] --> E1[Respect visibility boundaries]
```

## 6. Search Input To Output Mapping

| Filter/Input | Data Source | Output Signal |
|---|---|---|
| Skill and keywords | Profile techStack, project metadata | Relevance match |
| College | Profile college | College-filtered ranking |
| Platform-specific interest | Stats collections | Platform badges and details |
| Performance threshold | DevScore score and pillars | Score-aware shortlist |
| Public visibility | Profile isPublic and owner rules | Access-controlled result set |

## 7. Limit and Boundary Notes

- Candidate output is visibility-aware and excludes private-only data for non-owners.
- Recruiter route is limited to recruiter and admin roles.
- Ranking should be interpreted with confidence and platform coverage, not score alone.