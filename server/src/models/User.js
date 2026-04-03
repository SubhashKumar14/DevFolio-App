import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const PUBLIC_HANDLE_MIN_LENGTH = 3;
const PUBLIC_HANDLE_MAX_LENGTH = 40;

function normalizePublicHandleSeed(value) {
  const fallback = 'devfolio-user';
  const raw = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  const limited = raw.slice(0, PUBLIC_HANDLE_MAX_LENGTH).replace(/-+$/g, '');
  const normalized = limited || fallback;

  if (normalized.length >= PUBLIC_HANDLE_MIN_LENGTH) {
    return normalized;
  }

  return `${normalized}${'user'.slice(0, PUBLIC_HANDLE_MIN_LENGTH - normalized.length)}`;
}

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

  publicHandle: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    immutable: true,
    minlength: [PUBLIC_HANDLE_MIN_LENGTH, `Public handle must be at least ${PUBLIC_HANDLE_MIN_LENGTH} characters`],
    maxlength: [PUBLIC_HANDLE_MAX_LENGTH, `Public handle must be at most ${PUBLIC_HANDLE_MAX_LENGTH} characters`],
    match: [/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'Public handle can only contain lowercase letters, numbers, and single hyphens'],
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

  // ─── Platform Handles (7 platforms) ─────
  // Core coding platforms
  leetcodeUsername: { type: String, default: null },
  codeforcesUsername: { type: String, default: null },
  hackerrankUsername: { type: String, default: null },
  codechefUsername: { type: String, default: null },

  // AI / ML
  kaggleUsername: { type: String, default: null },
  huggingfaceUsername: { type: String, default: null },

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

// ─── Statics ──────────────────────────────
userSchema.statics.normalizePublicHandleSeed = normalizePublicHandleSeed;

userSchema.statics.generateUniquePublicHandle = async function (seed, { excludeUserId = null } = {}) {
  const base = normalizePublicHandleSeed(seed);
  const isConnected = this.db?.readyState === 1;

  if (!isConnected) {
    return base;
  }

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const suffix = attempt === 0 ? '' : `-${attempt + 1}`;
    const maxBaseLength = PUBLIC_HANDLE_MAX_LENGTH - suffix.length;
    const candidateBase = base.slice(0, Math.max(PUBLIC_HANDLE_MIN_LENGTH, maxBaseLength)).replace(/-+$/g, '');
    const candidate = `${candidateBase}${suffix}`;

    const existsFilter = { publicHandle: candidate };
    if (excludeUserId) {
      existsFilter._id = { $ne: excludeUserId };
    }

    // eslint-disable-next-line no-await-in-loop
    const exists = await this.exists(existsFilter);
    if (!exists) {
      return candidate;
    }
  }

  throw new Error('Unable to generate unique public handle');
};

userSchema.statics.ensurePublicHandle = async function (userOrId, { seed } = {}) {
  let userDoc = userOrId;

  if (!userDoc || typeof userDoc !== 'object' || !userDoc._id) {
    userDoc = await this.findById(userOrId).select('_id displayName email publicHandle');
  }

  if (!userDoc) {
    return null;
  }

  if (userDoc.publicHandle) {
    return userDoc.publicHandle;
  }

  const seedValue = seed || userDoc.displayName || userDoc.email || `devfolio-${String(userDoc._id).slice(-6)}`;
  const isConnected = this.db?.readyState === 1;

  if (!isConnected) {
    return userDoc.publicHandle || normalizePublicHandleSeed(seedValue);
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const generated = await this.generateUniquePublicHandle(seedValue, { excludeUserId: userDoc._id });
      // eslint-disable-next-line no-await-in-loop
      const updateResult = await this.collection.findOneAndUpdate(
        {
          _id: userDoc._id,
          $or: [
            { publicHandle: { $exists: false } },
            { publicHandle: null },
            { publicHandle: '' },
          ],
        },
        { $set: { publicHandle: generated } },
        { returnDocument: 'after' }
      );

      const updatedHandle = updateResult?.value?.publicHandle;
      if (updatedHandle) {
        return updatedHandle;
      }

      // eslint-disable-next-line no-await-in-loop
      const existing = await this.findById(userDoc._id).select('publicHandle');
      if (existing?.publicHandle) {
        return existing.publicHandle;
      }
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
    }
  }

  throw new Error('Unable to backfill public handle');
};

// ─── Hooks ────────────────────────────────
userSchema.pre('validate', async function () {
  if (this.publicHandle) {
    if (this.isNew || this.isModified('publicHandle')) {
      this.publicHandle = normalizePublicHandleSeed(this.publicHandle);
    }
    return;
  }

  if (!this.isNew) {
    return;
  }

  const seed = this.displayName || this.email || `devfolio-${String(this._id).slice(-6)}`;
  this.publicHandle = await this.constructor.generateUniquePublicHandle(seed, { excludeUserId: this._id });
});

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
    kaggleUsername: this.kaggleUsername,
    huggingfaceUsername: this.huggingfaceUsername,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
