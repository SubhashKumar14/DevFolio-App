import mongoose from 'mongoose';

const { Schema } = mongoose;

const projectSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // ─── Project Info ──────────────────────
  name: { type: String, required: [true, 'Project name is required'], trim: true },
  description: { type: String, default: '' },
  repoLink: { type: String, default: '' },
  liveUrl: { type: String, default: '' },

  // ─── Tech Tags ─────────────────────────
  techStack: [{ type: String }],

  // ─── Auto-Fetched ──────────────────────
  githubStars: { type: Number, default: 0 },

  // ─── Engagement ────────────────────────
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },

}, {
  timestamps: true,
});

// ─── Indexes ──────────────────────────────
projectSchema.index({ userId: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
