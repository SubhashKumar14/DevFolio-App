# UI and UX Design System

Last updated: 2026-03-29

## Design Intent

DevFolio UI emphasizes:

- data readability for engineering metrics
- high information density without losing clarity
- consistent card-shell language across dashboard modules
- platform-colored semantics for analytics scanning

## Theme System

Source of truth:

- client/src/index.css
- client/src/stores/themeStore.js
- client/tailwind.config.js

Theme modes:

- light
- dark
- system-derived fallback

Core CSS variables:

- --background
- --card
- --card-elevated
- --border
- --muted
- --foreground
- --foreground-bright
- --glass-bg
- --glass-border
- --heatmap-empty
- --accent-cyan
- --accent-purple
- --accent-green
- --accent-red
- --accent-yellow
- --accent-orange

## Typography

- Primary: Inter
- Monospace: JetBrains Mono

Usage:

- body and standard UI text use Inter
- numerical/log/diagnostic snippets use mono utility class

## Visual Language

### Surface hierarchy

- background: app-level canvas
- card: standard component container
- card-elevated: nested panel/highlight container
- glass-card: translucent emphasized surfaces for hero analytics blocks

### Accent usage

- cyan and purple are dominant analytical accents
- green/yellow/red/orange communicate status and warnings
- platform colors are used in charts and platform cards

### Motion

Available utility animations:

- animate-fade-in
- animate-slide-up
- animate-staggered-enter
- animate-marquee

Principles:

- short transitions for feedback
- avoid long blocking motion on data-heavy views

## Component Patterns

### Layout shells

- RootLayout for public and simple authenticated routes
- DashboardLayout for navigation + content + footer shell

### Data cards

Common card composition:

- title/meta header
- primary metric or visual
- secondary contextual details
- optional action row

### Charts and heatmaps

- Recharts for leaderboard/compare/analytics visualizations
- custom ActivityHeatmap for cross-platform activity density
- fallback and empty states for disconnected platforms

### Portfolio UI

- editor + preview split
- iframe-based render isolation
- console output panel for live preview troubleshooting

## Accessibility and Usability Notes

Current strengths:

- focus-visible outline styling present
- clear contrast pairs in dark mode
- consistent spacing and typography hierarchy

Known improvements needed:

- several avatar images still use empty alt text and should be improved
- keyboard interactions can be expanded in some visualization components
- more explicit aria semantics can be added for complex chart widgets

## Responsive Behavior

- dashboard grid adapts from single to multi-column across breakpoints
- sidebar collapses for mobile drawer interaction
- major analytics components are designed to avoid forced horizontal overflow

## Design Tokens (Tailwind Mapping)

Tailwind maps CSS variables into utility names:

- colors.background, colors.card, colors.border, colors.muted, colors.foreground
- colors.accent.cyan/purple/green/red/yellow/orange
- fontFamily.sans and fontFamily.mono
- gradient utility: bg-gradient-devscore

## UX Consistency Rules

When adding new UI modules:

1. use card or glass-card patterns to stay visually consistent
2. use existing accent token palette before introducing new colors
3. provide loading, empty, and error states
4. include responsive behavior from first implementation
5. ensure route-level pages have clear title and descriptive subtitle

## Cross-References

- [FEATURES.md](./FEATURES.md)
- [platform_analytics_catalog.md](./platform_analytics_catalog.md)
- [WORKFLOW.md](./WORKFLOW.md)
