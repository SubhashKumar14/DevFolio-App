import mongoose from 'mongoose';

const { Schema } = mongoose;

const devScoreSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // ─── Overall Score ─────────────────────
  overallScore: { type: Number, required: true, min: 0 },

  // ─── Breakdown ──────────────────────────
  breakdown: {
    github: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 40 },
    },
    dsa: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 40 },
    },
    portfolio: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 20 },
    },
  },

  // ─── Metadata ──────────────────────────
  computedAt: { type: Date, default: Date.now },

}, {
  timestamps: true,
});

// ─── Indexes ──────────────────────────────
// Leaderboard: rank by score
devScoreSchema.index({ overallScore: -1 });
// User score history
devScoreSchema.index({ userId: 1, createdAt: -1 });

const DevScore = mongoose.model('DevScore', devScoreSchema);

export default DevScore;
