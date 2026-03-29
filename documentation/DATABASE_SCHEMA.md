# Database Schema

Last updated: 2026-03-29
Database: MongoDB via Mongoose

## Collection Overview

| Collection | Cardinality to User | Primary Use |
| --- | --- | --- |
| users | 1:1 base | Identity, auth, role, archetypes, platform handles |
| profiles | 1:1 | Public profile metadata + visibility |
| githubstats | 1:1 | GitHub metrics + activity history |
| dsastats | 1:1 | LeetCode + Codeforces metrics |
| platformstats | 1:1 | HackerRank, CodeChef, Kaggle, Hugging Face metrics |
| devscores | 1:N history | DevScore snapshots and diagnostics |
| projects | 1:N | User project cards |
| portfoliocodes | 1:1 | Portfolio code payload and visibility |

## users

Source: server/src/models/User.js

Fields:

- email: String, required, unique, lowercase, trimmed
- password: String, required, minlength 6, select false
- displayName: String, required
- role: Enum {developer, recruiter, mentor, admin}, default developer
- archetype: Enum {builder, problem_solver, ai_engineer, security_expert, open_source, competitor, null}
- secondaryArchetype: same enum as archetype
- githubId: String
- githubUsername: String
- githubAccessToken: String, select false
- leetcodeUsername: String
- codeforcesUsername: String
- hackerrankUsername: String
- codechefUsername: String
- kaggleUsername: String
- huggingfaceUsername: String
- refreshToken: String, select false

Indexes:

- unique email
- sparse githubId
- role
- archetype
- secondaryArchetype

Hooks/Methods:

- pre-save bcrypt hash for password
- comparePassword(candidate)
- getPlatformData()

## profiles

Source: server/src/models/Profile.js

Fields:

- userId: ObjectId ref User, required, unique
- bio: String, max 500
- avatarUrl: String
- techStack: [String]
- socialLinks.linkedin: String
- socialLinks.website: String
- socialLinks.resumeUrl: String
- socialLinks.twitter: String
- college: String
- isPublic: Boolean, default true

Indexes:

- college
- isPublic

## githubstats

Source: server/src/models/GithubStats.js

Key scalar fields:

- totalCommits
- totalContributionsLastYear
- totalContributionsAllTime
- publicRepos
- starsReceived
- pullRequests
- pullRequestsMerged
- pullRequestsTotal
- issuesOpened
- issuesClosed
- forksCount
- followers
- currentStreak
- longestStreak

Nested arrays:

- organizations: [String]
- languageDistribution[]: {language, count, bytes}
- contributionCalendar[]: {date, count}

Metadata:

- githubAvatarUrl
- githubProfileUrl
- lastSyncedAt

Constraint:

- userId unique

## dsastats

Source: server/src/models/DsaStats.js

leetcode fields include:

- easySolved, mediumSolved, hardSolved, totalSolved
- contestRating, contestGlobalRanking
- acceptanceRate
- currentStreak, activeDays, maxStreak
- topPercentage
- contestsParticipated, badgesEarned, solutionCount, reputation
- categoryWiseProblemCount[]
- languagesUsed[]
- dailyActivity[]

codeforces fields include:

- currentRating, maxRating, rank
- totalSolved
- contestsParticipated
- recentContestResults[]
- ratingHistory[]
- tagsDistribution[]
- dailySubmissions[]

Metadata:

- lastSyncedAt

Constraint:

- userId unique

## platformstats

Source: server/src/models/PlatformStats.js

Flexible object buckets (mixed shape):

- hackerrank: Object
- codechef: Object
- kaggle: Object
- huggingface: Object
- lastSyncedAt: Date

Constraint:

- userId unique

Note:

- schema intentionally uses Object for adapter flexibility.

## devscores

Source: server/src/models/DevScore.js

Core fields:

- userId: ObjectId ref User
- score: Number (0-1000)
- rawScore: Number (0-100)
- weightedRawScore: Number (0-100)
- archetype
- secondaryArchetype

Pillar breakdown object:

- problemSolving {score, max, percentile, grade}
- building {score, max, percentile, grade}
- community {score, max, percentile, grade}
- consistency {score, max, percentile, grade}
- specialization {score, max, percentile, grade}

Diagnostics and metadata:

- domain
- domainLabel
- connectedPlatforms
- platformScores (mixed)
- strengths [String]
- improvements [String]
- diagnostics (mixed)
- computedAt

Indexes:

- score descending
- compound {userId, createdAt desc}

Retention policy (service/controller level):

- latest 30 entries retained per user

## projects

Source: server/src/models/Project.js

Fields:

- userId: ObjectId ref User
- name: String, required
- description: String
- repoLink: String
- liveUrl: String
- techStack: [String]
- githubStars: Number
- likes: Number
- views: Number

Indexes:

- userId

## portfoliocodes

Source: server/src/models/PortfolioCode.js

Fields:

- userId: ObjectId ref User, unique
- rawHtml: String max 100000
- htmlContent: String max 100000 (sanitized)
- cssContent: String max 100000
- jsContent: String max 100000
- isPublic: Boolean

Indexes:

- userId unique
- isPublic

## Relationship Notes

- User to Profile: one-to-one
- User to Stats documents: one-to-one per stats collection
- User to DevScore: one-to-many time-series history
- User to Projects: one-to-many
- User to PortfolioCode: one-to-one

## Data Access Patterns

- Leaderboard and recruiter flows aggregate latest DevScore per user
- Profile and stats are usually read by either userId or displayName resolution
- Portfolio preview resolves ObjectId or displayName and enforces visibility checks

## Integrity and Validation Notes

- Many fields rely on application-level validation, especially mixed platformstats payloads
- URL fields (profile social links, project links) are not strongly schema-constrained yet
- Privacy enforcement for profile visibility exists in profile and portfolio routes; broader consistency hardening is tracked in tasks
