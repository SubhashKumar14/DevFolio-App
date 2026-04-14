# UI and UX Design System (Diagram First)

This document describes visual tokens, component architecture, and UX interaction flows.

## Theoretical Foundation
UX system design applies cognitive-load management and consistency heuristics.

- Recognition-over-recall patterns reduce user effort on dense analytics surfaces.
- Semantic token systems preserve visual coherence across themes and states.
- Accessibility principles ensure inclusivity under different devices and abilities.

## 1. Design Intent Model

```mermaid
flowchart LR
  I[Design intent] --> C1[Clear data hierarchy]
  I --> C2[Platform signal visibility]
  I --> C3[Role-aware navigation]
  I --> C4[Fast feedback and resilient states]
```

## 2. Theme and Token Architecture

```mermaid
flowchart TD
  T0[themeStore: light dark system] --> T1[documentElement class toggle]
  T1 --> T2[CSS variables]
  T2 --> T3[Tailwind semantic colors]
  T3 --> T4[background card border foreground accent platform]
  T4 --> T5[Components consume semantic tokens]
```

## 3. Token-to-Component Mapping

```mermaid
classDiagram
  class ThemeTokens {
    +background
    +card
    +cardElevated
    +border
    +foreground
    +muted
    +accentCyanPurpleGreenRed
    +platform colors
  }
  class LayoutShell {
    +RootLayout
    +DashboardLayout
    +Sidebar
    +Navbar
  }
  class DataCards {
    +StatsCard
    +PlatformCard
    +QuickStats
    +ScoreBadge
  }
  class Visualizations {
    +ActivityHeatmap
    +Recharts wrappers
  }
  class Forms {
    +input
    +label
    +button
  }

  ThemeTokens --> LayoutShell
  ThemeTokens --> DataCards
  ThemeTokens --> Visualizations
  ThemeTokens --> Forms
```

## 4. Interaction Flow Standards

```mermaid
sequenceDiagram
  participant User
  participant UI
  participant State as Zustand and Query cache
  participant API

  User->>UI: Interact with form or action button
  UI->>State: optimistic local state where safe
  UI->>API: async request
  API-->>UI: success or error payload
  UI->>State: reconcile cache and auth state
  UI-->>User: toast feedback + updated view
```

## 5. Surface Hierarchy

```mermaid
flowchart TD
  S1[Page shell] --> S2[Section containers]
  S2 --> S3[Cards and charts]
  S3 --> S4[Interactive controls]
  S4 --> S5[Micro states: loading empty error success]
```

## 6. Responsive Behavior Model

```mermaid
flowchart LR
  M[Mobile] --> M1[Stacked sections]
  M --> M2[Condensed nav patterns]
  T[Tablet] --> T1[Two-column content where possible]
  D[Desktop] --> D1[Sidebar persistent navigation]
  D --> D2[Dense analytics grid]
```

## 7. Motion and Feedback Rules

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Loading: request starts
  Loading --> Success: response ok
  Loading --> Error: response failed
  Error --> Idle: retry or dismiss
  Success --> Idle
```

## 8. Accessibility and Usability Checklist

- Keep semantic color tokens consistent across light and dark theme.
- Preserve readable contrast for card, text, and border surfaces.
- Provide keyboard reachable controls for all critical actions.
- Ensure chart containers render only when dimensions are valid.
- Render floating tooltips in portal layer to avoid clipping.