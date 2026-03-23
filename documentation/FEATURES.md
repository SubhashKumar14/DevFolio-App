# DevFolio — Feature Specifications

> Complete feature list organized by module — what each feature does, why it matters, and how it works.

---

## Core Modules

| Module | Features |
|---|---|
| **Authentication** | Login, Register, GitHub OAuth, Roles |
| **Profiles** | Developer identity, bio, tech stack, social links |
| **GitHub Integration** | OAuth linking, stat syncing |
| **DSA Integration** | LeetCode + Codeforces stat syncing |
| **DevScore** | Normalized composite scoring |
| **Projects** | CRUD, repo links, auto-fetch stars |
| **Leaderboards** | Global + college-specific rankings |
| **Portfolio Editor** | HTML/CSS/JS editor with live preview |
| **Developer Comparison** | Radar chart side-by-side |
| **Admin** | User management, cascading deletes |
| **Recruiter** | Profile search, developer discovery |

---

## F1 — Authentication & Authorization

### F1.1 Email/Password Registration & Login

**What:** Standard email/password authentication with JWT tokens.

**Acceptance Criteria:**
- User can register with email, password, display name
- Password hashed with bcryptjs before storage
- User can login with email + password
- JWT access token returned on login
- Silent refresh mechanism for expired tokens
- Logout clears tokens

---

### F1.2 GitHub OAuth 2.0

**What:** Connect GitHub account via OAuth for automated account linking and stat syncing.

**Acceptance Criteria:**
- "Connect GitHub" button redirects to GitHub authorization
- OAuth callback exchanges code for access token
- GitHub user ID stored on User model
- GitHub profile info (avatar, username) auto-populated
- Used for GitHub stats synchronization

---

### F1.3 Multi-Role Support

**What:** Users have role-based access control.

**Roles:**
- `developer` — default role, full access to own profile and features
- `recruiter` — can search and view developer profiles
- `mentor` — can view student groups and leaderboards
- `admin` — full system access, user management, cascading deletes

---

## F2 — Developer Profiles

### F2.1 Profile Management

**What:** Rich developer profile with customizable fields.

**Fields:**
- Display name, bio, avatar (with fallback chain)
- Tech stack chips (e.g., React, Node.js, Python)
- Social links (LinkedIn, personal website)
- Profile visibility toggle

**Avatar Fallback Chain:**
1. Uploaded profile image
2. GitHub avatar (if connected)
3. Initials
4. Color-coded circle

---

## F3 — GitHub Stats Sync

### F3.1 GitHub Integration Pipeline

**What:** Synchronize GitHub activity data via GitHub API.

**Stats Tracked:**
- Total commits
- Public repositories count
- Stars received
- Pull request count

**Sync Schedule:**
- Nightly cron job at 2am
- Manual "Sync Now" button available

---

## F4 — DSA Stats Sync

### F4.1 LeetCode Stats

**What:** Track LeetCode problem-solving progress.

**Stats Tracked:**
- Easy problems solved
- Medium problems solved
- Hard problems solved
- Total count

---

### F4.2 Codeforces Stats

**What:** Track Codeforces competitive programming data.

**Stats Tracked:**
- Current rating
- Max rating
- Rank title

---

## F5 — DevScore Engine

### F5.1 Scoring Algorithm

**What:** Composite score representing overall developer profile strength.

**Formula:**

| Category | Weight | Source |
|---|---|---|
| GitHub Activity | 40% | Commits, repos, stars, PRs |
| DSA Performance | 40% | LeetCode counts, Codeforces rating |
| Portfolio | 20% | Published portfolio (has content, is public) |

**Acceptance Criteria:**
- Score recomputed after every stat sync
- Score history tracked for trend visualization
- DevScore breakdown visible on profile

---

## F6 — Projects

### F6.1 Project CRUD

**What:** Manage personal projects with metadata.

**Acceptance Criteria:**
- Create, read, update, delete projects
- Fields: name, description, repo link, live URL, tech stack tags
- Auto-fetch GitHub star count for linked repos
- Display on developer profile

---

## F7 — Leaderboards

### F7.1 Global Leaderboard

**What:** Rank all developers by DevScore.

**Acceptance Criteria:**
- Paginated table: rank, avatar, name, DevScore
- Sort by overall score
- Show user's own rank highlighted

---

### F7.2 College-Specific Leaderboard

**What:** Filter leaderboard by college/institution.

**Acceptance Criteria:**
- Users set their college in profile settings
- Leaderboard filterable by college name
- Cached database queries for performance

---

## F8 — Portfolio Editor

### F8.1 Multi-Tab Code Editor

**What:** Write HTML, CSS, and JavaScript in a tabbed editor interface.

**Components:**
- `EditorHeader.jsx` — tab navigation (HTML, CSS, JS) + Save button + Preview button
- `CodePanel.jsx` — text input area for code
- `LivePreview.jsx` — full-screen iframe rendering (used inside PortfolioPreview page, not inside editor)

**Acceptance Criteria:**
- Three tabs: HTML, CSS, JS
- 300ms debouncing on input to prevent race conditions
- Navigation blocked via `useBeforeUnload` if form is dirty (unsaved changes)

---

### F8.2 Portfolio Preview (Separate Page)

**What:** After saving code in the editor, users can navigate to a separate full-page portfolio preview that loads their saved code from the backend.

**Flow:**
1. User writes code in the editor (PortfolioEditor page — no inline preview)
2. User clicks "Save" → code is stored in the backend (`POST /api/portfolio`)
3. User clicks "Preview" → navigates to `/portfolio/preview/:userId`
4. PortfolioPreview page fetches saved code from backend (`GET /api/portfolio/:userId`)
5. `combineCode()` merges HTML + CSS + JS into a full document
6. Rendered as a full-screen iframe via `LivePreview.jsx`
7. Sandboxed: `sandbox="allow-scripts allow-forms allow-same-origin"`

**Acceptance Criteria:**
- No code editor is visible on the preview page — only the rendered portfolio
- Portfolio is always loaded from the backend (not local state)
- Public portfolios are accessible without authentication via `/portfolio/preview/:userId`

---

### F8.3 Server-Side Sanitization

**What:** Raw HTML sanitized with DOMPurify before public display.

**Flow:**
1. User writes code in editor
2. On save, server receives `rawHtml`, `cssContent`, `jsContent`
3. Server sanitizes `rawHtml` using DOMPurify → stores as `htmlContent`
4. `rawHtml` preserved for editing, `htmlContent` used for public preview

---

### F8.4 Portfolio Visibility

**What:** Toggle portfolio between public and private.

**Acceptance Criteria:**
- `isPublic` boolean flag on PortfolioCode model
- "Portfolio" pill indicators appear on profiles, leaderboard, and recruiter search when published
- Private portfolios only visible to the owner

---

## F9 — Developer Comparison

### F9.1 Side-by-Side Comparison

**What:** Compare two developers' profiles.

**Acceptance Criteria:**
- Select two developers to compare
- Radar chart showing comparative metrics
- Shared repository detection
- Peer ranking display

---

## F10 — Admin Features

### F10.1 User Management

**What:** Admin panel for managing users.

**Acceptance Criteria:**
- View all users
- Delete users with cascading cleanup
- When a user is deleted: `Portfolio.deleteMany({ userId })` is executed along with other related data cleanup

---

## F11 — Recruiter Features

### F11.1 Developer Search

**What:** Recruiters can search and browse developer profiles.

**Acceptance Criteria:**
- Search by name, tech stack, college
- View DevScore, stats, and portfolio preview
- "Portfolio" pill indicates developers with published work

---

## Sync Pipeline

### Nightly Cron Job (2am)
- Syncs GitHub stats for all users
- Syncs DSA stats (LeetCode, Codeforces) for all users
- **Explicitly excludes** PortfolioCode to avoid unnecessary compute on static content
- Recomputes DevScore after sync

---

*Each feature is designed to work within the MERN stack using React JS, TailwindCSS, and Vite on the frontend.*
