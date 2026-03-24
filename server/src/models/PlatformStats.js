import mongoose from 'mongoose';

const { Schema } = mongoose;

const platformStatsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // ─── HackerRank ────────────────────────
  hackerrank: {
    totalBadges: { type: Number, default: 0 },
    totalStars: { type: Number, default: 0 },
    badges: [{
      name: { type: String },
      stars: { type: Number, default: 0 },
      _id: false,
    }],
    level: { type: Number, default: 0 },
  },

  // ─── CodeChef ──────────────────────────
  codechef: {
    currentRating: { type: Number, default: 0 },
    stars: { type: String, default: '' },
    problemsSolved: { type: Number, default: 0 },
    globalRank: { type: Number, default: 0 },
    countryRank: { type: Number, default: 0 },
  },

  // ─── Kaggle ────────────────────────────
  kaggle: {
    tier: { type: String, default: 'Unknown' },
    totalMedals: { type: Number, default: 0 },
    goldMedals: { type: Number, default: 0 },
    silverMedals: { type: Number, default: 0 },
    bronzeMedals: { type: Number, default: 0 },
    notebooks: { type: Number, default: 0 },
    competitions: { type: Number, default: 0 },
    ranking: { type: Number, default: 0 },
  },

  // ─── GeeksforGeeks ─────────────────────
  gfg: {
    totalProblemsSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    instituteRank: { type: Number, default: 0 },
    streak: { type: String, default: '0' },
  },

  // ─── Sync Metadata ─────────────────────
  lastSyncedAt: { type: Date, default: null },

}, {
  timestamps: true,
});

const PlatformStats = mongoose.model('PlatformStats', platformStatsSchema);

export default PlatformStats;
