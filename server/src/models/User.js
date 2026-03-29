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

  // ─── Developer Identity (Archetype) ─────
  archetype: {
    type: String,
    enum: ['builder', 'problem_solver', 'ai_engineer', 'security_expert', 'open_source', 'competitor', null],
    default: null,
  },

  secondaryArchetype: {
    type: String,
    enum: ['builder', 'problem_solver', 'ai_engineer', 'security_expert', 'open_source', 'competitor', null],
    default: null,
  },

  // ─── GitHub OAuth ───────────────────────
  githubId: { type: String, default: null },
  githubUsername: { type: String, default: null },
  githubAccessToken: { type: String, select: false },

  // ─── Platform Handles (15 platforms) ────
  // DSA / Competitive Programming
  leetcodeUsername: { type: String, default: null },
  codeforcesUsername: { type: String, default: null },
  hackerrankUsername: { type: String, default: null },
  codechefUsername: { type: String, default: null },
  gfgUsername: { type: String, default: null },
  atcoderUsername: { type: String, default: null },
  hackerEarthUsername: { type: String, default: null },

  // AI / ML
  kaggleUsername: { type: String, default: null },
  huggingfaceUsername: { type: String, default: null },

  // Community / Knowledge
  stackoverflowUserId: { type: String, default: null },
  devtoUsername: { type: String, default: null },

  // Open Source
  gitlabUsername: { type: String, default: null },

  // Security
  tryhackmeUsername: { type: String, default: null },

  // Interview / Assessment
  codesignalUsername: { type: String, default: null },

  // ─── Auth ───────────────────────────────
  refreshToken: { type: String, select: false },

}, {
  timestamps: true,
});

// ─── Indexes ──────────────────────────────
userSchema.index({ githubId: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ archetype: 1 });
userSchema.index({ secondaryArchetype: 1 });

// ─── Hooks ────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ─── Methods ──────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ─── Helper: Get all platform fields for a user ───
userSchema.methods.getPlatformData = function () {
  return {
    githubUsername: this.githubUsername,
    leetcodeUsername: this.leetcodeUsername,
    codeforcesUsername: this.codeforcesUsername,
    hackerrankUsername: this.hackerrankUsername,
    codechefUsername: this.codechefUsername,
    gfgUsername: this.gfgUsername,
    kaggleUsername: this.kaggleUsername,
    atcoderUsername: this.atcoderUsername,
    hackerEarthUsername: this.hackerEarthUsername,
    huggingfaceUsername: this.huggingfaceUsername,
    stackoverflowUserId: this.stackoverflowUserId,
    devtoUsername: this.devtoUsername,
    gitlabUsername: this.gitlabUsername,
    tryhackmeUsername: this.tryhackmeUsername,
    codesignalUsername: this.codesignalUsername,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
