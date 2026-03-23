# DevFolio — System Architecture

> System architecture, data flow, component interactions, and design patterns.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Data Flow](#4-data-flow)
5. [Portfolio Editor Architecture](#5-portfolio-editor-architecture)
6. [Design Patterns](#6-design-patterns)
7. [Security Architecture](#7-security-architecture)

---

## 1. High-Level Architecture

```
┌─────────────────┐          ┌──────────────────────┐
│   React SPA     │◄────────►│   Express API        │
│   (Vite)        │  Axios   │   (Node.js)          │
│                 │          │                      │
│  - TailwindCSS  │          │  ┌────────────────┐  │
│  - Recharts     │          │  │ Auth Middleware │  │
│  - Context API  │          │  └───────┬────────┘  │
│  - Axios        │          │          │           │
│    Interceptors │          │  ┌───────▼────────┐  │
└─────────────────┘          │  │  Controllers   │  │
                             │  └───────┬────────┘  │
                             │          │           │
                             │   ┌──────┼──────┐    │
                             │   ▼      ▼      ▼    │
                             │ ┌────┐ ┌────┐ ┌────┐ │
                             │ │ DB │ │Cron│ │APIs│ │
                             │ └────┘ └────┘ └────┘ │
                             └──────────────────────┘
                                  │           │
                           ┌──────▼──┐  ┌─────▼──────┐
                           │ MongoDB │  │ External   │
                           │         │  │ APIs       │
                           └─────────┘  │ - GitHub   │
                                        │ - LeetCode │
                                        │ - CF       │
                                        └────────────┘
```

---

## 2. Frontend Architecture

### Component Structure

```
React Application (Vite)
│
├── App.jsx                        — Root component, router, providers
├── main.jsx                       — Entry point, React DOM render
│
├── Context Providers
│   ├── AuthContext                 — Auth state (user, token, login, logout)
│   ├── UserInfoContext             — User profile and preferences
│   └── ThemeContext                — Dark/light mode toggle
│
├── Pages
│   ├── LandingPage                — Hero, features, CTA
│   ├── LoginPage                  — Login form
│   ├── RegisterPage               — Registration form
│   ├── DashboardPage              — Main dashboard (protected)
│   ├── ProfilePage                — Developer profile view
│   ├── PortfolioEditor            — Code editor (state owner)
│   ├── PortfolioPreview           — Public portfolio view
│   ├── LeaderboardPage            — Rankings (global + college)
│   ├── ComparePage                — Developer comparison
│   └── AdminPage                  — Admin user management
│
├── Components (Reusable)
│   ├── Layout/
│   │   ├── Navbar                 — Top navigation bar
│   │   └── Footer                 — Footer
│   ├── Dashboard/
│   │   ├── ScoreBadge             — DevScore display badge
│   │   ├── StatsCard              — Individual stat card
│   │   └── ProjectCard            — Project display card
│   ├── Portfolio/
│   │   ├── CodePanel              — Code input textarea
│   │   └── LivePreview            — Full-screen iframe (used inside PortfolioPreview page)
│   │   └── EditorHeader           — Tab navigation + save button
│   └── Common/
│       ├── ProtectedRoute         — Auth guard
│       └── LoadingSpinner         — Loading indicator
│
├── Services (API Layer)
│   ├── apiClient.js               — Axios instance with interceptors
│   ├── authService.js             — Auth API calls
│   ├── profileService.js          — Profile API calls
│   ├── statsService.js            — Stats sync API calls
│   ├── projectService.js          — Project CRUD API calls
│   └── portfolioService.js        — Portfolio API calls
│
└── Utils
    ├── portfolioUtils.js          — combineCode() template function
    └── constants.js               — API URLs, route constants
```

### State Management Strategy

| State Type | Tool | Examples |
|---|---|---|
| **Auth state** | React Context API | User object, token, isAuthenticated |
| **User info** | React Context API | Profile data, preferences |
| **Theme** | React Context API | Dark/light mode toggle |
| **Component state** | useState | Form inputs, toggles, loading states |
| **URL state** | React Router | Current page, user IDs |

### Axios Interceptors

```javascript
// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401 (silent refresh)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt silent token refresh
      // If refresh fails, redirect to login
    }
    return Promise.reject(error);
  }
);
```

---

## 3. Backend Architecture

### Express Application Structure

```
Express Application
│
├── Middleware Layer
│   ├── cors()                    — Cross-origin configuration
│   ├── helmet()                  — Security headers
│   ├── express.json()            — JSON body parsing
│   ├── rateLimiter()             — Per-route rate limiting
│   ├── authMiddleware()          — JWT token verification
│   └── errorHandler()            — Centralized error response
│
├── Route Layer
│   ├── /api/auth/*               — Register, login, refresh, logout, GitHub OAuth
│   ├── /api/user/*               — User profile CRUD
│   ├── /api/profile/*            — Extended profile (bio, social, tech stack)
│   ├── /api/projects/*           — Project CRUD
│   ├── /api/integrations/*       — GitHub connect, DSA connect
│   ├── /api/stats/*              — GitHub stats, DSA stats, sync triggers
│   ├── /api/score/*              — DevScore computation and history
│   ├── /api/leaderboard/*        — Global and college rankings
│   ├── /api/portfolio/*          — Save, update, get, toggle visibility
│   ├── /api/compare/*            — Developer comparison
│   ├── /api/admin/*              — User management, cascading deletes
│   └── /api/recruiter/*          — Developer search
│
├── Controller Layer
│   ├── authController             — Registration, login, OAuth logic
│   ├── profileController          — Profile CRUD
│   ├── projectController          — Project CRUD
│   ├── statsController            — Sync triggers, stat retrieval
│   ├── scoreController            — DevScore computation
│   ├── leaderboardController      — Ranking queries
│   ├── portfolioController        — Code save/update, sanitization
│   ├── compareController          — Comparison logic
│   ├── adminController            — User management
│   └── recruiterController        — Search and discovery
│
├── Model Layer (Mongoose)
│   ├── User                       — Core user identity + auth
│   ├── Profile                    — Bio, avatar, tech stack, social links
│   ├── GithubStats                — Synchronized GitHub metrics
│   ├── DsaStats                   — LeetCode + Codeforces data
│   ├── Project                    — User projects
│   ├── DevScore                   — Computed scores
│   └── PortfolioCode              — Raw + sanitized code
│
├── Cron Jobs
│   └── scheduler.js               — Nightly sync at 2am (GitHub + DSA stats)
│
└── Utility Layer
    ├── errorHandler.js            — Custom error class + middleware
    └── validators.js              — Input validation helpers
```

---

## 4. Data Flow

### Flow 1: GitHub OAuth + Stat Sync

```
User clicks "Connect GitHub"
         │
         ▼
[React] Redirect to GitHub OAuth URL
         │
         ▼
[GitHub] User authorizes → callback to /api/auth/github/callback
         │
         ▼
[Express] Exchange code for access token
         │
         ▼
[Express] Store GitHub user ID on User model
         │
         ▼
[Express] Fetch GitHub stats via API (commits, repos, stars, PRs)
         │
         ▼
[MongoDB] Upsert GithubStats document
         │
         ▼
[Express] Recompute DevScore
         │
         ▼
[MongoDB] Update DevScore document
```

### Flow 2: Portfolio Save

```
User writes code in editor (PortfolioEditor — no inline preview)
         │
         ▼
[React] CodePanel onChange → update state
         │
         ▼
User clicks "Save"
         │
         ▼
[React] POST /api/portfolio { rawHtml, cssContent, jsContent }
         │
         ▼
[Express] portfolioController.save()
         │
         ▼
[Express] DOMPurify.sanitize(rawHtml) → htmlContent
         │
         ▼
[MongoDB] Upsert PortfolioCode { userId, rawHtml, htmlContent, cssContent, jsContent, isPublic }
```

### Flow 3: Nightly Cron Sync (2am)

```
[node-cron] 2am trigger
         │
         ▼
For each user with connected GitHub:
  [Axios] Fetch GitHub stats → update GithubStats
         │
         ▼
For each user with connected DSA platforms:
  [Axios] Fetch LeetCode stats → update DsaStats
  [Axios] Fetch Codeforces stats → update DsaStats
         │
         ▼
Recompute DevScore for all affected users
         │
         ▼
Note: PortfolioCode is explicitly EXCLUDED from sync
```

---

## 5. Portfolio Architecture

### Editor Page (PortfolioEditor)

```
PortfolioEditor.jsx (state owner — editor only, no inline preview)
├── EditorHeader.jsx (tab navigation: HTML | CSS | JS + Save + Preview buttons)
└── CodePanel.jsx (input — active tab's code)

Data flow:
  CodePanel → onChange → PortfolioEditor state
  Save button → POST /api/portfolio → backend stores code
  Preview button → navigate to /portfolio/preview/:userId
```

### Preview Page (PortfolioPreview)

```
PortfolioPreview.jsx (separate full-page — loads saved portfolio from backend)
└── LivePreview.jsx (full-screen iframe rendering the saved portfolio)

Data flow:
  PortfolioPreview mounts → GET /api/portfolio/:userId
  → combineCode(htmlContent, cssContent, jsContent)
  → LivePreview (full-screen iframe srcDoc)
```

> The editor page is strictly for editing code. The user does **not** see a live preview while editing. After saving, clicking "Preview" navigates to the portfolio preview page, which fetches the saved code from the backend and renders it as a full-page portfolio.

### combineCode() Utility

```javascript
// client/src/utils/portfolioUtils.js
export function combineCode(html, css, js) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>${js}<\/script>
      </body>
    </html>
  `;
}
```

### iframe Sandbox (used in PortfolioPreview)

```jsx
<iframe
  srcDoc={combinedCode}
  sandbox="allow-scripts allow-forms allow-same-origin"
  title="Portfolio Preview"
  className="w-full h-screen"
/>
```

---

## 6. Design Patterns

### Context API for Global State
Auth, user info, and theme are managed via React Context API — accessible from any component without prop drilling.

### Modular Routing (Backend)
Express routes are organized by domain: `/api/auth`, `/api/profile`, `/api/score`, `/api/portfolio`. Each route module has its own controller.

### Middleware Chain Pattern
```
Request → cors → helmet → json → rateLimiter → authMiddleware
       → routeHandler → errorHandler → Response
```

### Unified Error Handling
Centralized error middleware catches all errors and returns consistent response format:
```json
{
  "success": false,
  "message": "Error description"
}
```

### Debouncing (Portfolio Editor)
300ms debounce on code input to prevent race conditions during live preview updates.

### Dirty Form Detection
`useBeforeUnload` hook warns users when navigating away from unsaved portfolio edits.

---

## 7. Security Architecture

### Authentication Flow

```
Registration:
  1. Validate input
  2. Hash password (bcryptjs)
  3. Store user in MongoDB
  4. Generate JWT access token
  5. Return token

Login:
  1. Validate input
  2. Find user by email
  3. Compare password with bcryptjs
  4. Generate JWT access token
  5. Return token (with silent refresh support)

GitHub OAuth:
  1. Redirect to GitHub authorization URL
  2. Callback receives auth code
  3. Exchange code for GitHub access token
  4. Store GitHub user ID on User model
```

### Security Measures

| Measure | Implementation |
|---|---|
| Password hashing | bcryptjs with salt rounds |
| Token security | JWT with silent refresh |
| Security headers | Helmet middleware |
| XSS prevention | DOMPurify sanitization on portfolio HTML |
| Input validation | validator library |
| Rate limiting | express-rate-limit per endpoint |
| CORS | Whitelist allowed origins |

---

*This architecture follows the MERN stack pattern with React JS + Vite + TailwindCSS on the frontend and Express + MongoDB on the backend.*
