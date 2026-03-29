# Platform Adapters

Last updated: 2026-03-29

## Purpose

Platform adapters translate third-party platform data into internal, score-ready payloads.

Location: server/src/services

## Adapter Contract

Each adapter follows a practical contract:

- input: username/handle (and optional token for GitHub)
- external fetch: one or more API calls/scrapes
- normalization: returns stable object shape expected by controllers and score builder
- resiliency: catches errors and returns safe fallback values

## Adapter Inventory

| Adapter | File | Input | Output Target Model |
| --- | --- | --- | --- |
| GitHub | githubService.js | githubUsername + optional accessToken | GithubStats |
| LeetCode | leetcodeService.js | username | DsaStats.leetcode |
| Codeforces | codeforcesService.js | username | DsaStats.codeforces |
| HackerRank | hackerrankService.js | username | PlatformStats.hackerrank |
| CodeChef | codechefService.js | username | PlatformStats.codechef |
| Kaggle | kaggleService.js | username | PlatformStats.kaggle |
| Hugging Face | huggingfaceService.js | username | PlatformStats.huggingface |
| Contest Feed | contestService.js | none | /contests/upcoming payload |

## Per-Adapter Details

### GitHub Adapter

Data sources:

- REST user profile
- REST repos
- REST orgs
- search APIs for commit/pr/issue counters
- GraphQL contribution calendar when token available
- fallback scraping and public events fallback for calendar

Key normalized fields:

- totalCommits
- totalContributionsLastYear
- totalContributionsAllTime
- publicRepos
- starsReceived
- pullRequestsTotal, pullRequestsMerged
- issuesOpened, issuesClosed
- forksCount, followers
- organizations[]
- languageDistribution[]
- contributionCalendar[]
- currentStreak, longestStreak

### LeetCode Adapter

Data source:

- GraphQL endpoint

Primary query:

- solved counts by difficulty
- submission calendar
- contest ranking/rating
- badge + tag + language distributions

Fallback query:

- solved counts + submission calendar only

Key normalized fields:

- easySolved, mediumSolved, hardSolved, totalSolved
- contestRating, contestGlobalRanking
- acceptanceRate
- currentStreak, activeDays, maxStreak
- topPercentage, contestsParticipated
- badgesEarned
- categoryWiseProblemCount[]
- languagesUsed[]
- dailyActivity[]

### Codeforces Adapter

Data sources:

- user.info
- user.rating
- user.status

Key normalized fields:

- currentRating, maxRating, rank
- totalSolved
- contestsParticipated
- recentContestResults[]
- ratingHistory[]
- dailySubmissions[]
- tagsDistribution[]

### HackerRank Adapter

Data sources:

- public REST profile endpoints

Key normalized fields:

- badges[]
- totalBadges
- totalStars
- domainScores[]
- badgeTierByDomain
- domainRanks
- contestRanking
- contestsParticipated
- level and profile metadata

### CodeChef Adapter

Data source:

- HTML profile parsing

Key normalized fields:

- currentRating
- stars and starsCount
- problemsSolved
- globalRank, countryRank
- highestRating
- contestCount
- fullySolvedCount, partiallySolvedCount

### Kaggle Adapter

Data source:

- public users API endpoint

Key normalized fields:

- tier
- totalMedals and medal breakdowns
- competitionMedals, notebookMedals, datasetMedals
- competitionsCount
- notebookVotesReceived
- datasetDownloads
- followers/following
- ranking

### Hugging Face Adapter

Data sources:

- models API
- datasets API
- spaces API
- user profile and overview endpoints

Key normalized fields:

- modelsPublished
- datasetsPublished
- spacesCreated
- modelDownloads
- datasetDownloads
- totalDownloads
- totalLikes
- spacesLikes
- followers/following
- organizations[]
- topModels[]

### Contest Adapter

Aggregates:

- Codeforces upcoming contests
- LeetCode upcoming contests

Unified output fields:

- platform
- name
- startTime
- durationSeconds
- url

## Adapter Error Handling Pattern

- outbound axios calls have timeouts
- each adapter catches failures and emits fallback-safe payload
- sync flow continues even when one platform fails

## Adapter Output Consumption

- persisted in stats collections
- buildPlatformData combines persisted records
- devscoreEngine consumes combined platformData
- analytics/leaderboard/compare views consume resulting records and score outputs

## Integration Caveats

- Some adapters depend on unofficial or scrape-like endpoints and may break on upstream changes
- GraphQL-enhanced GitHub calendar quality depends on GitHub token availability
- Flexible PlatformStats schema trades strict validation for adapter evolution speed

## When Adding a New Platform

1. create new adapter in server/src/services
2. add user handle field in User model
3. wire adapter into stats sync and scheduler
4. extend buildPlatformData mapping
5. update scoring engine signal mapping (if needed)
6. update analytics UI and constants
7. update documentation files:
   - PLATFORM_ADAPTERS
   - FEATURES
   - API_REFERENCE
   - platform_analytics_catalog

