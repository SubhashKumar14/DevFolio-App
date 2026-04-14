# Platform Adapters (Diagram First)

This document defines adapter architecture, contract, and per-platform flow.

## Theoretical Foundation
Platform integration uses anti-corruption layer and adapter pattern principles.

- External schema volatility is absorbed at the adapter boundary.
- Normalized internal contracts preserve scoring and analytics stability.
- Graceful degradation ensures partial failures do not collapse the full sync pipeline.

## 1. Adapter Architecture

```mermaid
flowchart LR
  SYNC[Sync trigger: user or admin] --> ORCH[Integration and stats services]
  ORCH --> GH[GitHub adapter]
  ORCH --> LC[LeetCode adapter]
  ORCH --> CF[Codeforces adapter]
  ORCH --> HR[HackerRank adapter]
  ORCH --> CC[CodeChef adapter]
  ORCH --> KG[Kaggle adapter]
  ORCH --> HF[Hugging Face adapter]
  ORCH --> CONTEST[Contest adapter]

  GH --> DB[(Stats collections)]
  LC --> DB
  CF --> DB
  HR --> DB
  CC --> DB
  KG --> DB
  HF --> DB
  CONTEST --> CACHE[(Contest feed response)]
```

## 2. Adapter Contract UML

```mermaid
classDiagram
  class AdapterRequest {
    +userId
    +platform handles or OAuth token
    +request metadata
  }

  class AdapterResponse {
    +platformId
    +normalized payload
    +lastSyncedAt
    +quality flags
    +errors[]
  }

  class AdapterService {
    +connect()
    +disconnect()
    +sync()
    +normalize()
    +persist()
  }

  class DevScoreInput {
    +github
    +leetcode
    +codeforces
    +hackerrank
    +codechef
    +kaggle
    +huggingface
  }

  AdapterRequest --> AdapterService
  AdapterService --> AdapterResponse
  AdapterResponse --> DevScoreInput
```

## 3. End-To-End Sync Sequence

```mermaid
sequenceDiagram
  participant Client
  participant API
  participant Queue
  participant Adapter
  participant Model as Stats Models
  participant Score as DevScore Engine

  Client->>API: POST /api/stats/sync
  API->>Queue: enqueue sync job
  Queue->>Adapter: run each connected platform adapter
  Adapter->>Model: save normalized stats
  Queue->>Score: computeDevScore(platformData)
  Score->>Model: persist DevScore snapshot
  API-->>Client: job id / completion response
```

## 4. Per-Adapter Coverage Diagram

```mermaid
flowchart TD
  P1[GitHub] --> G1[commits contributions repos stars prs issues streak languages calendar]
  P2[LeetCode] --> L1[easy medium hard contest rating top percentage daily activity]
  P3[Codeforces] --> C1[current max rating rank contests results tags daily submissions]
  P4[HackerRank] --> H1[stars badges level domains contest activity]
  P5[CodeChef] --> C2[stars rating contests solved global rank]
  P6[Kaggle] --> K1[tier medals notebooks datasets competitions followers]
  P7[Hugging Face] --> H2[models datasets spaces downloads likes followers pipelines]
  P8[Contest] --> T1[upcoming contest feed]
```

## 5. Error Handling State Model

```mermaid
stateDiagram-v2
  [*] --> Requested
  Requested --> Running
  Running --> Normalized: fetch and transform success
  Running --> Partial: one or more platform fetch failures
  Partial --> Normalized: fallback values or cached payload
  Running --> Failed: unrecoverable error
  Normalized --> Persisted
  Persisted --> ScoreRecomputed
  ScoreRecomputed --> Completed
  Failed --> Completed
```

## 6. Adapter Invariants

- Adapters produce normalized payloads, not UI-formatted responses.
- Missing optional metrics stay null when unknown, not forced to zero.
- Sync can proceed partially and still recompute score from available signals.
- Disconnect supports PATCH and POST aliases for client compatibility.