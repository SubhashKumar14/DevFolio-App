# DevFolio — Developer Identity & Analytics Platform

> **A developer-centric platform to track identity, synchronize coding statistics (GitHub, DSA), compute a representative DevScore, and rank developers on global and college-specific leaderboards — with a custom portfolio showcase feature.**

---

## What Is DevFolio?

DevFolio is a full-stack MERN web application that helps developers consolidate their coding identity into one platform. Users register, link their GitHub and DSA platform accounts (LeetCode, Codeforces), and instantly see their synchronized stats, a computed DevScore, and their ranking on leaderboards. The platform also includes a portfolio code editor where developers can showcase their work with live HTML/CSS/JS previews.

Think of it as:
- **A unified developer identity** — GitHub + DSA stats in one place
- **A scoring engine** — DevScore ranks your overall developer profile
- **A portfolio playground** — write and preview HTML/CSS/JS directly on your profile

---

## The Problem It Solves

Developers today have their activity scattered across GitHub, LeetCode, Codeforces, and more. There is no single place to:
- See combined GitHub and DSA statistics
- Get a single numeric score representing developer strength
- Compare yourself against peers on leaderboards
- Showcase a live portfolio without deploying a separate site

DevFolio solves this by syncing data from GitHub and DSA platforms, computing a normalized DevScore, and presenting everything in a clean dashboard with leaderboards, project management, and a portfolio editor.

---

## Who Is It For?

### Developers
- View combined GitHub + DSA stats in one dashboard
- Track DevScore and ranking over time
- Manage projects with auto-fetched GitHub stars
- Build and preview portfolios with live code editor

### Recruiters
- Search and view developer profiles
- See DevScore at a glance for quick evaluation
- View portfolio previews directly on profiles

### Mentors
- Track student progress across GitHub and DSA
- Use college-specific leaderboards to monitor batch performance

### Admins
- Manage users and platform data
- Cascading delete operations for user removal

---

## Core Features

| Feature | Description |
|---|---|
| **Authentication** | Email/password + GitHub OAuth 2.0 with multi-role support (developer, recruiter, mentor, admin) |
| **Developer Profiles** | Dynamic bios, tech stack chips, social links, avatar fallback chain |
| **GitHub Stats Sync** | Commits, public repos, stars received, PR counts via GitHub API |
| **DSA Stats Sync** | LeetCode (easy/medium/hard counts), Codeforces (rating) |
| **DevScore** | Normalized scoring: GitHub 40% + DSA 40% + Portfolio 20% |
| **Projects** | CRUD for personal projects with repo links and auto-fetched GitHub stars |
| **Leaderboards** | Global and college-specific rankings using cached database queries |
| **Portfolio Editor** | Multi-tab HTML/CSS/JS editor with live preview via sandboxed iframe |
| **Developer Comparison** | Radar chart comparison of two developers with shared repo detection |
| **Portfolio Pills** | "Portfolio" indicators on leaderboard, recruiter search, and profiles |

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React JS + Vite + Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP Client | Axios |
| Notifications | React-Hot-Toast / React-Toastify |
| Routing | React Router Dom |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcryptjs + GitHub OAuth 2.0 |
| File Uploads | Multer |
| Scheduled Jobs | node-cron |
| Security | Helmet, CORS, express-rate-limit, DOMPurify, validator |
| Testing | Jest + Supertest + Playwright |

---

## Quick Links to Documentation

| Document | Description |
|---|---|
| [TECH_STACK.md](./TECH_STACK.md) | Every library and tool — what it does and why we use it |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, data flow, design patterns |
| [CONCEPTS_AND_IMPLEMENTATION.md](./CONCEPTS_AND_IMPLEMENTATION.md) | Key concepts, patterns, and implementation details |
| [API_REFERENCE.md](./API_REFERENCE.md) | All REST API endpoints with request/response schemas |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | MongoDB collections, fields, indexes, relationships |
| [INTEGRATIONS.md](./PLATFORM_ADAPTERS.md) | GitHub and DSA platform integrations |
| [FEATURES.md](./FEATURES.md) | Complete feature specifications |
| [UI_UX_DESIGN_SYSTEM.md](./UI_UX_DESIGN_SYSTEM.md) | Design principles, color palette, typography, components |
| [WORKFLOW.md](./WORKFLOW.md) | Git strategy, branching, CI/CD, code review process |
| [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) | How to set up local development from scratch |
| [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Complete project directory structure |
| [ROADMAP.md](./ROADMAP.md) | Development roadmap with phased tasks |

---

## License

MIT License — open source, free to use, modify, and distribute.

---

*Built with ❤️ for the developer community.*
