import mongoose from 'mongoose';

const { Schema } = mongoose;

const profileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // ─── Profile Info ──────────────────────
  bio: { type: String, maxlength: 500, default: '' },
  avatarUrl: { type: String, default: null },

  // ─── Tech Stack ────────────────────────
  techStack: [{
    type: String,
    trim: true,
  }],

  // ─── Social Links ──────────────────────
  socialLinks: {
    linkedin: { type: String, default: '' },
    website: { type: String, default: '' },
  },

  // ─── College (for leaderboard filtering)
  college: { type: String, default: '' },

  // ─── Visibility ────────────────────────
  isPublic: { type: Boolean, default: true },

}, {
  timestamps: true,
});

// ─── Indexes ──────────────────────────────
// userId index auto-created by unique: true
profileSchema.index({ college: 1 });
profileSchema.index({ isPublic: 1 });

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
