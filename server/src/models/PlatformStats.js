import mongoose from 'mongoose';

const { Schema } = mongoose;

const platformStatsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // ─── Existing New/Arbitrary Platforms ───────
  hackerrank: { type: Object, default: {} },
  codechef: { type: Object, default: {} },
  kaggle: { type: Object, default: {} },
  gfg: { type: Object, default: {} },

  // ─── Phase 4: 8 New Platforms ───────────────
  atcoder: { type: Object, default: {} },
  stackoverflow: { type: Object, default: {} },
  hackerearth: { type: Object, default: {} },
  huggingface: { type: Object, default: {} },
  tryhackme: { type: Object, default: {} },
  codesignal: { type: Object, default: {} },
  devto: { type: Object, default: {} },
  gitlab: { type: Object, default: {} },

  // ─── Sync Metadata ─────────────────────
  lastSyncedAt: { type: Date, default: null },

}, {
  timestamps: true,
  // We use mixed types (Object) for simplicity and flexibility in storing scraped platform payloads
});

const PlatformStats = mongoose.model('PlatformStats', platformStatsSchema);

export default PlatformStats;
