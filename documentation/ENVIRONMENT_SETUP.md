# DevFolio — Environment Setup

> Step-by-step guide to set up the local development environment from scratch.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| **Node.js** | 20 LTS | [nodejs.org](https://nodejs.org) |
| **npm** | 10+ | Comes with Node.js |
| **Git** | 2.40+ | [git-scm.com](https://git-scm.com) |
| **MongoDB** | 7.0+ | Atlas (cloud) or local install |
| **VS Code** | Latest | [code.visualstudio.com](https://code.visualstudio.com) |

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/devfolio.git
cd devfolio
```

---

## 2. Install Dependencies

```bash
# Client (React + Vite)
cd client
npm install

# Server (Express + Mongoose)
cd ../server
npm install

cd ..
```

---

## 3. Environment Variables

### Server: `server/.env`

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/devfolio
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://admin:password@cluster.mongodb.net/devfolio?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_REFRESH_SECRET=another-secret-key-change-this-too
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# GitHub OAuth (required for GitHub integration)
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

### Client: `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=DevFolio
```

---

## 4. Start MongoDB

### Option A: Local MongoDB

```bash
# Install MongoDB Community Server
# Start the MongoDB service
mongod --dbpath /data/db
```

### Option B: MongoDB Atlas (Cloud)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Get the connection string
4. Set `MONGODB_URI` in `server/.env`

---

## 5. Set Up GitHub OAuth App

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: DevFolio Local
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
4. Copy **Client ID** and **Client Secret** into `server/.env`

---

## 6. Run the Development Servers

```bash
# From project root — starts both client and server
npm run dev

# Or separately:
# Terminal 1 (server):
cd server && npm run dev    # Runs on http://localhost:5000

# Terminal 2 (client):
cd client && npm run dev    # Runs on http://localhost:5173
```

The `npm run dev` at root uses `concurrently` to run both:
```json
{
  "scripts": {
    "dev": "concurrently \"cd server && npm run dev\" \"cd client && npm run dev\""
  }
}
```

---

## 7. Verify Setup

1. Open `http://localhost:5173` — should see the DevFolio landing page
2. Open `http://localhost:5000/api/health` — should return `{ "status": "ok" }`
3. Register a test account
4. Connect GitHub via OAuth → verify stats appear on dashboard
5. Enter LeetCode/Codeforces username → verify DSA stats

---

## 8. VS Code Extensions (Recommended)

| Extension | Purpose |
|---|---|
| **ESLint** | Inline linting |
| **Prettier** | Auto-formatting |
| **Tailwind CSS IntelliSense** | Class name autocomplete |
| **ES7+ React Snippets** | Fast component scaffolding |
| **Thunder Client** | API testing (like Postman) |
| **MongoDB for VS Code** | Browse DB collections |
| **GitLens** | Git blame, history |
| **Error Lens** | Inline error display |

### VS Code Settings (`.vscode/settings.json`)

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

---

## 9. Running Tests

```bash
# Server unit + integration tests (Jest + Supertest)
cd server && npm test

# Client tests
cd client && npm test

# E2E tests (requires dev servers running)
npm run test:e2e
```

---

## 10. Common Issues

| Issue | Solution |
|---|---|
| `ECONNREFUSED` on MongoDB | Start local MongoDB or check Atlas connection string |
| CORS errors in browser | Ensure `CLIENT_URL` in server `.env` matches Vite dev URL |
| `401 Unauthorized` on refresh | Clear browser cookies and re-login |
| GitHub OAuth callback fails | Check `GITHUB_CALLBACK_URL` matches the one set in GitHub settings |
| LeetCode API returns null | Username may not exist — check on leetcode.com |
| Codeforces rate limit | Wait 2 seconds between requests |

---

*Once setup is complete, the development servers auto-reload on file changes (Vite HMR for client, nodemon for server).*
