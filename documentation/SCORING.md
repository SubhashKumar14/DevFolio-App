# DevScore v2.0 Scoring Documentation (Diagram First)

This document captures the scoring architecture, math primitives, domain weighting, and output contracts.

## Theoretical Foundation
Scoring is grounded in multi-criteria evaluation and explainable ranking theory.

- Signal normalization is required for fair cross-platform comparison.
- Weighted aggregation should reflect both domain relevance and evidence quality.
- Explainability outputs are first-class to preserve trust in ranking outcomes.

## 1. Scoring Architecture

```mermaid
flowchart LR
  IN[Platform data from stats collections] --> NORM[Signal normalization]
  NORM --> PS[Per-platform scorers]
  PS --> DA[Domain and confidence weighted aggregation]
  DA --> TR[Nonlinear transform to 0..1000]
  TR --> OUT[Score + pillars + diagnostics + platformScores]
```

## 2. Supported Platforms

```mermaid
flowchart TD
  P1[GitHub]
  P2[LeetCode]
  P3[Codeforces]
  P4[HackerRank]
  P5[CodeChef]
  P6[Kaggle]
  P7[Hugging Face]
```

## 3. Pipeline Steps

```mermaid
flowchart TD
  S1[Build platformData payload] --> S2[Run scorer per connected platform]
  S2 --> S3[Attach confidence and signal map]
  S3 --> S4[Apply domain affinity weights]
  S4 --> S5[Drop dormant low-confidence signals]
  S5 --> S6[Aggregate rawRatio and breadth bonus]
  S6 --> S7[Transform to DevScore]
  S7 --> S8[Compute pillars]
  S8 --> S9[Generate diagnostics strengths improvements]
```

## 4. Core Math Primitives

```mermaid
flowchart LR
  M1[logNorm value softCap] --> M5[Normalization result]
  M2[linearNorm value cap] --> M5
  M3[piecewiseNorm tiers] --> M5
  M4[recencyFactor halfLife] --> M6[Recency-adjusted signal]
  M5 --> M7[combineSignals weighted mean]
  M6 --> M7
```

## 5. Domain and Archetype Model

```mermaid
flowchart TD
  A1[archetype] --> D1[domain resolution]
  A2[secondaryArchetype optional] --> D2[secondary domain]
  D1 --> W[affinity matrix lookup]
  D2 --> W
  W --> E[effectiveWeight = affinity * confidence factor]
  E --> AGG[weighted platform aggregation]
```

## 6. Pillar Construction

```mermaid
flowchart LR
  P[platform signal entries] --> PS1[problemSolving]
  P --> PS2[building]
  P --> PS3[community]
  P --> PS4[consistency]
  P --> PS5[specialization]
  PS1 --> LP[legacy pillar envelope score/max/percentile/grade]
  PS2 --> LP
  PS3 --> LP
  PS4 --> LP
  PS5 --> LP
```

## 7. Final Score and Grade

```mermaid
flowchart TD
  R[rawRatio in 0..1] --> T[score = round((rawRatio^1.15)*1000)]
  T --> G{grade mapping}
  G --> GS[S >= 920]
  G --> GA[A+ >= 820]
  G --> GB[A >= 700]
  G --> GC[B+ >= 580]
  G --> GD[B >= 450]
  G --> GE[C+ >= 300]
  G --> GF[C >= 180]
  G --> GG[D otherwise]
```

## 8. Diagnostics Contract

```mermaid
classDiagram
  class Diagnostics {
    +selectedDomain
    +selectedDomainLabel
    +strongestSignals[]
    +weakSignals[]
    +domainFitScore
    +suggestedDomain
    +unconnectedPlatformRecommendations[]
    +totalConfidence
    +connectedPlatforms[]
    +activePlatforms[]
    +domainFitCandidates[]
  }
```

## 9. Output Envelope

| Field | Meaning |
|---|---|
| overallScore | Final DevScore 0..1000 |
| rawScore | Pre-transform ratio scaled to 0..100 |
| weightedRawScore | Current weighted raw score (0..100) |
| pillars | Five-pillar legacy-compatible object |
| platformScores | Per-platform score, confidence, normalized weight |
| strengths | Top positive signals in readable text |
| improvements | Weak areas and connect-platform recommendations |
| diagnostics | Deep explainability payload |

## 10. Guardrails

- Keep legacy pillar envelope shape to avoid frontend regressions.
- Preserve platformScores fields expected by analytics and compare surfaces.
- Do not force absent optional platform metrics to zero during normalization.
- Keep score history bounded by retention policy in write paths.