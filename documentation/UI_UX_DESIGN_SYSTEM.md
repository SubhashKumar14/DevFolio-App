# DevFolio — UI/UX Design System

> Visual language, color palette, typography, component specs, layout system, and page layouts.

---

## Design Philosophy

- **Dark-first** — default theme is dark; light mode available via toggle
- **Glassmorphism** — frosted glass card surfaces with subtle borders
- **Data-dense but clean** — lots of information without visual clutter
- **Utility-first styling** — Tailwind CSS for rapid, consistent design

---

## Color Palette

### Dark Theme (Primary)

| Token | Hex | Usage |
|---|---|---|
| `background` | `#0a0a0f` | Page background |
| `card` | `#12121a` | Card surfaces |
| `card-elevated` | `#1a1a2e` | Modals, dropdowns |
| `border` | `#2a2a3e` | Card/section borders |
| `muted` | `#6b7280` | Secondary text |
| `foreground` | `#e5e7eb` | Primary text |
| `foreground-bright` | `#f9fafb` | Headings |

### Accent Colors

| Token | Hex | Usage |
|---|---|---|
| `accent-cyan` | `#06b6d4` | Primary actions, links, active states |
| `accent-purple` | `#8b5cf6` | Secondary accents, DevScore badges |
| `accent-green` | `#22c55e` | Success states, easy problems |
| `accent-red` | `#ef4444` | Error states, hard problems |
| `accent-yellow` | `#eab308` | Warnings, medium problems |
| `accent-orange` | `#f97316` | Highlights |

### Gradient (Hero / DevScore)

```css
background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%);
/* cyan → purple → pink — used for hero headers and DevScore badge */
```

---

## Typography

| Element | Font | Size | Weight |
|---|---|---|---|
| **Headings (h1–h3)** | Inter | 32/24/20px | 700 (bold) |
| **Body text** | Inter | 14–16px | 400 (regular) |
| **Code / numbers** | JetBrains Mono | 13–14px | 400 |
| **Small labels** | Inter | 12px | 500 (medium) |
| **Stat numbers** | Inter | 28–36px | 700 |

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

---

## Spacing System

Tailwind's default 4px scale:

| Token | Value | Usage |
|---|---|---|
| `p-2` | 8px | Inner padding of small elements |
| `p-4` | 16px | Card inner padding |
| `p-6` | 24px | Section padding |
| `gap-4` | 16px | Grid gap between cards |
| `gap-6` | 24px | Gap between sections |
| `rounded-lg` | 8px | Default border radius |
| `rounded-xl` | 12px | Cards |
| `rounded-2xl` | 16px | Feature cards |

---

## Component Specifications

### ScoreBadge

```
┌─────────────────┐
│    847 / A       │  ← DevScore + letter grade
│  ████████████░░  │  ← Progress bar
│  GitHub: 85      │  ← Breakdown
│  DSA: 92         │
│  Portfolio: 60   │
└─────────────────┘
```

### StatsCard

```
┌─────────────────────────────┐
│ ⬡ Icon                      │
│                             │
│  1,247                      │  ← Large stat number (36px, bold)
│  Total Commits              │  ← Label (12px, muted)
└─────────────────────────────┘

Width: 200px (flex)
Background: bg-slate-800/50 backdrop-blur-sm
Border: 1px solid border color
```

### ProjectCard

```
┌──────────────────────────────────────────┐
│  DevFolio                     ⭐ 23      │  ← Name + stars
│──────────────────────────────────────────│
│  Developer analytics platform            │
│                                          │
│  [React] [Node.js] [MongoDB]            │  ← Tech stack chips
│                                          │
│  [View Repo]  [Live Demo]              │  ← Action buttons
└──────────────────────────────────────────┘
```

### Portfolio Editor Layout

```
┌──────────────────────────────────────────────────────────┐
│  [HTML] [CSS] [JS]                          [💾 Save]    │  ← EditorHeader
├──────────────────────────────┬───────────────────────────┤
│                              │                           │
│   Code Panel                 │   Live Preview            │
│   (textarea)                 │   (sandboxed iframe)      │
│                              │                           │
│                              │                           │
│                              │                           │
│                              │                           │
└──────────────────────────────┴───────────────────────────┘

Split: 50/50 horizontal
```

### Developer Comparison Layout

```
┌──────────────────────────────────────────────────────────┐
│  Compare Developers                                      │
├──────────────────┬───────────────┬───────────────────────┤
│                  │               │                       │
│  User 1 Stats    │  Radar Chart  │  User 2 Stats         │
│                  │  (Recharts)   │                       │
│  GitHub: 85      │               │  GitHub: 72           │
│  DSA: 92         │               │  DSA: 88              │
│  Portfolio: 60   │               │  Portfolio: 0         │
│                  │               │                       │
├──────────────────┴───────────────┴───────────────────────┤
│  Shared Repos: [react-utils] [node-starter]              │
└──────────────────────────────────────────────────────────┘
```

### Navbar

```
┌─────────────────────────────────────────────────────────────┐
│  🔷 DevFolio     Dashboard  Leaderboard  Portfolio  [Avatar]│
└─────────────────────────────────────────────────────────────┘

Position: sticky top
Background: bg-slate-900/80 backdrop-blur
Border-bottom: 1px solid border
Height: 64px
```

---

## Page Layouts

### Dashboard

```
┌─────────────────────────────────────────────────────┐
│  NavBar                                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Welcome back, John 👋                              │
│                                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │ 1247│ │  42 │ │ 647 │ │ 847 │                  │
│  │Commi│ │Repos│ │LC   │ │Score│                  │
│  └─────┘ └─────┘ └─────┘ └─────┘                  │
│                                                     │
│  ┌──────────────────────┐ ┌──────────────────┐      │
│  │  DSA Breakdown       │ │  DevScore        │      │
│  │  (Bar Chart)         │ │  (ScoreBadge)    │      │
│  └──────────────────────┘ └──────────────────┘      │
│                                                     │
│  ┌──────────────────────────────────────────┐       │
│  │  Your Projects                           │       │
│  │  [ProjectCard] [ProjectCard]             │       │
│  └──────────────────────────────────────────┘       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Leaderboard

```
┌─────────────────────────────────────────────────────┐
│  NavBar                                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🏆 Leaderboard     [Global ▾]  [Filter: College]  │
│                                                     │
│  ┌──────────────────────────────────────────┐       │
│  │ # │ Avatar │ Name    │ Score │ Portfolio │       │
│  │─────────────────────────────────────────│       │
│  │ 1 │  🟢   │ Alice   │  920  │  💼       │       │
│  │ 2 │  🔵   │ Bob     │  890  │           │       │
│  │ 3 │  ★    │ YOU     │  847  │  💼       │       │
│  └──────────────────────────────────────────┘       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| `sm` | ≥640px | 1 column, compact cards |
| `md` | ≥768px | 2 columns |
| `lg` | ≥1024px | 3 columns (main layout) |
| `xl` | ≥1280px | 3 columns + sidebar |

---

## Dark/Light Theme Toggle

```javascript
// Tailwind config — class-based dark mode
module.exports = {
  darkMode: 'class',
};

// ThemeContext toggle
function toggleTheme() {
  const newTheme = theme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  document.documentElement.classList.toggle('dark', newTheme === 'dark');
}
```

---

## Animation Guidelines

| Context | Animation | Duration |
|---|---|---|
| Page transition | CSS fade-in | 300ms |
| Card hover | translateY(-2px) + shadow | 200ms |
| Loading states | `animate-pulse` (Tailwind) | Infinite |
| Toast notification | Slide in from top | 300ms |
| Score counter | CSS counter animation | 1000ms |

---

## Accessibility

- All interactive elements have `:focus-visible` outlines
- Colors meet WCAG AA contrast ratio (4.5:1 minimum)
- All images/icons have `alt` text or `aria-label`
- Keyboard navigation supported for all interactive elements

---

*This design system ensures visual consistency, accessibility, and a premium developer experience across every page of DevFolio, using only Tailwind CSS for styling.*
