# DevFolio — Project Summary & Blueprint

> Complete blueprint of the DevFolio platform — what it is, how it works, and how to build it.

---

## 1. What DevFolio Does

A MERN-stack web application that aggregates a developer's identity across GitHub and DSA platforms (LeetCode, Codeforces) into one dashboard. Users connect their accounts, see synchronized stats, get a composite DevScore, manage projects, rank on leaderboards, build portfolios with a live code editor, and compare skills with other developers.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React JS + Vite + Tailwind CSS |
| **Charts** | Recharts (Radar, Bar, Line) |
| **Icons** | Lucide React |
| **HTTP** | Axios (with interceptors) |
| **State** | React Context API (Auth, Theme, UserInfo) |
| **Routing** | React Router Dom |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB (Mongoose) |
| **Auth** | JWT + bcryptjs + GitHub OAuth 2.0 |
| **File Upload** | Multer |
| **Cron** | node-cron (nightly sync) |
| **Security** | Helmet, CORS, express-rate-limit, DOMPurify, validator |
| **Testing** | Jest, Supertest, Playwright |

---

## 3. Core Features

| Feature | Description |
|---|---|
| **Auth** | Email/password + GitHub OAuth, multi-role (developer, recruiter, mentor, admin) |
| **Profiles** | Bio, tech stack chips, social links, avatar fallback chain |
| **GitHub Stats** | Commits, repos, stars, PRs via GitHub API |
| **DSA Stats** | LeetCode (easy/med/hard), Codeforces (rating) |
| **DevScore** | GitHub 40% + DSA 40% + Portfolio 20% |
| **Projects** | CRUD with repo links, auto-fetch GitHub stars |
| **Leaderboards** | Global + college-specific rankings |
| **Portfolio Editor** | HTML/CSS/JS editor with live iframe preview |
| **Comparison** | Radar chart comparison with shared repo detection |

---

## 4. Database Models

| Model | Key Fields |
|---|---|
| **User** | email, password, role, githubId, leetcodeUsername, codeforcesUsername |
| **Profile** | bio, techStack[], socialLinks, college, avatarUrl |
| **GithubStats** | totalCommits, publicRepos, starsReceived, pullRequests |
| **DsaStats** | leetcode {easy, med, hard}, codeforces {rating, rank} |
| **Project** | name, description, repoLink, techStack[], githubStars |
| **DevScore** | overallScore, breakdown {github, dsa, portfolio} |
| **PortfolioCode** | rawHtml, htmlContent (sanitized), cssContent, jsContent, isPublic |

---

## 5. Architecture

```
React SPA (Vite) ←→ Express API ←→ MongoDB
                          │
                    ┌─────┼─────┐
                    ▼     ▼     ▼
              GitHub  LeetCode  Codeforces
              API     GraphQL   REST API
```

- **Frontend**: Context API for state, Axios interceptors for auth
- **Backend**: Modular routes, centralized error handling, role-based guards
- **Sync**: Nightly cron at 2am (GitHub + DSA only, portfolio excluded)
- **Security**: bcrypt, JWT, Helmet, DOMPurify, rate limiting

---

## 6. DevScore Formula

| Category | Weight | Signals |
|---|---|---|
| GitHub | 40% | Commits, repos, stars, PRs |
| DSA | 40% | LeetCode total (weighted by difficulty), CF rating |
| Portfolio | 20% | Has content, is public, code quality heuristic |

---

## 7. Key Implementation Details

- **Portfolio Editor**: 3-tab editor (HTML/CSS/JS) → `combineCode()` → iframe `srcDoc` with sandbox
- **Debouncing**: 300ms on code input to prevent race conditions
- **DOMPurify**: Server-side sanitization of raw HTML before public display
- **useBeforeUnload**: Warns users about unsaved portfolio changes
- **Cascading Deletes**: Admin user deletion removes all related documents
- **Avatar Fallback**: Upload → GitHub avatar → initials → color circle

---

## 8. Development Phases

| Phase | Weeks | Focus |
|---|---|---|
| 1 | 1–3 | Auth, profiles, dashboard foundation |
| 2 | 4–6 | GitHub + DSA stats, DevScore, cron sync |
| 3 | 7–9 | Projects, leaderboards, search, admin |
| 4 | 10–12 | Portfolio editor, comparison, testing, deploy |

---

*This blueprint covers the complete DevFolio system as described in the visual documentation.*