# DevFolio — Tech Stack Reference

> Complete reference of every technology, library, and tool used in DevFolio — what it is, why we chose it, and how it fits into the system.

---

## Table of Contents

1. [Frontend Technologies](#1-frontend-technologies)
2. [Backend Technologies](#2-backend-technologies)
3. [Database](#3-database)
4. [Authentication & Security](#4-authentication--security)
5. [Testing](#5-testing)
6. [Deployment](#6-deployment)

---

## 1. Frontend Technologies

### React JS
- **What**: A JavaScript library for building user interfaces using a component-based architecture
- **Why**: Industry standard, massive ecosystem, component reusability, virtual DOM for performance
- **Key concepts we use**:
  - **Functional components** — all components are functions, no class components
  - **Hooks** — `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`, `useContext`
  - **Custom hooks** — `useAuth()`, `useProfile()`, `useDevScore()`
  - **Context API** — global state for Auth, UserInfo, and Theme
  - **Error Boundaries** — graceful error handling per section
- **npm**: `react`, `react-dom`

### Vite
- **What**: A next-generation frontend build tool — extremely fast dev server and optimized production builds
- **Why**: 10–100x faster than Create React App. Hot Module Replacement (HMR) is near-instant. Native ES modules in dev mode.
- **Key concepts**:
  - **Dev server** — serves files over native ESM, no bundling in dev mode
  - **Production build** — uses Rollup under the hood for optimized tree-shaken bundles
  - **Environment variables** — `.env` with `VITE_` prefix
  - **Proxy** — `vite.config.js` proxy to forward `/api` requests to Express backend (port 5000) during dev
  - **Plugins** — `@vitejs/plugin-react` for React Fast Refresh
- **npm**: `vite`, `@vitejs/plugin-react`

### Tailwind CSS
- **What**: A utility-first CSS framework — style by composing utility classes directly in JSX
- **Why**: Rapid styling, no CSS file management, consistent design system, tiny production CSS (tree-shaken), dark mode built-in
- **Key concepts**:
  - **Utility classes** — `flex`, `items-center`, `p-4`, `bg-slate-900`, `text-cyan-400`
  - **Responsive prefixes** — `md:grid-cols-3`, `lg:px-8` (mobile-first breakpoints)
  - **Dark mode** — `dark:bg-slate-950`, `dark:text-white` (class-based toggle)
  - **Custom theme** — extend `tailwind.config.js` with DevFolio's color palette and fonts
  - **Animations** — `animate-pulse`, `animate-spin` for loading states
- **npm**: `tailwindcss`, `postcss`, `autoprefixer`

### Recharts
- **What**: A composable charting library built on React components
- **Why**: Declarative (JSX-based), responsive, customizable. Simple API for standard chart types.
- **Charts we build**:
  - **RadarChart** — Developer comparison (6-dimension profile)
  - **BarChart** — Problems solved by difficulty
  - **LineChart** — DevScore history over time
  - **ResponsiveContainer** — auto-resize charts to parent width
- **npm**: `recharts`

### Axios
- **What**: Promise-based HTTP client for the browser and Node.js
- **Why**: Cleaner API than `fetch`, built-in interceptors for auth tokens, automatic JSON parsing
- **Key concepts**:
  - **Axios instance** — pre-configured with `baseURL`, headers, timeout
  - **Request interceptor** — automatically attach JWT `Authorization: Bearer <token>` header
  - **Response interceptor** — auto-refresh token on 401, redirect to login on 403
- **npm**: `axios`

### React Router Dom
- **What**: Declarative routing for React single-page applications
- **Why**: Standard SPA routing — URL-based navigation without full page reloads
- **Key routes**:
  - `/` — Landing page
  - `/login`, `/register` — Auth pages
  - `/dashboard` — Main dashboard (protected)
  - `/profile/:userId` — User profile
  - `/portfolio/editor` — Portfolio code editor
  - `/portfolio/preview/:userId` — Portfolio preview
  - `/leaderboard` — Rankings
  - `/compare` — Developer comparison
- **npm**: `react-router-dom`

### React-Hot-Toast / React-Toastify
- **What**: Lightweight toast notification library for React
- **Why**: User-friendly success/error notifications for actions like saving, syncing, and form submissions
- **npm**: `react-hot-toast` or `react-toastify`

### Lucide React
- **What**: A beautiful open-source icon library for React
- **Why**: Clean, consistent icons. Tree-shakeable — import only icons you use.
- **npm**: `lucide-react`

---

## 2. Backend Technologies

### Node.js
- **What**: JavaScript runtime built on Chrome's V8 engine — runs JS server-side
- **Why**: Same language across frontend and backend. Non-blocking I/O for concurrent API calls. Massive npm ecosystem.
- **Version**: 20.x LTS

### Express.js
- **What**: Minimal, flexible Node.js web application framework
- **Why**: Industry standard for REST APIs. Lightweight, huge middleware ecosystem.
- **Key concepts**:
  - **Middleware chain** — `app.use()` for CORS, auth, rate-limiting, error handling
  - **Router** — modular route definitions: `authRouter`, `profileRouter`, `portfolioRouter`
  - **Request/Response** — `req.body`, `req.params`, `req.query`, `res.json()`, `res.status()`
  - **Error handling middleware** — centralized `(err, req, res, next)` handler
- **Middleware we use**:
  - `cors` — Cross-Origin Resource Sharing
  - `helmet` — Security headers
  - `express-rate-limit` — Rate limiting API endpoints
- **npm**: `express`

### Mongoose
- **What**: MongoDB object modeling (ODM) for Node.js — provides schema-based modeling
- **Why**: Schema validation, middleware (pre/post hooks), query building, population (joins).
- **Key concepts**:
  - **Schema** — define document structure, types, validation, defaults
  - **Model** — compiled schema → provides CRUD operations
  - **Middleware (hooks)** — `pre('save')` to hash passwords
  - **Population** — reference other collections (like SQL JOINs)
  - **Indexes** — compound indexes for fast queries
  - **Timestamps** — auto `createdAt`, `updatedAt` fields
- **npm**: `mongoose`

### Multer
- **What**: Middleware for handling `multipart/form-data` — file uploads
- **Why**: Profile avatar uploads and project image uploads
- **npm**: `multer`

### node-cron
- **What**: Simple cron scheduler for Node.js
- **Why**: Schedule nightly sync jobs (2am) for GitHub and DSA stats. Excludes portfolio data from sync.
- **npm**: `node-cron`

---

## 3. Database

### MongoDB
- **What**: NoSQL document database — stores data as flexible JSON-like documents (BSON)
- **Why**: Flexible schema for different data shapes (GitHub stats vs DSA stats vs portfolio code). Easy to scale.
- **Key collections**: `users`, `profiles`, `githubStats`, `dsaStats`, `projects`, `devScores`, `portfolioCodes`
- **Connection**: `mongoose.connect(MONGODB_URI)` with retry logic

---

## 4. Authentication & Security

### bcryptjs
- **What**: Library to hash and compare passwords
- **Why**: Never store plain-text passwords. Intentionally slow hashing makes brute-force impractical.
- **Usage**:
  - **Hash on register** — `bcrypt.hash(password, 12)` → store hash in DB
  - **Compare on login** — `bcrypt.compare(plainPassword, storedHash)`
- **npm**: `bcryptjs`

### jsonwebtoken (JWT)
- **What**: Library to sign, verify, and decode JSON Web Tokens
- **Why**: Stateless auth — server doesn't need to track sessions. Works great with SPA frontends.
- **Key concepts**:
  - **Access token** — short-lived, sent in `Authorization: Bearer <token>` header
  - **Refresh token** — long-lived, with silent refresh mechanism
  - **Payload** — `{ userId, role }` (never put sensitive data here)
- **npm**: `jsonwebtoken`

### GitHub OAuth 2.0
- **What**: OAuth flow for automated GitHub account linking
- **Why**: Secure GitHub integration without storing user's GitHub password. Auto-link GitHub account for stat syncing.
- **Flow**: User clicks "Connect GitHub" → redirect to GitHub → callback with auth code → exchange for access token → store GitHub ID

### Helmet
- **What**: Express middleware that sets various HTTP security headers
- **Why**: Protects against XSS, clickjacking, MIME-type sniffing
- **npm**: `helmet`

### DOMPurify
- **What**: Server-side HTML sanitization library
- **Why**: Portfolio editor accepts raw HTML from users — must sanitize before public display to prevent XSS attacks
- **Usage**: Sanitize `rawHtml` into `htmlContent` on save
- **npm**: `dompurify` (with `jsdom` for server-side)

### validator
- **What**: String validation and sanitization library
- **Why**: Validate email formats, URLs, and other input fields
- **npm**: `validator`

### CORS
- **What**: Middleware to enable Cross-Origin Resource Sharing
- **Why**: Frontend and backend run on different ports during development
- **npm**: `cors`

### express-rate-limit
- **What**: Rate limiting middleware for Express
- **Why**: Prevent abuse — too many login attempts, sync spam, etc.
- **npm**: `express-rate-limit`

---

## 5. Testing

### Jest
- **What**: JavaScript testing framework with built-in mocking, assertions, and coverage
- **Why**: Standard for Node.js/React testing. Snapshot testing, mocking, watch mode.
- **What we test**:
  - DevScore computation with known inputs
  - Utility functions and validators
  - API controllers
- **npm**: `jest`

### Supertest
- **What**: HTTP assertion library for testing Express endpoints
- **Why**: Send fake HTTP requests and assert responses — no need to start a real server
- **npm**: `supertest`

### Playwright
- **What**: End-to-end testing framework for modern web apps
- **Why**: Full E2E flows: sign up → connect GitHub → view dashboard → edit portfolio
- **npm**: `@playwright/test`

---

## 6. Deployment

### Frontend Hosting
- Vercel or similar static hosting for the Vite-built React SPA
- Auto-deploys on git push, global CDN

### Backend Hosting
- Railway, Render, or AWS for the Express API
- Environment-variable driven configuration

### Database Hosting
- MongoDB Atlas (free tier or production cluster)

---

## Full npm Install Commands

### Client
```bash
cd client
npm create vite@latest . -- --template react
npm install react-router-dom axios recharts lucide-react react-hot-toast
npm install tailwindcss postcss autoprefixer
npm install -D @playwright/test
```

### Server
```bash
cd server
npm init -y
npm install express mongoose bcryptjs jsonwebtoken
npm install cors helmet express-rate-limit multer
npm install axios node-cron dompurify jsdom validator
npm install -D jest supertest nodemon
```

---

*This document is the complete reference for every technology in DevFolio. Each item explains what it is, why we chose it, and how it fits into the system.*
