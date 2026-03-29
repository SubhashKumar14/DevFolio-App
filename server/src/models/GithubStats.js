import mongoose from 'mongoose';

const { Schema } = mongoose;

const githubStatsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // ─── GitHub Metrics ────────────────────
  totalCommits: { type: Number, default: 0 },
  totalContributionsLastYear: { type: Number, default: 0 },
  totalContributionsAllTime: { type: Number, default: 0 },
  publicRepos: { type: Number, default: 0 },
  starsReceived: { type: Number, default: 0 },
  pullRequests: { type: Number, default: 0 },
  pullRequestsMerged: { type: Number, default: 0 },
  pullRequestsTotal: { type: Number, default: 0 },
  issuesOpened: { type: Number, default: 0 },
  issuesClosed: { type: Number, default: 0 },
  forksCount: { type: Number, default: 0 },
  followers: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  organizations: [{ type: String }],

  // ─── Profile Info ──────────────────────
  githubAvatarUrl: { type: String, default: null },
  githubProfileUrl: { type: String, default: null },

  // ─── Language Distribution ─────────────
  languageDistribution: [{
    language: { type: String },
    count: { type: Number, default: 0 },
    bytes: { type: Number, default: 0 },
    _id: false,
  }],

  // ─── Contribution Calendar (for heatmap) ───
  contributionCalendar: [{
    date: { type: String, required: true },
    count: { type: Number, default: 0 },
    _id: false,
  }],

  // ─── Sync Metadata ─────────────────────
  lastSyncedAt: { type: Date, default: null },

}, {
  timestamps: true,
});

const GithubStats = mongoose.model('GithubStats', githubStatsSchema);

export default GithubStats;
