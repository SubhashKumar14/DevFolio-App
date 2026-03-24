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

  // ─── Profile Info ──────────────────────
  githubAvatarUrl: { type: String, default: null },
  githubProfileUrl: { type: String, default: null },

  // ─── Contribution Calendar (for heatmap) ───
  contributionCalendar: [{
    date: { type: String, required: true },     // "2024-03-24"
    count: { type: Number, default: 0 },
    _id: false,
  }],

  // ─── Sync Metadata ─────────────────────
  lastSyncedAt: { type: Date, default: null },

}, {
  timestamps: true,
});

// ─── Indexes ──────────────────────────────
// userId index auto-created by unique: true

const GithubStats = mongoose.model('GithubStats', githubStatsSchema);

export default GithubStats;
