# DevFolio DevScore v2 Algorithm Flow (Diagram First)

This guide gives a detailed, implementation-aligned view of DevScore computation, edge cases, and interpretation.

## Theoretical Foundation
DevScore flow is a multi-criteria decision pipeline with explicit normalization and confidence handling.

- Comparable scoring requires transforming heterogeneous platform signals into a shared scale.
- Confidence-weighted aggregation reduces distortion from sparse or noisy evidence.
- Diagnostics close the loop by turning score outcomes into actionable improvement guidance.

## 1. End-To-End Algorithm Flow

```mermaid
flowchart TD
  A[Trigger: sync recompute or compute endpoint] --> B[Collect latest stats payloads]
  B --> C[Shape platformData map]
  C --> D[Run scorer per connected platform]
  D --> E[Compute confidence and signal maps]
  E --> F[Resolve primary and optional secondary domain]
  F --> G[Aggregate with domain affinity and confidence]
  G --> H[Apply breadth bonus]
  H --> I[Transform rawRatio to 0..1000]
  I --> J[Compute five pillars]
  J --> K[Build diagnostics strongest/weak signals]
  K --> L[Persist DevScore snapshot]
```

## 2. Trigger Points

```mermaid
flowchart LR
  T1[POST /api/stats/sync] --> CORE[computeDevScore]
  T2[POST /api/score/recompute] --> CORE
  T3[Scheduled sync worker] --> CORE
  CORE --> SAVE[Save in DevScore collection]
```

## 3. Platform Scoring Subsystem

```mermaid
flowchart TD
  GITHUB[scoreGitHub] --> OUT[platformResults]
  LEET[scoreLeetCode] --> OUT
  CODEFORCES[scoreCodeforces] --> OUT
  HACKERRANK[scoreHackerRank] --> OUT
  CODECHEF[scoreCodeChef] --> OUT
  KAGGLE[scoreKaggle] --> OUT
  HUGGINGFACE[scoreHuggingFace] --> OUT
```

## 4. Signal Primitive Graph

```mermaid
flowchart LR
  P1[logNorm] --> C1[combineSignals]
  P2[linearNorm] --> C1
  P3[piecewiseNorm] --> C1
  P4[geoMean] --> C1
  P5[recencyFactor] --> C1
  C1 --> S[platform score + confidence]
```

## 5. Domain Resolution and Affinity Application

```mermaid
flowchart TD
  D1[Input domain or archetype] --> D2[normalizeDomain]
  D2 --> D3[Primary affinity vector]
  D4[Secondary archetype/domain optional] --> D5[Secondary affinity vector]
  D3 --> D6[Blend 70/30 if secondary exists]
  D5 --> D6
  D6 --> D7[effectiveWeight = blendedAffinity * (0.35 + 0.65*confidence)]
  D7 --> D8[weighted sum and normalized weights]
```

## 6. Dormant Signal and Active Platform Rule

```mermaid
flowchart TD
  P[platform result] --> Q{score < 0.12 and confidence < 0.28?}
  Q -->|Yes| R[Exclude from weighted aggregation]
  Q -->|No| S[Include in aggregation]
  S --> T{score >= 0.2?}
  T -->|Yes| U[count as active platform]
  T -->|No| V[no active increment]
```

## 7. Raw Ratio and Final Score

```mermaid
flowchart TD
  A1[baseScore = weightedSum / totalWeight] --> A2[breadthBonus = min 0.06, 0.015 * activePlatforms-1]
  A2 --> A3[rawRatio = min 1, baseScore + breadthBonus]
  A3 --> A4[overallScore = round(rawRatio^1.15 * 1000)]
  A4 --> A5[grade mapping]
```

## 8. Pillar Derivation Flow

```mermaid
flowchart LR
  R[platformResults signals] --> P1[problemSolving]
  R --> P2[building]
  R --> P3[community]
  R --> P4[consistency]
  R --> P5[specialization]
  P1 --> LEGACY[toLegacyPillar]
  P2 --> LEGACY
  P3 --> LEGACY
  P4 --> LEGACY
  P5 --> LEGACY
```

## 9. Diagnostics Construction

```mermaid
flowchart TD
  A[Collect all signal entries] --> B[Sort descending by value]
  B --> C[strongestSignals top 5]
  B --> D[weakSignals bottom low-score set]
  C --> E[strengths natural-language strings]
  D --> F[improvements natural-language strings]
  A --> G[domainFitScore from connected affinities]
  A --> H[suggestedDomain from domain score candidates]
  A --> I[unconnected platform recommendations]
```

## 10. Output Contract Diagram

```mermaid
classDiagram
  class DevScoreResponse {
    +overallScore
    +devScore
    +maxScore
    +rawScore
    +weightedRawScore
    +grade
    +archetype
    +secondaryArchetype
    +domain
    +domainLabel
    +connectedPlatforms
    +pillars
    +strengths[]
    +improvements[]
    +platformScores{}
    +diagnostics{}
    +meta{scoringVersion,timestamp}
  }
```

## 11. Edge Case Decision Tree

```mermaid
flowchart TD
  E1[Start compute] --> E2{Any connected platform payloads?}
  E2 -->|No| E3[rawRatio=0 score=0 minimal diagnostics]
  E2 -->|Yes| E4{Platform has sparse optional fields?}
  E4 -->|Yes| E5[Keep nulls and compute with available signals]
  E4 -->|No| E6[Standard full signal compute]
  E5 --> E7{Low confidence and low score?}
  E6 --> E7
  E7 -->|Yes| E8[Exclude dormant platform from weighted sum]
  E7 -->|No| E9[Include platform]
  E8 --> E10[Aggregate and finish]
  E9 --> E10
```

## 12. Case Study Map

```mermaid
quadrantChart
  title Example Candidate Positioning by Raw Ratio and Breadth
  x-axis Narrow evidence --> Broad evidence
  y-axis Low performance --> High performance
  quadrant-1 High Potential Generalists
  quadrant-2 High Potential Specialists
  quadrant-3 Early Stage Profiles
  quadrant-4 Inconsistent Profiles
  BuilderGitHubOnly: [0.25, 0.62]
  CompetitiveFocused: [0.35, 0.80]
  AIRounder: [0.68, 0.78]
  DormantAccount: [0.15, 0.22]
```

## 13. Monitoring and Governance Loop

```mermaid
flowchart LR
  M1[Collect score outputs] --> M2[Track distribution drift]
  M2 --> M3[Inspect strongest and weak signals]
  M3 --> M4[Review domain fit and recommendations]
  M4 --> M5[Refine adapters and weighting constants]
  M5 --> M1
```

## 14. Implementation Guardrails

- Keep API contract fields stable: overallScore, rawScore, weightedRawScore, pillars, platformScores.
- Keep diagnostics keys stable for analytics and recruiter surfaces.
- Keep null vs zero semantics intact for optional signal fidelity.
- Keep score history retention cap consistent across all write paths.