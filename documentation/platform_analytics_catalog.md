# Platform Analytics Catalog

Last updated: 2026-03-29

## Purpose

This catalog lists what analytics signals are available per platform and how they are presented in the UI.

## Platform Scope

Current first-class analytics coverage:

- GitHub
- LeetCode
- Codeforces
- HackerRank
- CodeChef
- Kaggle
- Hugging Face

## Shared Analytics Components

- ActivityHeatmap (cross-platform and per-platform views)
- StreakCounter
- PlatformCard grid
- DevScore pillar breakdown card
- Platform diagnostics cards

## Data Sources by Platform

| Platform | Primary Model Source | Adapter |
| --- | --- | --- |
| GitHub | GithubStats | githubService.js |
| LeetCode | DsaStats.leetcode | leetcodeService.js |
| Codeforces | DsaStats.codeforces | codeforcesService.js |
| HackerRank | PlatformStats.hackerrank | hackerrankService.js |
| CodeChef | PlatformStats.codechef | codechefService.js |
| Kaggle | PlatformStats.kaggle | kaggleService.js |
| Hugging Face | PlatformStats.huggingface | huggingfaceService.js |

## Metric Catalog by Platform

### GitHub

Key metrics:

- contributions last year/all time
- total commits
- public repos
- stars received
- pull requests total/merged
- issues opened/closed
- followers
- language distribution
- contribution calendar
- current and longest streak

Visuals:

- activity heatmap cells
- contribution trends
- language charts
- platform summary cards

### LeetCode

Key metrics:

- solved counts by difficulty
- total solved
- contest rating and global rank
- acceptance rate
- badges earned
- active days and streaks
- daily activity
- tag/language distributions

Visuals:

- solved breakdown chart
- contest and quality signal cards
- activity trend components
- heatmap integration

### Codeforces

Key metrics:

- current and max rating
- rank
- total solved
- contest participation count
- rating history
- recent contest results
- daily submissions
- tag distribution

Visuals:

- rating trend chart
- contest history summary
- submission activity views
- heatmap integration

### HackerRank

Key metrics:

- total badges
- total stars
- domain scores
- contest ranking
- contests participated
- tier-like badge breakdown

Visuals:

- badge/star summary cards
- domain score snapshots
- heatmap integration where daily data exists

### CodeChef

Key metrics:

- current rating
- stars/starsCount
- highest rating
- global/country ranks
- problems solved
- contest count
- fully/partially solved counters

Visuals:

- rating and rank cards
- solved vs contest snapshots
- platform summary panel

### Kaggle

Key metrics:

- tier
- total medals and medal category breakdowns
- competition count
- notebooks/datasets count
- notebook votes
- dataset downloads
- followers
- ranking

Visuals:

- medal summary cards
- rank and impact panels
- platform contribution displays

### Hugging Face

Key metrics:

- models published
- datasets published
- spaces created
- model + dataset downloads
- total downloads
- total likes
- followers/following
- organizations
- top models

Visuals:

- publication counts
- adoption metrics (downloads/likes)
- model spotlight snippets

## Heatmap Behavior Notes

ActivityHeatmap supports:

- all-time and year-specific activity windows
- cross-platform blending using HSL circular averaging for lower platform counts
- striped rendering mode for multi-platform overlap scenarios
- portal tooltip rendering to avoid clipping behind neighboring cards

## Diagnostic Metrics

From DevScore diagnostics output:

- strongestSignals
- weakSignals
- domainFitScore
- unconnectedPlatformRecommendations
- platformScores map

Used in dashboard and analytics surfaces for action-oriented guidance.

## Fallback and Empty-State Rules

- if platform not connected: omit platform-specific cards and deep sections
- if platform connected but no data: show zero/empty placeholders with non-crashing fallback
- if adapter call fails during sync: keep last known stats and continue overall sync flow

## Query and Tab Behavior

- Analytics page supports URL query platform selection: /dashboard/analytics?platform=<id>
- connected-platform scope determines which tabs/sections are rendered
- platform constants are centralized in client/src/lib/constants.js

## Cross-References

- [FEATURES.md](./FEATURES.md)
- [PLATFORM_ADAPTERS.md](./PLATFORM_ADAPTERS.md)
- [API_REFERENCE.md](./API_REFERENCE.md)
- [UI_UX_DESIGN_SYSTEM.md](./UI_UX_DESIGN_SYSTEM.md)
