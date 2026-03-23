# DevFolio — API Reference

> Complete REST API specification — every endpoint, request/response format, status codes, and authentication requirements.

---

## Base URL

```
Development: http://localhost:5000/api
Production:  https://api.devfolio.dev/api
```

## Authentication

Most endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

---

## Table of Contents

1. [Auth Endpoints](#1-auth-endpoints)
2. [User Endpoints](#2-user-endpoints)
3. [Profile Endpoints](#3-profile-endpoints)
4. [Integration Endpoints](#4-integration-endpoints)
5. [Stats Endpoints](#5-stats-endpoints)
6. [DevScore Endpoints](#6-devscore-endpoints)
7. [Project Endpoints](#7-project-endpoints)
8. [Leaderboard Endpoints](#8-leaderboard-endpoints)
9. [Portfolio Endpoints](#9-portfolio-endpoints)
10. [Comparison Endpoints](#10-comparison-endpoints)
11. [Admin Endpoints](#11-admin-endpoints)
12. [Recruiter Endpoints](#12-recruiter-endpoints)

---

## 1. Auth Endpoints

### POST `/api/auth/register`

Create a new user account.

**Auth:** None

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "email": "john@example.com", "displayName": "John Doe", "role": "developer" },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST `/api/auth/login`

Authenticate user with email and password.

**Auth:** None

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "email": "john@example.com", "displayName": "John Doe", "role": "developer" },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST `/api/auth/refresh`

Refresh the access token using a refresh token.

**Auth:** None (uses refresh token from cookie)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST `/api/auth/logout`

Logout and invalidate refresh token.

**Auth:** Bearer Token

**Response (200):**
```json
{ "success": true, "message": "Logged out successfully" }
```

---

### GET `/api/auth/github`

Redirect to GitHub OAuth authorization page.

**Auth:** None

**Response:** 302 redirect to `https://github.com/login/oauth/authorize?client_id=...`

---

### GET `/api/auth/github/callback`

GitHub OAuth callback — exchange code for access token and link account.

**Auth:** None

**Query Params:** `?code=...`

**Response:** Redirects to frontend with JWT token

---

## 2. User Endpoints

### GET `/api/user/me`

Get the current authenticated user's data.

**Auth:** Bearer Token

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "john@example.com",
    "displayName": "John Doe",
    "role": "developer",
    "githubUsername": "johndoe",
    "leetcodeUsername": "john_lc",
    "codeforcesUsername": "john_cf"
  }
}
```

---

### PUT `/api/user/me`

Update user profile settings.

**Auth:** Bearer Token

**Request Body:**
```json
{
  "displayName": "John D.",
  "leetcodeUsername": "john_leetcode",
  "codeforcesUsername": "john_cf"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ...updatedUser }
}
```

---

## 3. Profile Endpoints

### GET `/api/profile/:userId`

Get a user's profile (bio, tech stack, social links).

**Auth:** Optional (public profiles accessible without auth)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "bio": "Full-stack developer passionate about React",
    "techStack": ["React", "Node.js", "MongoDB"],
    "socialLinks": { "linkedin": "https://linkedin.com/in/john", "website": "https://john.dev" },
    "college": "IIT Delhi",
    "avatarUrl": "https://...",
    "isPublic": true
  }
}
```

---

### PUT `/api/profile/me`

Update own profile.

**Auth:** Bearer Token

**Request Body:**
```json
{
  "bio": "Updated bio",
  "techStack": ["React", "Node.js", "Python"],
  "socialLinks": { "linkedin": "https://linkedin.com/in/john" },
  "college": "IIT Delhi"
}
```

**Response (200):**
```json
{ "success": true, "data": { ...updatedProfile } }
```

---

## 4. Integration Endpoints

### POST `/api/integrations/github/connect`

Link GitHub account via OAuth token (after OAuth callback).

**Auth:** Bearer Token

**Response (200):**
```json
{
  "success": true,
  "message": "GitHub account connected",
  "data": { "githubUsername": "johndoe" }
}
```

---

### POST `/api/integrations/dsa/connect`

Link DSA platform usernames.

**Auth:** Bearer Token

**Request Body:**
```json
{
  "leetcodeUsername": "john_leetcode",
  "codeforcesUsername": "john_cf"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "DSA platforms connected"
}
```

---

## 5. Stats Endpoints

### GET `/api/stats/github/:userId`

Get GitHub stats for a user.

**Auth:** Bearer Token

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalCommits": 1247,
    "publicRepos": 42,
    "starsReceived": 156,
    "pullRequests": 89,
    "lastSyncedAt": "2026-03-23T02:00:00Z"
  }
}
```

---

### GET `/api/stats/dsa/:userId`

Get DSA stats for a user.

**Auth:** Bearer Token

**Response (200):**
```json
{
  "success": true,
  "data": {
    "leetcode": { "easySolved": 200, "mediumSolved": 350, "hardSolved": 97, "totalSolved": 647 },
    "codeforces": { "currentRating": 1856, "maxRating": 1920, "rank": "Expert" },
    "lastSyncedAt": "2026-03-23T02:00:00Z"
  }
}
```

---

### POST `/api/stats/sync`

Trigger manual sync for all connected platforms.

**Auth:** Bearer Token

**Response (200):**
```json
{
  "success": true,
  "message": "Sync triggered for GitHub and DSA stats"
}
```

---

## 6. DevScore Endpoints

### GET `/api/score/:userId`

Get current DevScore and breakdown.

**Auth:** Bearer Token

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overallScore": 847,
    "breakdown": {
      "github": { "score": 85, "weight": 40 },
      "dsa": { "score": 92, "weight": 40 },
      "portfolio": { "score": 60, "weight": 20 }
    },
    "computedAt": "2026-03-23T02:15:00Z"
  }
}
```

---

### GET `/api/score/:userId/history`

Get DevScore history for trend visualization.

**Auth:** Bearer Token

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "overallScore": 820, "computedAt": "2026-03-16T02:15:00Z" },
    { "overallScore": 835, "computedAt": "2026-03-17T02:15:00Z" },
    { "overallScore": 847, "computedAt": "2026-03-23T02:15:00Z" }
  ]
}
```

---

## 7. Project Endpoints

### GET `/api/projects/:userId`

Get all projects for a user.

**Auth:** Bearer Token

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "DevFolio",
      "description": "Developer analytics platform",
      "repoLink": "https://github.com/john/devfolio",
      "liveUrl": "https://devfolio.dev",
      "techStack": ["React", "Node.js", "MongoDB"],
      "githubStars": 23,
      "likes": 5
    }
  ]
}
```

---

### POST `/api/projects`

Create a new project.

**Auth:** Bearer Token

**Request Body:**
```json
{
  "name": "My Project",
  "description": "A cool project",
  "repoLink": "https://github.com/john/my-project",
  "liveUrl": "https://my-project.dev",
  "techStack": ["React", "Express"]
}
```

**Response (201):**
```json
{ "success": true, "data": { ...createdProject } }
```

---

### PUT `/api/projects/:projectId`

Update a project.

**Auth:** Bearer Token (owner only)

---

### DELETE `/api/projects/:projectId`

Delete a project.

**Auth:** Bearer Token (owner only)

**Response (200):**
```json
{ "success": true, "message": "Project deleted" }
```

---

## 8. Leaderboard Endpoints

### GET `/api/leaderboard`

Get global leaderboard.

**Auth:** Optional

**Query Params:**
- `page` — Page number (default: 1)
- `limit` — Results per page (default: 20)
- `college` — Filter by college name (optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rankings": [
      { "rank": 1, "userId": "...", "displayName": "Alice", "overallScore": 920, "hasPortfolio": true },
      { "rank": 2, "userId": "...", "displayName": "Bob", "overallScore": 890, "hasPortfolio": false }
    ],
    "totalPages": 5,
    "currentPage": 1
  }
}
```

---

### GET `/api/leaderboard/college/:collegeName`

Get college-specific leaderboard.

**Auth:** Optional

**Response (200):**
```json
{
  "success": true,
  "data": {
    "college": "IIT Delhi",
    "rankings": [ ...sameStructure ]
  }
}
```

---

## 9. Portfolio Endpoints

### GET `/api/portfolio/:userId`

Get a user's portfolio code.

**Auth:** Optional (public portfolios only, or owner)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rawHtml": "<div>Hello</div>",
    "htmlContent": "<div>Hello</div>",
    "cssContent": "div { color: blue; }",
    "jsContent": "console.log('hello');",
    "isPublic": true
  }
}
```

---

### POST `/api/portfolio`

Save or update portfolio code.

**Auth:** Bearer Token

**Request Body:**
```json
{
  "rawHtml": "<div>Hello</div>",
  "cssContent": "div { color: blue; }",
  "jsContent": "console.log('hello');"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Portfolio saved",
  "data": {
    "rawHtml": "<div>Hello</div>",
    "htmlContent": "<div>Hello</div>",
    "cssContent": "div { color: blue; }",
    "jsContent": "console.log('hello');",
    "isPublic": false
  }
}
```

> Note: `htmlContent` is auto-generated from `rawHtml` via DOMPurify sanitization on the server.

---

### PATCH `/api/portfolio/visibility`

Toggle portfolio public/private.

**Auth:** Bearer Token

**Request Body:**
```json
{ "isPublic": true }
```

**Response (200):**
```json
{ "success": true, "message": "Portfolio is now public" }
```

---

## 10. Comparison Endpoints

### GET `/api/compare/:userId1/:userId2`

Compare two developers.

**Auth:** Bearer Token

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user1": {
      "displayName": "Alice",
      "devScore": 920,
      "githubStats": { ... },
      "dsaStats": { ... },
      "hasPortfolio": true
    },
    "user2": {
      "displayName": "Bob",
      "devScore": 890,
      "githubStats": { ... },
      "dsaStats": { ... },
      "hasPortfolio": false
    },
    "sharedRepos": ["react-utils", "node-starter"],
    "radarData": [
      { "metric": "GitHub", "user1": 85, "user2": 72 },
      { "metric": "DSA", "user1": 92, "user2": 88 },
      { "metric": "Portfolio", "user1": 60, "user2": 0 },
      { "metric": "Projects", "user1": 75, "user2": 80 },
      { "metric": "Consistency", "user1": 70, "user2": 65 },
      { "metric": "Breadth", "user1": 80, "user2": 55 }
    ]
  }
}
```

---

## 11. Admin Endpoints

### GET `/api/admin/users`

List all users.

**Auth:** Bearer Token (admin role only)

---

### DELETE `/api/admin/users/:userId`

Delete a user with cascading cleanup.

**Auth:** Bearer Token (admin role only)

**Response (200):**
```json
{
  "success": true,
  "message": "User and all related data deleted"
}
```

Cascading deletes: Profile, GithubStats, DsaStats, Projects, DevScores, PortfolioCode

---

## 12. Recruiter Endpoints

### GET `/api/recruiter/search`

Search developers by criteria.

**Auth:** Bearer Token (recruiter role)

**Query Params:**
- `name` — Search by name
- `techStack` — Filter by tech stack (comma-separated)
- `college` — Filter by college
- `minScore` — Minimum DevScore

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "userId": "...",
      "displayName": "Alice",
      "devScore": 920,
      "techStack": ["React", "Node.js"],
      "college": "IIT Delhi",
      "hasPortfolio": true
    }
  ]
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (invalid input) |
| `401` | Unauthorized (invalid or missing token) |
| `403` | Forbidden (insufficient role) |
| `404` | Not Found |
| `429` | Too Many Requests (rate limited) |
| `500` | Internal Server Error |

---

*All endpoints return JSON and accept JSON request bodies where applicable.*
