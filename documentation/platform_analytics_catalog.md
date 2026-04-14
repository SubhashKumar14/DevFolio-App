# Platform Analytics Catalog (Diagram First)

This catalog documents analytics components, platform metrics, and rendering behavior.

## Theoretical Foundation
Analytics design follows observability and metric-semantics principles.

- Metrics are valuable only when tied to clear interpretation models.
- Temporal aggregation must preserve trend meaning and comparability.
- Visualization should expose uncertainty and missing-data conditions explicitly.

## 1. Analytics Architecture

```mermaid
flowchart LR
  UI[Analytics page tabs and cards] --> API1[/api/score/:userId/benchmark]
  UI --> API2[/api/stats/github/:userId]
  UI --> API3[/api/stats/dsa/:userId]
  UI --> API4[/api/stats/platforms/:userId]
  UI --> API5[/api/score/:userId and history]

  API1 --> SCORE[(DevScore)]
  API2 --> GH[(GithubStats)]
  API3 --> DSA[(DsaStats)]
  API4 --> PLATFORM[(PlatformStats)]
  API5 --> SCORE
```

## 2. Shared Analytics Components

```mermaid
classDiagram
  class AnalyticsPage {
    +overview cards
    +connected platform tabs
    +deep platform sections
  }
  class ActivityHeatmap {
    +all-time and year modes
    +single and multi-platform blending
    +tooltip portal rendering
  }
  class PlatformBreakdown {
    +platform-specific visuals
    +trend charts
    +signal summaries
  }
  class ScoreCards {
    +overall score
    +pillars
    +benchmark and history
  }

  AnalyticsPage --> ActivityHeatmap
  AnalyticsPage --> PlatformBreakdown
  AnalyticsPage --> ScoreCards
```

## 3. Metric Coverage By Platform

```mermaid
flowchart TD
  G[GitHub metrics] --> G1[contributions streak prs issues stars language mix]
  L[LeetCode metrics] --> L1[solved mix contest rating acceptance top percentage]
  C[Codeforces metrics] --> C1[rating max rank contests trajectory]
  H[HackerRank metrics] --> H1[stars badges levels domains]
  CC[CodeChef metrics] --> CC1[rating stars solved contests rank]
  K[Kaggle metrics] --> K1[tier medals notebook impact dataset impact]
  HF[Hugging Face metrics] --> HF1[models datasets spaces downloads likes followers]
```

## 4. Connected Platform Scope Rules

```mermaid
flowchart TD
  A[Connected platform list] --> B[Render only connected platform tabs]
  B --> C[Compute overview cards from connected platforms]
  C --> D[Combined heatmap only for connected platforms]
  D --> E[Hide unconnected platform deep sections]
```

## 5. Heatmap Rendering Model

```mermaid
flowchart LR
  D1[Daily activity points] --> D2[Year and all-time bucketing]
  D2 --> D3{Platform count per day}
  D3 -->|1| C1[Single color intensity]
  D3 -->|2-3| C2[HSL blended hue]
  D3 -->|4+| C3[Dual-color stripe logic]
  C1 --> T[Tooltip via portal]
  C2 --> T
  C3 --> T
```

## 6. Analytics Query and Tab Behavior

```mermaid
sequenceDiagram
  participant User
  participant Router
  participant Analytics
  participant API

  User->>Router: /dashboard/analytics?platform=id
  Router->>Analytics: parse selected platform
  Analytics->>API: load benchmark + stats payloads
  API-->>Analytics: connected platforms and metrics
  Analytics-->>User: overview then deep-dive tab
```

## 7. Diagnostic and Empty-State Rules

- If platform payload is missing, show empty state with connect guidance.
- If only one platform is connected, keep all overview cards scoped to that platform.
- Preserve zeros with nullish handling so valid zero metrics are not hidden.
- Use chart wrappers that wait for positive width and height before rendering.