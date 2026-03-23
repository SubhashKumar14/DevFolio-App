# DevFolio — Concepts & Implementation Details

> Deep dive into the key programming concepts, design patterns, and implementation details used throughout DevFolio.

---

## Table of Contents

1. [React Fundamentals Used](#1-react-fundamentals-used)
2. [State Management with Context API](#2-state-management-with-context-api)
3. [API Layer with Axios](#3-api-layer-with-axios)
4. [Routing with React Router](#4-routing-with-react-router)
5. [Styling with Tailwind CSS](#5-styling-with-tailwind-css)
6. [Charts with Recharts](#6-charts-with-recharts)
7. [Portfolio Editor Implementation](#7-portfolio-editor-implementation)
8. [DevScore Computation](#8-devscore-computation)
9. [Backend Concepts](#9-backend-concepts)
10. [Authentication Flow](#10-authentication-flow)
11. [GitHub OAuth Integration](#11-github-oauth-integration)
12. [DSA Platform Integration](#12-dsa-platform-integration)
13. [Cron Jobs](#13-cron-jobs)
14. [Security Practices](#14-security-practices)
15. [Error Handling](#15-error-handling)
16. [Testing Strategies](#16-testing-strategies)

---

## 1. React Fundamentals Used

### Functional Components
All components are functional — no class components.

```jsx
function StatsCard({ title, value, icon }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
```

### Core Hooks

| Hook | Usage in DevFolio |
|---|---|
| `useState` | Form inputs, active tab, loading states |
| `useEffect` | Fetch data on mount, side effects |
| `useCallback` | Memoize event handlers (editor onChange) |
| `useMemo` | Expensive computations (combined code) |
| `useRef` | Editor textarea references |
| `useContext` | Access AuthContext, ThemeContext, UserInfoContext |

### Custom Hooks

```jsx
// useAuth.js — convenience wrapper for AuthContext
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// useBeforeUnload.js — warn on unsaved changes
function useBeforeUnload(isDirty) {
  useEffect(() => {
    const handler = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
```

---

## 2. State Management with Context API

DevFolio uses React's built-in Context API for global state — no external state library.

### Auth Context

```jsx
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    setUser(res.data.user);
    setToken(res.data.accessToken);
    localStorage.setItem('accessToken', res.data.accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('accessToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Theme Context

```jsx
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

---

## 3. API Layer with Axios

### Axios Instance with Interceptors

```javascript
// services/apiClient.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 + silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post('/api/auth/refresh');
        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 4. Routing with React Router

```jsx
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/profile/:userId" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />
            <Route path="/portfolio/editor" element={
              <ProtectedRoute><PortfolioEditor /></ProtectedRoute>
            } />
            <Route path="/portfolio/preview/:userId" element={<PortfolioPreview />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/compare" element={
              <ProtectedRoute><ComparePage /></ProtectedRoute>
            } />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### Protected Route Component

```jsx
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
```

---

## 5. Styling with Tailwind CSS

### Dark Mode (Class-based)

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        card: '#12121a',
        'card-elevated': '#1a1a2e',
        border: '#2a2a3e',
        accent: {
          cyan: '#06b6d4',
          purple: '#8b5cf6',
          green: '#22c55e',
          red: '#ef4444',
          yellow: '#eab308',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  }
};
```

### Glassmorphism Pattern

```jsx
<div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
  {/* Glassmorphism card content */}
</div>
```

---

## 6. Charts with Recharts

### Radar Chart (Developer Comparison)

```jsx
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

function ComparisonRadar({ data }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        <PolarGrid gridType="polygon" />
        <PolarAngleAxis dataKey="metric" />
        <Radar name="User 1" dataKey="user1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
        <Radar name="User 2" dataKey="user2" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

### Bar Chart (DSA Problems)

```jsx
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

function ProblemBreakdown({ leetcode }) {
  const data = [
    { difficulty: 'Easy', count: leetcode.easySolved, fill: '#22c55e' },
    { difficulty: 'Medium', count: leetcode.mediumSolved, fill: '#eab308' },
    { difficulty: 'Hard', count: leetcode.hardSolved, fill: '#ef4444' },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="difficulty" />
        <YAxis />
        <Bar dataKey="count" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

---

## 7. Portfolio Editor Implementation

### Architecture

```
PortfolioEditor.jsx (state owner — editor only, no inline preview)
├── EditorHeader.jsx (tab selection + Save button + Preview button)
└── CodePanel.jsx (textarea input for active tab)
```

> The editor page does **not** include a live preview. The user writes code, saves it, and then clicks "Preview" to navigate to the portfolio preview page.

### Editor State Management

```jsx
function PortfolioEditor() {
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [activeTab, setActiveTab] = useState('html');
  const [isDirty, setIsDirty] = useState(false);

  // Load existing code from backend on mount
  useEffect(() => {
    const loadCode = async () => {
      const data = await portfolioService.getPortfolio(userId);
      if (data) {
        setHtml(data.rawHtml || '');
        setCss(data.cssContent || '');
        setJs(data.jsContent || '');
      }
    };
    loadCode();
  }, [userId]);

  // Warn on unsaved changes
  useBeforeUnload(isDirty);

  // Save to backend
  const handleSave = async () => {
    await portfolioService.savePortfolio({ rawHtml: html, cssContent: css, jsContent: js });
    setIsDirty(false);
  };

  // Navigate to preview page
  const handlePreview = () => {
    navigate(`/portfolio/preview/${userId}`);
  };

  // ...
}
```

### combineCode() Utility

```javascript
// utils/portfolioUtils.js
export function combineCode(html, css, js) {
  return `
    <!DOCTYPE html>
    <html>
      <head><style>${css}</style></head>
      <body>
        ${html}
        <script>${js}<\/script>
      </body>
    </html>
  `;
}
```

### Portfolio Preview Page

The `PortfolioPreview.jsx` page is a **separate route** (`/portfolio/preview/:userId`) that loads the saved portfolio from the backend and displays it as a full-page rendered site — no code editor is visible.

```jsx
// pages/PortfolioPreview.jsx
function PortfolioPreview() {
  const { userId } = useParams();
  const [code, setCode] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await portfolioService.getPortfolio(userId);
      if (data) {
        setCode(combineCode(data.htmlContent, data.cssContent, data.jsContent));
      }
    };
    load();
  }, [userId]);

  return <LivePreview code={code} />;
}
```

> Note: The preview page uses `htmlContent` (sanitized by DOMPurify on the server) for public display, while the editor uses `rawHtml` (unsanitized) for editing.

### LivePreview Component (used in PortfolioPreview)

```jsx
// components/portfolio/LivePreview.jsx
function LivePreview({ code }) {
  return (
    <iframe
      srcDoc={code}
      sandbox="allow-scripts allow-forms allow-same-origin"
      title="Portfolio Preview"
      className="w-full h-screen bg-white"
    />
  );
}
```

### Server-Side Sanitization

```javascript
// server/src/utils/sanitizer.js
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

function sanitizeHtml(rawHtml) {
  return DOMPurify.sanitize(rawHtml);
}
```

---

## 8. DevScore Computation

### Weighted Formula

```javascript
// server/src/utils/devScoreCalculator.js

function computeDevScore(githubStats, dsaStats, portfolioCode) {
  // Normalize GitHub score (0-100)
  const githubScore = normalizeGithub(githubStats);

  // Normalize DSA score (0-100)
  const dsaScore = normalizeDsa(dsaStats);

  // Portfolio score: binary (has public portfolio or not) + content quality
  const portfolioScore = normalizePortfolio(portfolioCode);

  // Weighted composite
  const overallScore = Math.round(
    (githubScore * 0.40) +
    (dsaScore * 0.40) +
    (portfolioScore * 0.20)
  );

  return {
    overallScore,
    breakdown: {
      github: { score: githubScore, weight: 40 },
      dsa: { score: dsaScore, weight: 40 },
      portfolio: { score: portfolioScore, weight: 20 }
    }
  };
}
```

### GitHub Normalization

Factors: commits, repos, stars, PRs → each normalized to 0–25, summed to 0–100.

### DSA Normalization

Factors: LeetCode total solved (weighted by difficulty), Codeforces rating → combined to 0–100.

### Portfolio Normalization

Factors: has content (40 points), is public (30 points), code quality/length heuristic (30 points).

---

## 9. Backend Concepts

### Express Middleware Chain

```javascript
// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recruiter', recruiterRoutes);

// Error handling (must be last)
app.use(errorHandler);
```

### Mongoose Connection

```javascript
// config/db.js
const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}
```

---

## 10. Authentication Flow

### Registration

1. Validate input (email, password, displayName)
2. Check if email already exists
3. Hash password with `bcrypt.hash(password, 12)`
4. Create User document
5. Generate JWT: `jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '15m' })`
6. Return user + access token

### Login

1. Find user by email (select password)
2. Compare with `bcrypt.compare(password, user.password)`
3. Generate new JWT access token
4. Return user + token

### Silent Refresh

- Access tokens expire in 15 minutes
- Refresh tokens have 7-day expiry
- Axios interceptor catches 401 → calls `/api/auth/refresh` → retries original request

---

## 11. GitHub OAuth Integration

### Flow

```
1. User clicks "Connect GitHub"
2. Frontend redirects to:
   https://github.com/login/oauth/authorize?client_id=...&scope=read:user
3. User authorizes on GitHub
4. GitHub redirects back to: /api/auth/github/callback?code=...
5. Backend exchanges code for access token:
   POST https://github.com/login/oauth/access_token
6. Backend fetches GitHub user info:
   GET https://api.github.com/user
7. Store githubId and githubUsername on User model
8. Redirect user back to frontend
```

### Stat Fetching

```javascript
// services/githubService.js
async function fetchGithubStats(githubUsername, accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const [user, repos] = await Promise.all([
    axios.get(`https://api.github.com/users/${githubUsername}`, { headers }),
    axios.get(`https://api.github.com/users/${githubUsername}/repos?per_page=100`, { headers })
  ]);

  return {
    totalCommits: user.data.public_repos, // approximation, or use events API
    publicRepos: user.data.public_repos,
    starsReceived: repos.data.reduce((sum, r) => sum + r.stargazers_count, 0),
    pullRequests: 0 // fetch via search API if needed
  };
}
```

---

## 12. DSA Platform Integration

### LeetCode API

```javascript
// services/leetcodeService.js
async function fetchLeetcodeStats(username) {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum { difficulty, count }
        }
      }
    }
  `;

  const res = await axios.post('https://leetcode.com/graphql', {
    query,
    variables: { username }
  });

  const stats = res.data.data.matchedUser.submitStatsGlobal.acSubmissionNum;
  return {
    easySolved: stats.find(s => s.difficulty === 'Easy')?.count || 0,
    mediumSolved: stats.find(s => s.difficulty === 'Medium')?.count || 0,
    hardSolved: stats.find(s => s.difficulty === 'Hard')?.count || 0,
    totalSolved: stats.find(s => s.difficulty === 'All')?.count || 0
  };
}
```

### Codeforces API

```javascript
// services/codeforcesService.js
async function fetchCodeforcesStats(username) {
  const res = await axios.get(`https://codeforces.com/api/user.info?handles=${username}`);
  const user = res.data.result[0];

  return {
    currentRating: user.rating || 0,
    maxRating: user.maxRating || 0,
    rank: user.rank || 'unrated'
  };
}
```

---

## 13. Cron Jobs

### Nightly Sync (2am)

```javascript
// cron/scheduler.js
const cron = require('node-cron');

// Run at 2:00 AM every day
cron.schedule('0 2 * * *', async () => {
  console.log('Starting nightly sync...');

  const users = await User.find({
    $or: [
      { githubUsername: { $ne: null } },
      { leetcodeUsername: { $ne: null } },
      { codeforcesUsername: { $ne: null } }
    ]
  });

  for (const user of users) {
    // Sync GitHub stats
    if (user.githubUsername) {
      const stats = await fetchGithubStats(user.githubUsername, user.githubAccessToken);
      await GithubStats.findOneAndUpdate({ userId: user._id }, stats, { upsert: true });
    }

    // Sync DSA stats
    if (user.leetcodeUsername) {
      const stats = await fetchLeetcodeStats(user.leetcodeUsername);
      await DsaStats.findOneAndUpdate({ userId: user._id }, { leetcode: stats }, { upsert: true });
    }

    if (user.codeforcesUsername) {
      const stats = await fetchCodeforcesStats(user.codeforcesUsername);
      await DsaStats.findOneAndUpdate({ userId: user._id }, { codeforces: stats }, { upsert: true });
    }

    // Recompute DevScore
    // NOTE: PortfolioCode is excluded from nightly sync
    await recomputeDevScore(user._id);
  }
});
```

> **Important:** PortfolioCode data is **explicitly excluded** from the nightly cron sync to avoid unnecessary processing on static content.

---

## 14. Security Practices

| Practice | Implementation |
|---|---|
| Password hashing | bcryptjs with 12 salt rounds |
| JWT tokens | Short-lived access (15min) + long-lived refresh (7d) |
| Security headers | Helmet middleware |
| XSS prevention | DOMPurify sanitization on portfolio HTML |
| Input validation | validator library for emails, URLs |
| Rate limiting | express-rate-limit on all API routes |
| CORS | Whitelist `CLIENT_URL` only |
| Secret management | Environment variables via `.env` |

---

## 15. Error Handling

### Custom Error Class

```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
```

### Centralized Error Middleware

```javascript
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message
  });
}
```

### Async Handler Wrapper

```javascript
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage:
router.get('/profile/:id', asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.params.id });
  if (!profile) throw new AppError('Profile not found', 404);
  res.json({ success: true, data: profile });
}));
```

---

## 16. Testing Strategies

### Unit Tests (Jest)

```javascript
// tests/unit/devScore.test.js
describe('DevScore Calculator', () => {
  test('computes correct weighted score', () => {
    const result = computeDevScore(
      { totalCommits: 500, publicRepos: 20, starsReceived: 50, pullRequests: 30 },
      { leetcode: { totalSolved: 300 }, codeforces: { currentRating: 1600 } },
      { isPublic: true, rawHtml: '<div>Hello</div>' }
    );
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.breakdown.github.weight).toBe(40);
    expect(result.breakdown.dsa.weight).toBe(40);
    expect(result.breakdown.portfolio.weight).toBe(20);
  });
});
```

### Integration Tests (Supertest)

```javascript
// tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Auth Endpoints', () => {
  test('POST /api/auth/register creates user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'password123', displayName: 'Test' });
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
  });
});
```

### E2E Tests (Playwright)

```javascript
// tests/e2e/flows.spec.js
const { test, expect } = require('@playwright/test');

test('user can register and view dashboard', async ({ page }) => {
  await page.goto('http://localhost:5173/register');
  await page.fill('[name="email"]', 'e2e@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.fill('[name="displayName"]', 'E2E User');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
```

---

*All concepts and patterns follow the MERN stack with vanilla React (Context API), Axios, Tailwind CSS, and standard Express middleware.*
