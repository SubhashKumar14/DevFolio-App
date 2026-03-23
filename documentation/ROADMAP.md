# DevFolio — Development Roadmap

> Development timeline broken into 4 phases — from foundation to full feature set.

---

## Phase Overview

| Phase | Focus | Milestone |
|---|---|---|
| **Phase 1** | Foundation + Auth + Profiles | Basic auth, user profiles, database setup |
| **Phase 2** | GitHub + DSA Integration + DevScore | Stats syncing, DevScore computation |
| **Phase 3** | Projects + Leaderboards | Project CRUD, global + college rankings |
| **Phase 4** | Portfolio Editor + Comparison | Code editor, live preview, developer comparison |

---

## Phase 1 — Foundation (Weeks 1–3)

### Week 1: Project Setup & Auth

| Task | Details |
|---|---|
| Init project structure | `client/` (Vite + React), `server/` (Express) |
| Express server | App setup, middleware (Helmet, CORS, rate-limit, JSON parsing) |
| MongoDB connection | Mongoose setup, User schema, indexes |
| Auth endpoints | `POST /register`, `POST /login`, `POST /refresh`, `POST /logout` |
| JWT + bcryptjs | Token sign/verify, password hashing, refresh token flow |
| Error handling | Custom `AppError` class, centralized error middleware, async handler |
| Vite + React init | Create Vite app, Tailwind CSS setup |

**Deliverable:** User can register, login, and receive JWT tokens.

---

### Week 2: Profiles & GitHub OAuth

| Task | Details |
|---|---|
| Profile model | Mongoose schema: bio, tech stack, social links, college, avatar |
| Profile endpoints | `GET /api/profile/:userId`, `PUT /api/profile/me` |
| GitHub OAuth setup | Register OAuth app, implement authorization + callback flow |
| GitHub account linking | Store `githubId`, `githubUsername` on User model |
| Context API setup | AuthContext, ThemeContext, UserInfoContext |
| Auth pages | Login + Register forms with validation |
| Axios client | Instance with request/response interceptors |

**Deliverable:** Login/register working E2E, GitHub account linkable.

---

### Week 3: Dashboard Foundation

| Task | Details |
|---|---|
| Dashboard page | Basic layout with stat cards |
| Navbar | Navigation with auth-aware links |
| Theme system | Dark mode default, class-based toggle |
| Protected routes | Auth guard component |
| Profile page | View user profile with bio, tech stack, social links |

**Deliverable:** Basic dashboard and profile pages functional.

---

## Phase 2 — Stats & Scoring (Weeks 4–6)

### Week 4: GitHub & DSA Stats Integration

| Task | Details |
|---|---|
| GitHub service | Fetch commits, repos, stars, PRs via GitHub REST API |
| GithubStats model | Mongoose schema with sync metadata |
| LeetCode service | GraphQL query for problem counts (easy/medium/hard) |
| Codeforces service | REST API for rating, max rating, rank |
| DsaStats model | Combined LeetCode + Codeforces schema |
| DSA connect endpoint | Link LeetCode/Codeforces usernames |
| Manual sync endpoint | `POST /api/stats/sync` |

**Deliverable:** GitHub and DSA stats fetching via API.

---

### Week 5: DevScore Engine

| Task | Details |
|---|---|
| DevScore algorithm | Weighted scoring: GitHub 40% + DSA 40% + Portfolio 20% |
| DevScore model | Schema with breakdown and history |
| Score endpoints | `GET /api/score/:userId`, `GET /api/score/:userId/history` |
| ScoreBadge component | Display DevScore + breakdown on dashboard |
| StatsCard component | Individual stat display cards |
| Charts | Recharts BarChart for DSA breakdown |

**Deliverable:** DevScore computed and visible on dashboard.

---

### Week 6: Cron Sync & Polish

| Task | Details |
|---|---|
| node-cron setup | Nightly sync at 2am for GitHub + DSA stats |
| Sync status | Show last synced time, loading states |
| Dashboard polish | Responsive layout, loading skeletons |
| Error handling | Graceful degradation when APIs are down |

**Deliverable:** Automated stat syncing with polished dashboard.

---

## Phase 3 — Projects & Leaderboards (Weeks 7–9)

### Week 7: Projects

| Task | Details |
|---|---|
| Project model | Schema: name, description, repo link, tech stack, stars |
| Project CRUD endpoints | Create, read, update, delete |
| Auto-fetch GitHub stars | Fetch star count for linked repos |
| ProjectCard component | Display project with tech tags and actions |
| Projects page | List and manage projects |

**Deliverable:** Project management fully functional.

---

### Week 8: Leaderboards

| Task | Details |
|---|---|
| Leaderboard endpoint | Aggregation pipeline, sort by DevScore, pagination |
| College filter | Filter by `profile.college` field |
| Leaderboard page | Table with rank, avatar, name, score |
| User highlight | Highlight current user's rank |
| Portfolio pill | "Portfolio" indicator for users with published portfolios |

**Deliverable:** Global and college-specific leaderboards live.

---

### Week 9: Search & Recruiter Views

| Task | Details |
|---|---|
| Recruiter endpoints | `GET /api/recruiter/search` with filters |
| Search page | Search developers by name, tech stack, college |
| Profile enhancement | Public profile view for recruiters |
| Admin endpoints | User management, cascading deletes |

**Deliverable:** Recruiter search and admin features working.

---

## Phase 4 — Portfolio & Comparison (Weeks 10–12)

### Week 10: Portfolio Editor

| Task | Details |
|---|---|
| PortfolioCode model | Schema: rawHtml, htmlContent, cssContent, jsContent, isPublic |
| Portfolio endpoints | Save, get, toggle visibility |
| DOMPurify sanitization | Server-side HTML sanitization |
| EditorHeader component | Tab navigation (HTML/CSS/JS) + Save button |
| CodePanel component | Textarea input for code |
| LivePreview component | iframe with sandbox for live rendering |
| combineCode utility | Merge HTML+CSS+JS into single document |
| Debouncing | 300ms debounce on input |
| useBeforeUnload | Warn on unsaved changes |

**Deliverable:** Portfolio code editor with live preview.

---

### Week 11: Developer Comparison

| Task | Details |
|---|---|
| Compare endpoint | `GET /api/compare/:userId1/:userId2` |
| Radar chart | Recharts RadarChart for comparison |
| Shared repo detection | Find common GitHub repos |
| Compare page | Side-by-side layout with radar chart |

**Deliverable:** Developer comparison with radar chart.

---

### Week 12: Testing & Deployment

| Task | Details |
|---|---|
| Unit tests | Jest: DevScore computation, sanitizer, utilities |
| Integration tests | Supertest: auth, portfolio, leaderboard endpoints |
| E2E tests | Playwright: signup → connect → dashboard flow |
| Performance | Lighthouse audit, lazy loading |
| Vercel deploy | Frontend with custom domain |
| Railway deploy | Backend API |
| MongoDB Atlas | Production cluster |
| Documentation | Final review of all docs |

**Deliverable:** DevFolio live in production.

---

## Post-Launch (Ongoing)

| Item | Timeline |
|---|---|
| Bug fixes from user feedback | Week 13–14 |
| Mobile responsive polish | Week 14–15 |
| Mentor dashboard | Week 15–16 |
| College group management | Week 16–18 |
| Additional DSA platforms | Week 18+ |

---

*This roadmap is realistic for a focused developer. Adjust timelines based on your pace — the phase sequence matters more than exact weeks.*
