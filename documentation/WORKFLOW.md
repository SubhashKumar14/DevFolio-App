# DevFolio — Development Workflow

> Git strategy, branching model, PR process, CI/CD pipeline, code review checklist, and release process.

---

## Git Branching Model

We use a simplified **GitFlow** with 3 branch tiers:

```
main (production)
 └── develop (staging / integration)
      ├── feature/auth-login
      ├── feature/github-oauth
      ├── feature/portfolio-editor
      ├── fix/token-refresh-loop
      └── chore/eslint-setup
```

| Branch | Purpose | Merges Into | Protected |
|---|---|---|---|
| `main` | Production-ready code | — | Yes (PR only) |
| `develop` | Integration branch for all features | `main` | Yes (PR only) |
| `feature/*` | New features | `develop` | No |
| `fix/*` | Bug fixes | `develop` | No |
| `chore/*` | Non-code changes (config, docs, deps) | `develop` | No |
| `hotfix/*` | Emergency production fixes | `main` + `develop` | No |

---

## Branch Naming Convention

```
<type>/<short-description>

feature/github-oauth
feature/portfolio-editor
feature/leaderboard-college
feature/devscore-algorithm
fix/cors-headers
fix/token-refresh-loop
chore/eslint-prettier-setup
hotfix/xss-vulnerability
```

---

## Commit Message Convention

Follow **Conventional Commits**:

```
<type>(<scope>): <short description>

feat(auth): add GitHub OAuth callback endpoint
feat(portfolio): implement live preview with iframe sandbox
fix(auth): handle expired refresh token edge case
docs(readme): update tech stack section
style(dashboard): align stat cards on mobile
refactor(api): extract validation middleware
test(auth): add login/register integration tests
chore(deps): bump express to 4.19.2
```

| Type | When |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, no code change |
| `refactor` | Code restructure, no behavior change |
| `test` | Adding or updating tests |
| `chore` | Build, deps, config changes |

---

## Pull Request Process

### 1. Create Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/portfolio-editor
```

### 2. Develop & Commit

```bash
# Make changes...
git add .
git commit -m "feat(portfolio): implement multi-tab code editor"

# Push to remote
git push -u origin feature/portfolio-editor
```

### 3. Open PR on GitHub

- **Title:** `feat(portfolio): multi-tab code editor with live preview`
- **Description template:**

```markdown
## What
Implements the portfolio code editor with HTML/CSS/JS tabs and live preview.

## Why
Users need to create and preview their portfolios directly on DevFolio.

## Changes
- Added `CodePanel.jsx`, `LivePreview.jsx`, `EditorHeader.jsx`
- Added `combineCode()` utility
- Implemented 300ms debouncing
- Added `useBeforeUnload` for dirty form detection

## Testing
- [ ] Unit tests for combineCode utility
- [ ] Manual test: create portfolio, save, preview
- [ ] Test iframe sandboxing

## Screenshots
(attach screenshots)
```

### 4. Code Review

At least 1 approval required. Reviewer checks:

- [ ] Code follows project patterns (Context API, service layer, middleware)
- [ ] Error cases handled (API errors, network failures)
- [ ] Tests included for new logic
- [ ] No hardcoded secrets or URLs
- [ ] Performance: unnecessary re-renders avoided
- [ ] Accessibility: proper ARIA labels, keyboard navigation

### 5. Merge & Cleanup

```bash
# Merge via GitHub "Squash and Merge" button
# Then locally:
git checkout develop
git pull origin develop
git branch -d feature/portfolio-editor
```

---

## CI/CD Pipeline

### On Every Push / PR

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint          # ESLint

  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      mongo:
        image: mongo:7
        ports: ['27017:27017']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: cd server && npm test     # Jest backend tests
      - run: cd client && npm test     # Client tests

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: cd client && npm run build
```

### On Merge to `main` (Deploy)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: railway up --service devfolio-api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## Daily Development Workflow

```
Morning:
  1. git checkout develop && git pull
  2. Check GitHub Issues → pick one → assign to self
  3. Create feature branch → start coding

During Development:
  4. Run dev servers: npm run dev (concurrently: client + server)
  5. Write code → test manually → write tests
  6. Commit frequently with conventional messages

End of Work:
  7. Push branch → Open PR if ready
  8. Request review from teammate

Weekly:
  9. develop → main merge (release)
  10. Tag release: git tag v0.1.0
```

---

*Following this workflow ensures code quality, prevents regressions, and maintains a clean git history throughout the project.*
