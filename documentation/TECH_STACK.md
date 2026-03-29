# Tech Stack

Last updated: 2026-03-29

## Overview

DevFolio is a JavaScript full-stack web application:

- Frontend: React SPA
- Backend: Node.js + Express API
- Database: MongoDB
- Cache: Redis (optional)

## Frontend Stack

From client/package.json:

### Runtime dependencies

- react 19.2.4
- react-dom 19.2.4
- react-router-dom 7.13.1
- @tanstack/react-query 5.90.21
- zustand 5.0.11
- axios 1.13.6
- recharts 3.8.0
- react-hot-toast 2.6.0
- react-hook-form 7.71.2
- zod 4.3.6
- @hookform/resolvers 5.2.2
- lucide-react 0.577.0
- @radix-ui/react-slot 1.2.4
- class-variance-authority 0.7.1
- clsx 2.1.1
- tailwind-merge 3.5.0
- framer-motion 12.36.0

### Build/dev dependencies

- vite 8.0.0
- @vitejs/plugin-react 6.0.0
- tailwindcss 3.4.19
- postcss 8.5.8
- autoprefixer 10.4.27
- eslint 9.39.4
- @eslint/js 9.39.4
- eslint-plugin-react-hooks 7.0.1
- eslint-plugin-react-refresh 0.5.2
- globals 17.4.0
- @types/node 25.5.0
- @types/react 19.2.14
- @types/react-dom 19.2.3

## Backend Stack

From server/package.json:

### Runtime dependencies

- express 5.2.1
- mongoose 9.3.1
- jsonwebtoken 9.0.3
- bcryptjs 3.0.3
- axios 1.13.6
- dotenv 17.3.1
- cors 2.8.6
- helmet 8.1.0
- express-rate-limit 8.3.1
- ioredis 5.10.1
- node-cron 4.2.1
- jsdom 29.0.1
- dompurify 3.3.3
- multer 2.1.1
- validator 13.15.26

### Dev dependencies

- jest 30.3.0
- supertest 7.2.2
- nodemon 3.1.14

## Data and Persistence

- MongoDB collections via Mongoose models:
  - User
  - Profile
  - GithubStats
  - DsaStats
  - PlatformStats
  - DevScore
  - Project
  - PortfolioCode

## Infrastructure and Deployment

### Frontend

- Vite build output
- SPA rewrite config in client/vercel.json
- Dev proxy /api -> localhost:5000

### Backend

- Node runtime server
- Optional Redis caching
- Cron scheduler imported at server startup

## Tooling and Quality

- Linting: ESLint (frontend)
- Testing: Jest (backend)
- Security checks: npm audit --omit=dev

Current validated checks (2026-03-29):

- client lint pass
- client build pass
- server tests pass
- client/server npm audit pass

## Architecture Notes

- API client uses interceptor-driven token refresh
- Server uses centralized error middleware
- Rate limiters defined per concern (api/auth/sync)
- Platform adapters encapsulated in server/src/services

## Stack Risks and Improvement Targets

- localStorage token approach should be replaced by httpOnly cookie strategy
- some dependencies are currently present but underutilized (needs periodic pruning)
- backend tests are smoke-level and should be expanded

## Cross-References

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- [devfolio_project_audit.md](./devfolio_project_audit.md)
