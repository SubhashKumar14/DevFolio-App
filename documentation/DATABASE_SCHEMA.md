# DevFolio — Database Schema

> Complete MongoDB schema definitions — every collection, field, index, and relationship.

---

## Overview

DevFolio uses **MongoDB** (via Mongoose ODM) with the following collections:

| Collection | Purpose |
|---|---|
| `users` | Account info, auth credentials, roles, GitHub IDs |
| `profiles` | Bio, avatar, tech stack, social links |
| `githubStats` | Synchronized GitHub activity metrics |
| `dsaStats` | LeetCode + Codeforces data |
| `projects` | User's personal projects |
| `devScores` | Computed DevScore snapshots |
| `portfolioCodes` | Raw + sanitized portfolio code |

---

## 1. Users Collection

**Mongoose Model:** `User`

```javascript
const userSchema = new Schema({
  // ─── Core Identity ─────────────────────
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false  // Never returned in queries by default
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },

  // ─── Role ───────────────────────────────
  role: {
    type: String,
    enum: ['developer', 'recruiter', 'mentor', 'admin'],
    default: 'developer'
  },

  // ─── GitHub OAuth ───────────────────────
  githubId: { type: String, default: null },
  githubUsername: { type: String, default: null },
  githubAccessToken: { type: String, select: false },

  // ─── DSA Platform Handles ───────────────
  leetcodeUsername: { type: String, default: null },
  codeforcesUsername: { type: String, default: null },

  // ─── Auth ───────────────────────────────
  refreshToken: { type: String, select: false }

}, {
  timestamps: true
});
```

### Indexes

```javascript
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ githubId: 1 }, { sparse: true });
userSchema.index({ role: 1 });
```

### Hooks

```javascript
// Hash password on save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};
```

---

## 2. Profiles Collection

**Mongoose Model:** `Profile`

```javascript
const profileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // ─── Profile Info ──────────────────────
  bio: { type: String, maxlength: 500, default: '' },
  avatarUrl: { type: String, default: null },

  // ─── Tech Stack ────────────────────────
  techStack: [{
    type: String,
    trim: true
  }],
  // Example: ["React", "Node.js", "Python", "MongoDB"]

  // ─── Social Links ──────────────────────
  socialLinks: {
    linkedin: { type: String, default: '' },
    website: { type: String, default: '' }
  },

  // ─── College (for leaderboard filtering)
  college: { type: String, default: '' },

  // ─── Visibility ────────────────────────
  isPublic: { type: Boolean, default: true }

}, {
  timestamps: true
});
```

### Indexes

```javascript
profileSchema.index({ userId: 1 }, { unique: true });
profileSchema.index({ college: 1 });
profileSchema.index({ isPublic: 1 });
```

---

## 3. GithubStats Collection

**Mongoose Model:** `GithubStats`

```javascript
const githubStatsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // ─── GitHub Metrics ────────────────────
  totalCommits: { type: Number, default: 0 },
  publicRepos: { type: Number, default: 0 },
  starsReceived: { type: Number, default: 0 },
  pullRequests: { type: Number, default: 0 },

  // ─── Profile Info ──────────────────────
  githubAvatarUrl: { type: String, default: null },
  githubProfileUrl: { type: String, default: null },

  // ─── Sync Metadata ─────────────────────
  lastSyncedAt: { type: Date, default: null }

}, {
  timestamps: true
});
```

### Indexes

```javascript
githubStatsSchema.index({ userId: 1 }, { unique: true });
```

---

## 4. DsaStats Collection

**Mongoose Model:** `DsaStats`

```javascript
const dsaStatsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // ─── LeetCode Stats ───────────────────
  leetcode: {
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    totalSolved: { type: Number, default: 0 }
  },

  // ─── Codeforces Stats ──────────────────
  codeforces: {
    currentRating: { type: Number, default: 0 },
    maxRating: { type: Number, default: 0 },
    rank: { type: String, default: '' }
  },

  // ─── Sync Metadata ─────────────────────
  lastSyncedAt: { type: Date, default: null }

}, {
  timestamps: true
});
```

### Indexes

```javascript
dsaStatsSchema.index({ userId: 1 }, { unique: true });
```

---

## 5. Projects Collection

**Mongoose Model:** `Project`

```javascript
const projectSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ─── Project Info ──────────────────────
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  repoLink: { type: String, default: '' },
  liveUrl: { type: String, default: '' },

  // ─── Tech Tags ─────────────────────────
  techStack: [{ type: String }],

  // ─── Auto-Fetched ──────────────────────
  githubStars: { type: Number, default: 0 },

  // ─── Engagement ────────────────────────
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 }

}, {
  timestamps: true
});
```

### Indexes

```javascript
projectSchema.index({ userId: 1 });
```

---

## 6. DevScores Collection

**Mongoose Model:** `DevScore`

```javascript
const devScoreSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ─── Overall Score ─────────────────────
  overallScore: { type: Number, required: true, min: 0 },

  // ─── Breakdown ──────────────────────────
  breakdown: {
    github: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 40 }
    },
    dsa: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 40 }
    },
    portfolio: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 20 }
    }
  },

  // ─── Metadata ──────────────────────────
  computedAt: { type: Date, default: Date.now }

}, {
  timestamps: true
});
```

### Indexes

```javascript
// Leaderboard: rank by score
devScoreSchema.index({ overallScore: -1 });

// User score history
devScoreSchema.index({ userId: 1, createdAt: -1 });
```

---

## 7. PortfolioCodes Collection

**Mongoose Model:** `PortfolioCode`

```javascript
const portfolioCodeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // ─── Raw Code (for editing) ────────────
  rawHtml: { type: String, default: '' },

  // ─── Sanitized Code (for public preview)
  htmlContent: { type: String, default: '' },

  // ─── CSS & JS ──────────────────────────
  cssContent: { type: String, default: '' },
  jsContent: { type: String, default: '' },

  // ─── Visibility ────────────────────────
  isPublic: { type: Boolean, default: false }

}, {
  timestamps: true
});
```

### Indexes

```javascript
portfolioCodeSchema.index({ userId: 1 }, { unique: true });
portfolioCodeSchema.index({ isPublic: 1 });
```

---

## Entity Relationship Diagram

```
┌────────────┐        ┌──────────────┐
│   Users     │───1:1──│   Profiles   │
│             │        │              │
│ _id         │        │ userId (FK)  │
│ email       │        │ bio          │
│ password    │        │ techStack[]  │
│ role        │        │ socialLinks  │
│ githubId    │        │ college      │
└──────┬──────┘        └──────────────┘
       │
       ├──1:1──┌──────────────┐
       │       │  GithubStats  │
       │       │ userId (FK)   │
       │       │ commits       │
       │       │ repos, stars  │
       │       └──────────────┘
       │
       ├──1:1──┌──────────────┐
       │       │   DsaStats   │
       │       │ userId (FK)  │
       │       │ leetcode {}  │
       │       │ codeforces{} │
       │       └──────────────┘
       │
       ├──1:N──┌──────────────┐
       │       │   Projects   │
       │       │ userId (FK)  │
       │       │ name, desc   │
       │       │ repoLink     │
       │       └──────────────┘
       │
       ├──1:N──┌──────────────┐
       │       │  DevScores   │
       │       │ userId (FK)  │
       │       │ overallScore │
       │       │ breakdown    │
       │       └──────────────┘
       │
       └──1:1──┌─────────────────┐
               │ PortfolioCodes   │
               │ userId (FK)      │
               │ rawHtml          │
               │ htmlContent      │
               │ cssContent       │
               │ jsContent        │
               │ isPublic         │
               └─────────────────┘
```

---

## Cascading Deletes

When an admin deletes a user, the following cascade is triggered:

```javascript
// Delete all related documents
await Profile.deleteMany({ userId });
await GithubStats.deleteMany({ userId });
await DsaStats.deleteMany({ userId });
await Project.deleteMany({ userId });
await DevScore.deleteMany({ userId });
await PortfolioCode.deleteMany({ userId });
await User.findByIdAndDelete(userId);
```

---

*All schemas use Mongoose's `timestamps: true` option which auto-manages `createdAt` and `updatedAt` fields.*
