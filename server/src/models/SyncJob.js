import mongoose from 'mongoose';

const { Schema } = mongoose;

const syncJobSchema = new Schema({
  type: {
    type: String,
    enum: ['user-sync', 'global-sync'],
    required: true,
  },
  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'failed'],
    default: 'queued',
    index: true,
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  targetUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  totalTargets: {
    type: Number,
    default: 0,
    min: 0,
  },
  processedTargets: {
    type: Number,
    default: 0,
    min: 0,
  },
  successCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  errorCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  message: {
    type: String,
    default: '',
  },
  errorMessage: {
    type: String,
    default: '',
  },
  meta: {
    type: Schema.Types.Mixed,
    default: {},
  },
  startedAt: {
    type: Date,
    default: null,
  },
  finishedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

syncJobSchema.index({ status: 1, createdAt: 1 });
syncJobSchema.index({ type: 1, createdAt: -1 });
syncJobSchema.index({ requestedBy: 1, createdAt: -1 });

const SyncJob = mongoose.model('SyncJob', syncJobSchema);

export default SyncJob;
