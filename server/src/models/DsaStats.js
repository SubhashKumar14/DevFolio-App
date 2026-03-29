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
    contestRating: { type: Number, default: null },
    acceptanceRate: { type: Number, default: null },
    activeDays: { type: Number, default: null },
    maxStreak: { type: Number, default: null },
    topPercentage: { type: Number, default: null },
    contestsParticipated: { type: Number, default: null },
    badgesEarned: { type: Number, default: null },
    dailyActivity: [{
      date: { type: String },
      count: { type: Number },
      _id: false,
    }],
  },

  // ─── Codeforces Stats ──────────────────
  codeforces: {
    currentRating: { type: Number, default: 0 },
    maxRating: { type: Number, default: 0 },
    rank: { type: String, default: '' },
    totalSolved: { type: Number, default: 0 },
    contestsParticipated: { type: Number, default: 0 },
    ratingHistory: [{
      contestName: { type: String },
      rank: { type: Number },
      oldRating: { type: Number },
      newRating: { type: Number },
      date: { type: String },
      _id: false,
    }],
    dailySubmissions: [{
      date: { type: String },
      count: { type: Number },
      _id: false,
    }],
  },

  // ─── Sync Metadata ─────────────────────
  lastSyncedAt: { type: Date, default: null },

}, {
  timestamps: true,
});

const DsaStats = mongoose.model('DsaStats', dsaStatsSchema);

export default DsaStats;
