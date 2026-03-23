# DevFolio — Platform Integrations

> How DevFolio connects to external platforms — GitHub OAuth, GitHub API, LeetCode API, and Codeforces API.

---

## Overview

DevFolio integrates with **three external platforms** to fetch developer statistics:

| Platform | Method | Data |
|---|---|---|
| **GitHub** | OAuth 2.0 + REST API | Commits, repos, stars, PRs |
| **LeetCode** | Unofficial GraphQL API | Problems solved (easy/medium/hard) |
| **Codeforces** | Official REST API | Rating, max rating, rank |

---

## 1. GitHub Integration

### Authentication via OAuth 2.0

DevFolio uses GitHub OAuth to securely link developer accounts.

**Flow:**
1. User clicks "Connect GitHub" in settings
2. Frontend redirects to GitHub authorization URL:
   ```
   https://github.com/login/oauth/authorize?client_id=CLIENT_ID&scope=read:user,repo
   ```
3. User authorizes the application on GitHub
4. GitHub redirects to callback URL: `/api/auth/github/callback?code=AUTH_CODE`
5. Backend exchanges code for access token:
   ```
   POST https://github.com/login/oauth/access_token
   Body: { client_id, client_secret, code }
   ```
6. Backend fetches GitHub user info:
   ```
   GET https://api.github.com/user
   Authorization: Bearer <access_token>
   ```
7. Store `githubId`, `githubUsername`, and `githubAccessToken` on User model

### Environment Variables

```env
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

### Stat Fetching via GitHub REST API

```javascript
// server/src/services/githubService.js

async function fetchGithubStats(githubUsername, accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Fetch user info + repos in parallel
  const [userRes, reposRes] = await Promise.all([
    axios.get(`https://api.github.com/users/${githubUsername}`, { headers }),
    axios.get(`https://api.github.com/users/${githubUsername}/repos?per_page=100&sort=updated`, { headers })
  ]);

  const repos = reposRes.data;
  const starsReceived = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);

  return {
    totalCommits: userRes.data.public_repos,  // Use events API for accurate count
    publicRepos: userRes.data.public_repos,
    starsReceived,
    pullRequests: 0,  // Can be fetched via search API
    githubAvatarUrl: userRes.data.avatar_url,
    githubProfileUrl: userRes.data.html_url,
    lastSyncedAt: new Date()
  };
}
```

### Rate Limits

- **Authenticated requests**: 5,000 per hour
- **Unauthenticated requests**: 60 per hour
- Always use the stored access token for API calls

---

## 2. LeetCode Integration

### API Details

| Field | Value |
|---|---|
| **Data Source** | Unofficial GraphQL API |
| **Endpoint** | `https://leetcode.com/graphql` |
| **Method** | HTTP `POST` |
| **Auth Required** | No (public profiles only) |
| **Rate Limit** | ~30 requests/minute (conservative) |

### GraphQL Query

```javascript
// server/src/services/leetcodeService.js

async function fetchLeetcodeStats(username) {
  const query = `
    query getUserProblemsSolved($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  const response = await axios.post('https://leetcode.com/graphql', {
    query,
    variables: { username }
  }, {
    headers: { 'Content-Type': 'application/json' }
  });

  const stats = response.data.data.matchedUser.submitStatsGlobal.acSubmissionNum;

  return {
    easySolved: stats.find(s => s.difficulty === 'Easy')?.count || 0,
    mediumSolved: stats.find(s => s.difficulty === 'Medium')?.count || 0,
    hardSolved: stats.find(s => s.difficulty === 'Hard')?.count || 0,
    totalSolved: stats.find(s => s.difficulty === 'All')?.count || 0
  };
}
```

### Error Handling

- **User not found**: LeetCode returns `null` for `matchedUser` — handle gracefully
- **Rate limited**: Wait and retry after 60 seconds
- **API changes**: LeetCode's GraphQL is unofficial — queries may break

---

## 3. Codeforces Integration

### API Details

| Field | Value |
|---|---|
| **Data Source** | Official REST API |
| **Base URL** | `https://codeforces.com/api/` |
| **Method** | HTTP `GET` |
| **Auth Required** | No |
| **Rate Limit** | 1 request per 2 seconds (strict) |

### API Endpoint

```javascript
// server/src/services/codeforcesService.js

async function fetchCodeforcesStats(username) {
  const response = await axios.get(
    `https://codeforces.com/api/user.info?handles=${username}`
  );

  const user = response.data.result[0];

  return {
    currentRating: user.rating || 0,
    maxRating: user.maxRating || 0,
    rank: user.rank || 'unrated'
  };
}
```

### Error Handling

- **User not found**: API returns `status: "FAILED"` with `comment: "handles: User with handle ... not found"`
- **Rate limited**: Wait 2 seconds between requests
- **API down**: Codeforces occasionally has downtime — skip and use cached data

---

## 4. Sync Pipeline

### Manual Sync

Users can trigger a manual sync via the dashboard "Sync Now" button:

```
POST /api/stats/sync
→ Fetch GitHub stats (if connected)
→ Fetch LeetCode stats (if connected)
→ Fetch Codeforces stats (if connected)
→ Recompute DevScore
```

### Nightly Cron Sync (2am)

```javascript
// server/src/cron/scheduler.js
const cron = require('node-cron');

cron.schedule('0 2 * * *', async () => {
  const users = await User.find({
    $or: [
      { githubUsername: { $ne: null } },
      { leetcodeUsername: { $ne: null } },
      { codeforcesUsername: { $ne: null } }
    ]
  });

  for (const user of users) {
    try {
      if (user.githubUsername) await syncGithubStats(user);
      if (user.leetcodeUsername) await syncLeetcodeStats(user);
      if (user.codeforcesUsername) await syncCodeforcesStats(user);
      await recomputeDevScore(user._id);
    } catch (error) {
      console.error(`Sync failed for user ${user._id}:`, error.message);
    }
  }
});
```

> **Important:** PortfolioCode is **explicitly excluded** from the nightly sync — portfolio content is static user-generated code and doesn't need external fetching.

---

## Adding a New Platform

To add a new platform integration:

1. Create a new service file: `server/src/services/newPlatformService.js`
2. Implement a `fetchStats(username)` function
3. Create or extend a Mongoose model for the data
4. Add sync logic to the cron scheduler
5. Add the new stats to the DevScore computation
6. Create frontend components to display the new data

---

*DevFolio's integrations are simple, service-based functions — no adapter pattern or factory needed for 3 platforms.*
