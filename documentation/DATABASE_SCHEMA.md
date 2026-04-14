# Database Schema (Diagram First)

This schema view documents entity relationships, lineage, and operational access patterns.

## Theoretical Foundation
The schema strategy balances normalization for integrity and denormalization for read performance.

- One-to-one profile and stats documents preserve clear ownership boundaries.
- Time-series score snapshots enable trend analysis and benchmarking.
- Index design follows cardinality and access-pattern theory for predictable query cost.

## 1. Collection Relationship ER Diagram

```mermaid
erDiagram
  User ||--|| Profile : has
  User ||--|| GithubStats : has
  User ||--|| DsaStats : has
  User ||--|| PlatformStats : has
  User ||--|| PortfolioCode : has
  User ||--o{ Project : owns
  User ||--o{ DevScore : receives
  User ||--o{ SyncJob : requests
  User ||--o{ SyncJob : targets

  User {
    ObjectId _id PK
    string email unique
    string displayName
    string publicHandle unique
    string role
    string archetype
    string secondaryArchetype
    string githubUsername
    string leetcodeUsername
    string codeforcesUsername
    string hackerrankUsername
    string codechefUsername
    string kaggleUsername
    string huggingfaceUsername
    datetime createdAt
    datetime updatedAt
  }

  Profile {
    ObjectId _id PK
    ObjectId userId FK unique
    string bio
    string avatarUrl
    string college
    boolean isPublic
    object socialLinks
    array techStack
    datetime createdAt
    datetime updatedAt
  }

  GithubStats {
    ObjectId _id PK
    ObjectId userId FK unique
    number totalCommits
    number totalContributionsLastYear
    number starsReceived
    number pullRequestsMerged
    array languageDistribution
    array contributionCalendar
    datetime lastSyncedAt
  }

  DsaStats {
    ObjectId _id PK
    ObjectId userId FK unique
    object leetcode
    object codeforces
    datetime lastSyncedAt
  }

  PlatformStats {
    ObjectId _id PK
    ObjectId userId FK unique
    object hackerrank
    object codechef
    object kaggle
    object huggingface
    datetime lastSyncedAt
  }

  DevScore {
    ObjectId _id PK
    ObjectId userId FK
    number score
    number rawScore
    number weightedRawScore
    string domain
    object platformScores
    object diagnostics
    datetime computedAt
    datetime createdAt
  }

  Project {
    ObjectId _id PK
    ObjectId userId FK
    string name
    string description
    string repoLink
    string liveUrl
    array techStack
    number githubStars
    number likes
    number views
  }

  PortfolioCode {
    ObjectId _id PK
    ObjectId userId FK unique
    string rawHtml
    string htmlContent
    string cssContent
    string jsContent
    boolean isPublic
  }

  SyncJob {
    ObjectId _id PK
    string type
    string status
    ObjectId requestedBy FK
    ObjectId targetUserId FK
    number totalTargets
    number processedTargets
    number successCount
    number errorCount
    datetime startedAt
    datetime finishedAt
    object meta
  }
```

## 2. Key Lineage: From Platform Data To Recruiter Surface

```mermaid
flowchart TD
  H1[User platform handles in User] --> H2[Adapters fetch external payloads]
  H2 --> H3[GithubStats DsaStats PlatformStats collections]
  H3 --> H4[DevScore compute and persist]
  H4 --> H5[Leaderboard and benchmark APIs]
  H3 --> H6[Analytics deep platform cards]
  H3 --> H7[Recruiter search signal projection]
  H4 --> H7
  UserProfile[Profile public visibility and college] --> H7
```

## 3. Access Pattern Diagram

```mermaid
flowchart LR
  subgraph WritePaths
    W1[Auth and onboarding] --> User
    W2[Profile update] --> Profile
    W3[Sync jobs] --> SyncJob
    W4[Adapter sync] --> GithubStats
    W4 --> DsaStats
    W4 --> PlatformStats
    W5[Score recompute] --> DevScore
    W6[Project CRUD] --> Project
    W7[Portfolio editor save] --> PortfolioCode
  end

  subgraph ReadPaths
    R1[Dashboard] --> DevScore
    R1 --> GithubStats
    R1 --> DsaStats
    R1 --> PlatformStats
    R2[Public profile] --> User
    R2 --> Profile
    R2 --> DevScore
    R3[Recruiter search] --> User
    R3 --> Profile
    R3 --> DevScore
    R3 --> PlatformStats
  end
```

## 4. Retention and Indexing Rules

```mermaid
flowchart TD
  I1[Unique user identity indexes] --> I2[email publicHandle githubId googleId]
  I2 --> I3[Fast identity lookup and collision prevention]
  I4[DevScore index userId+createdAt] --> I5[Efficient score history reads]
  I6[SyncJob TTL on finishedAt] --> I7[Auto cleanup after 7 days]
  I8[Profile indexes college and isPublic] --> I9[Recruiter and leaderboard filtering]
```

## 5. Integrity Notes

- One-to-one: User with Profile, GithubStats, DsaStats, PlatformStats, PortfolioCode.
- One-to-many: User with Project and DevScore history.
- SyncJob supports both per-user and global sync operations.
- Visibility is enforced by owner-or-public checks, not by a separate public mirror table.