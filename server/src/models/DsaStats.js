import mongoose from 'mongoose';

const { Schema } = mongoose;

const dsaStatsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // ─── LeetCode Stats ───────────────────
  leetcode: {
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    totalSolved: { type: Number, default: 0 },
  },

  // ─── Codeforces Stats ──────────────────
  codeforces: {
    currentRating: { type: Number, default: 0 },
    maxRating: { type: Number, default: 0 },
    rank: { type: String, default: '' },
  },

  // ─── Sync Metadata ─────────────────────
  lastSyncedAt: { type: Date, default: null },

}, {
  timestamps: true,
});

// ─── Indexes ──────────────────────────────
// userId index auto-created by unique: true

const DsaStats = mongoose.model('DsaStats', dsaStatsSchema);

export default DsaStats;
