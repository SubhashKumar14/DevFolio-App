# Environment Setup

Last updated: 2026-04-03

## Prerequisites

- Node.js 20+ recommended
- npm 10+ recommended
- MongoDB instance (local or cloud)
- Redis optional (recommended for caching in production)

## Repository Setup

```bash
git clone <repo-url>
cd Devfolio-1.0.1
```

## Install Dependencies

```bash
npm --prefix client install
npm --prefix server install
```

## Environment Variables

Backend reads env via `dotenv.config()` from `server/src/config/env.js`.
In local development, create `server/.env` and run backend commands with `npm --prefix server ...`.

Required variables:

- MONGODB_URI
- JWT_SECRET
- JWT_REFRESH_SECRET

Optional but strongly recommended:

- ENCRYPTION_KEY
- REDIS_URL
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- GITHUB_CALLBACK_URL
- CLIENT_URL
- JWT_EXPIRY
- JWT_REFRESH_EXPIRY
- PORT
- NODE_ENV

### Example `server/.env`

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/devfolio
JWT_SECRET=replace_with_strong_secret_at_least_32_chars
JWT_REFRESH_SECRET=replace_with_strong_refresh_secret_at_least_32_chars
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
ENCRYPTION_KEY=replace_with_strong_32_plus_char_key
REDIS_URL=redis://127.0.0.1:6379
CLIENT_URL=http://localhost:5173
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

### Frontend env

client uses VITE_API_URL when set, otherwise falls back to /api.

```env
VITE_API_URL=http://localhost:5000/api
```

## Run Locally

### Start backend

```bash
npm --prefix server run dev
```

### Start frontend

```bash
npm --prefix client run dev
```

Frontend default: http://localhost:5173
Backend default: http://localhost:5000

## Quality Checks

```bash
npm --prefix client run lint
npm --prefix client run build
npm --prefix server test
npm --prefix client audit --omit=dev
npm --prefix server audit --omit=dev
```

## Production Build

Frontend:

```bash
npm --prefix client run build
npm --prefix client run preview
```

Backend:

```bash
npm --prefix server run start
```

## Deployment Notes

- client/vercel.json contains SPA rewrite to index.html
- backend CORS origin is controlled by `CLIENT_URL`
- Redis auto-disables in production when REDIS_URL is not provided
- scheduler is imported by server startup and runs nightly

Important behavior note:

- `csrfOriginProtection` supports comma-separated values in `CLIENT_URL`.
- CORS middleware in `server/src/app.js` currently uses `origin: env.CLIENT_URL` as a single value.
- Until CORS multi-origin hardening is completed, treat `CLIENT_URL` as a single origin for production CORS compatibility.

## Troubleshooting

### Missing required env variable

Symptom:

- server exits with missing env error

Fix:

- ensure required vars from env.js are set before start
- verify `server/.env` exists and includes `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`

### 401 loop on frontend

Symptom:

- repeated redirects to login

Fix:

- verify JWT secrets match tokens
- verify refresh token exists and is valid
- clear localStorage auth keys and login again

### CORS or CSRF origin errors

Symptom:

- requests blocked with 403 origin errors

Fix:

- set `CLIENT_URL` to exact frontend origin
- if multiple frontend origins are required, update backend CORS implementation first, then document the approved format

### GitHub OAuth callback failures

Fix checklist:

1. GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET configured
2. callback URL in GitHub app matches GITHUB_CALLBACK_URL
3. CLIENT_URL points to reachable frontend target

## Recommended Local Developer Flow

1. start mongodb
2. start backend
3. start frontend
4. register developer account
5. complete onboarding and connect at least one platform
6. run sync and verify dashboard data
