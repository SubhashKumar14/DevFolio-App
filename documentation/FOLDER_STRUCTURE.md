# DevFolio — Folder Structure

> Complete breakdown of the project directory structure — what each folder and key file does.

---

## Root Structure

```
devfolio/
├── client/                     # React frontend (Vite)
├── server/                     # Express backend (Node.js)
├── documentation/              # Project documentation (markdown)
├── .gitignore
├── package.json                # Root package.json (npm workspaces or scripts)
└── README.md
```

---

## Client (Frontend)

```
client/
├── public/
│   ├── favicon.ico
│   └── assets/
│       └── icons/              # Platform icons, logos
│
├── src/
│   ├── main.jsx                # Entry point — ReactDOM.render, provider wrapping
│   ├── App.jsx                 # Root component — router setup, layout
│   │
│   ├── components/             # Reusable UI components
│   │   ├── layout/
│   │   │   ├── Navbar.jsx      # Top navigation bar
│   │   │   └── Footer.jsx      # Footer
│   │   │
│   │   ├── dashboard/
│   │   │   ├── ScoreBadge.jsx  # DevScore display badge
│   │   │   ├── StatsCard.jsx   # Individual stat card (commits, repos, etc.)
│   │   │   └── ProjectCard.jsx # Project display card
│   │   │
│   │   ├── portfolio/
│   │   │   ├── CodePanel.jsx   # Code input textarea (per tab)
│   │   │   ├── LivePreview.jsx # iframe rendering combined code
│   │   │   └── EditorHeader.jsx# Tab navigation (HTML/CSS/JS) + Save button
│   │   │
│   │   ├── comparison/
│   │   │   └── RadarChart.jsx  # Recharts radar chart for comparison
│   │   │
│   │   └── common/
│   │       ├── ProtectedRoute.jsx  # Auth guard (redirect if not logged in)
│   │       ├── LoadingSpinner.jsx  # Loading indicator
│   │       └── PortfolioPill.jsx   # "Portfolio" indicator pill
│   │
│   ├── pages/                  # Route-level page components
│   │   ├── LandingPage.jsx     # Landing/hero page
│   │   ├── LoginPage.jsx       # Login form
│   │   ├── RegisterPage.jsx    # Registration form
│   │   ├── DashboardPage.jsx   # Main dashboard (protected)
│   │   ├── ProfilePage.jsx     # User profile view
│   │   ├── PortfolioEditor.jsx # Portfolio code editor (state owner)
│   │   ├── PortfolioPreview.jsx# Public portfolio preview
│   │   ├── LeaderboardPage.jsx # Rankings (global + college)
│   │   ├── ComparePage.jsx     # Developer comparison
│   │   ├── ProjectsPage.jsx    # Project management
│   │   └── AdminPage.jsx       # Admin panel (admin role only)
│   │
│   ├── context/                # React Context providers
│   │   ├── AuthContext.jsx     # Auth state: user, token, login(), logout()
│   │   ├── UserInfoContext.jsx # User profile info and preferences
│   │   └── ThemeContext.jsx    # Dark/light mode state
│   │
│   ├── services/               # API client layer
│   │   ├── apiClient.js        # Axios instance with interceptors
│   │   ├── authService.js      # Auth API calls (login, register, refresh)
│   │   ├── profileService.js   # Profile API calls
│   │   ├── statsService.js     # GitHub/DSA stats API calls
│   │   ├── projectService.js   # Project CRUD API calls
│   │   ├── portfolioService.js # Portfolio save/get/toggle API calls
│   │   ├── leaderboardService.js   # Leaderboard API calls
│   │   └── compareService.js   # Comparison API calls
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.js          # Auth convenience hook
│   │   └── useBeforeUnload.js  # Warn on unsaved changes
│   │
│   ├── utils/                  # Utility functions
│   │   ├── portfolioUtils.js   # combineCode() for iframe preview
│   │   └── constants.js        # API base URL, route paths
│   │
│   └── styles/
│       └── index.css           # Tailwind CSS imports + custom styles
│
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration (proxy, plugins)
├── tailwind.config.js          # Tailwind configuration (theme, dark mode)
├── postcss.config.js           # PostCSS plugins
├── package.json
└── .env                        # VITE_API_URL=http://localhost:5000/api
```

---

## Server (Backend)

```
server/
├── src/
│   ├── app.js                  # Express app setup (middleware, routes)
│   ├── server.js               # Server entry point (listen, DB connect)
│   │
│   ├── config/
│   │   ├── db.js               # MongoDB connection setup
│   │   └── env.js              # Environment variable validation
│   │
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js             # User model (auth, roles, platform handles)
│   │   ├── Profile.js          # Profile model (bio, tech stack, social)
│   │   ├── GithubStats.js      # GitHub metrics model
│   │   ├── DsaStats.js         # LeetCode + Codeforces stats model
│   │   ├── Project.js          # Project model
│   │   ├── DevScore.js         # DevScore model (score + breakdown)
│   │   └── PortfolioCode.js    # Portfolio code model (raw + sanitized)
│   │
│   ├── routes/                 # Express route definitions
│   │   ├── authRoutes.js       # /api/auth/* routes
│   │   ├── userRoutes.js       # /api/user/* routes
│   │   ├── profileRoutes.js    # /api/profile/* routes
│   │   ├── integrationRoutes.js# /api/integrations/* routes
│   │   ├── statsRoutes.js      # /api/stats/* routes
│   │   ├── scoreRoutes.js      # /api/score/* routes
│   │   ├── projectRoutes.js    # /api/projects/* routes
│   │   ├── leaderboardRoutes.js# /api/leaderboard/* routes
│   │   ├── portfolioRoutes.js  # /api/portfolio/* routes
│   │   ├── compareRoutes.js    # /api/compare/* routes
│   │   ├── adminRoutes.js      # /api/admin/* routes
│   │   └── recruiterRoutes.js  # /api/recruiter/* routes
│   │
│   ├── controllers/            # Business logic handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── profileController.js
│   │   ├── integrationController.js
│   │   ├── statsController.js
│   │   ├── scoreController.js
│   │   ├── projectController.js
│   │   ├── leaderboardController.js
│   │   ├── portfolioController.js
│   │   ├── compareController.js
│   │   ├── adminController.js
│   │   └── recruiterController.js
│   │
│   ├── middleware/             # Express middleware
│   │   ├── auth.js             # JWT verification middleware
│   │   ├── roleGuard.js        # Role-based access control
│   │   ├── rateLimiter.js      # Rate limiting configuration
│   │   └── errorHandler.js     # Centralized error handling
│   │
│   ├── services/               # External API calls
│   │   ├── githubService.js    # GitHub API calls
│   │   ├── leetcodeService.js  # LeetCode API calls
│   │   └── codeforcesService.js# Codeforces API calls
│   │
│   ├── cron/                   # Scheduled jobs
│   │   └── scheduler.js        # Nightly sync cron (2am)
│   │
│   └── utils/                  # Utilities
│       ├── devScoreCalculator.js   # DevScore computation logic
│       └── sanitizer.js        # DOMPurify HTML sanitization
│
├── tests/                      # Test files
│   ├── unit/
│   │   ├── devScore.test.js    # DevScore computation tests
│   │   └── sanitizer.test.js   # Sanitization tests
│   ├── integration/
│   │   ├── auth.test.js        # Auth endpoint tests
│   │   ├── portfolio.test.js   # Portfolio endpoint tests
│   │   └── leaderboard.test.js # Leaderboard tests
│   └── e2e/
│       └── flows.spec.js       # Playwright E2E tests
│
├── uploads/                    # Multer upload directory
│   └── avatars/                # Profile image uploads
│
├── package.json
├── .env                        # Environment variables
├── jest.config.js              # Jest configuration
└── nodemon.json                # Nodemon config for dev
```

---

## Key File Responsibilities

### Frontend Files

| File | Role |
|---|---|
| `main.jsx` | Entry point — wraps App in providers |
| `App.jsx` | Sets up React Router, layout, context providers |
| `apiClient.js` | Axios instance with token interceptors |
| `AuthContext.jsx` | Global auth state — user, token, login/logout functions |
| `PortfolioEditor.jsx` | Editor-only page — holds code state, manages tabs, save + preview buttons |
| `PortfolioPreview.jsx` | Full-page portfolio display — fetches saved code from backend, renders via LivePreview |
| `CodePanel.jsx` | Input control — textarea for active tab |
| `LivePreview.jsx` | Full-screen iframe — renders combined code (used inside PortfolioPreview page) |
| `portfolioUtils.js` | `combineCode(html, css, js)` — builds full HTML document |

### Backend Files

| File | Role |
|---|---|
| `app.js` | Express configuration — middleware chain, route mounting |
| `server.js` | DB connect + server listen |
| `auth.js` (middleware) | JWT token verification → `req.user` |
| `roleGuard.js` | Check `req.user.role` against required roles |
| `portfolioController.js` | Sanitize HTML with DOMPurify on save |
| `devScoreCalculator.js` | GitHub 40% + DSA 40% + Portfolio 20% formula |
| `scheduler.js` | node-cron nightly job for GitHub + DSA sync |

---

*All files use `.jsx` (React) and `.js` (Node.js) — no TypeScript (.ts/.tsx) files.*
