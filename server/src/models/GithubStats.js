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
  publicRepos: { type: Number, default: 0 },
  starsReceived: { type: Number, default: 0 },
  pullRequests: { type: Number, default: 0 },
  forksCount: { type: Number, default: 0 },
  followers: { type: Number, default: 0 },

  // ─── Profile Info ──────────────────────
  githubAvatarUrl: { type: String, default: null },
  githubProfileUrl: { type: String, default: null },

  // ─── Language Distribution ─────────────
  languageDistribution: [{
    language: { type: String },
    count: { type: Number, default: 0 },
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
