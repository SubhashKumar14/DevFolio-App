import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const userSchema = new Schema({
  // ─── Core Identity ─────────────────────
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
  },

  // ─── Role ───────────────────────────────
  role: {
    type: String,
    enum: ['developer', 'recruiter', 'mentor', 'admin'],
    default: 'developer',
  },

  // ─── GitHub OAuth ───────────────────────
  githubId: { type: String, default: null },
  githubUsername: { type: String, default: null },
  githubAccessToken: { type: String, select: false },

  // ─── DSA Platform Handles ───────────────
  leetcodeUsername: { type: String, default: null },
  codeforcesUsername: { type: String, default: null },
  hackerrankUsername: { type: String, default: null },
  codechefUsername: { type: String, default: null },
  kaggleUsername: { type: String, default: null },
  gfgUsername: { type: String, default: null },

  // ─── Auth ───────────────────────────────
  refreshToken: { type: String, select: false },

}, {
  timestamps: true,
});

// ─── Indexes ──────────────────────────────
// Note: email index is auto-created by unique: true in schema
userSchema.index({ githubId: 1 }, { sparse: true });
userSchema.index({ role: 1 });

// ─── Hooks ────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ─── Methods ──────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
