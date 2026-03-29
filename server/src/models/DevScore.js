import mongoose from 'mongoose';

const { Schema } = mongoose;

const devScoreSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // ─── DevScore v2 (0–1000) ─────────────
  score: { type: Number, required: true, min: 0, max: 1000 },
  rawScore: { type: Number, default: 0, min: 0, max: 100 },
  weightedRawScore: { type: Number, default: 0, min: 0, max: 100 },

  // ─── Archetype used for computation ────
  archetype: { type: String, default: 'none' },
  secondaryArchetype: { type: String, default: 'none' },

  // ─── 5-Pillar Breakdown ────────────────
  breakdown: {
    problemSolving: {
      score: { type: Number, default: 0 },
      max: { type: Number, default: 200 },
      percentile: { type: Number, default: 0 },
      grade: { type: String, default: 'N/A' },
    },
    building: {
      score: { type: Number, default: 0 },
      max: { type: Number, default: 200 },
      percentile: { type: Number, default: 0 },
      grade: { type: String, default: 'N/A' },
    },
    community: {
      score: { type: Number, default: 0 },
      max: { type: Number, default: 200 },
      percentile: { type: Number, default: 0 },
      grade: { type: String, default: 'N/A' },
    },
    consistency: {
      score: { type: Number, default: 0 },
      max: { type: Number, default: 200 },
      percentile: { type: Number, default: 0 },
      grade: { type: String, default: 'N/A' },
    },
    specialization: {
      score: { type: Number, default: 0 },
      max: { type: Number, default: 200 },
      percentile: { type: Number, default: 0 },
      grade: { type: String, default: 'N/A' },
    },
  },

  // ─── Metadata ──────────────────────────
  domain: { type: String, default: 'all_rounder' },
  domainLabel: { type: String, default: 'All Rounder' },
  connectedPlatforms: { type: Number, default: 0 },
  platformScores: { type: Schema.Types.Mixed, default: {} },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  diagnostics: { type: Schema.Types.Mixed, default: {} },
  computedAt: { type: Date, default: Date.now },

}, {
  timestamps: true,
});

// ─── Indexes ──────────────────────────────
devScoreSchema.index({ score: -1 });
devScoreSchema.index({ userId: 1, createdAt: -1 });

const DevScore = mongoose.model('DevScore', devScoreSchema);

export default DevScore;
