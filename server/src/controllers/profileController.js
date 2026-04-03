import mongoose from 'mongoose';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { isOwner } from '../utils/privacyAccess.js';
import { invalidateLeaderboardCache } from '../utils/cacheInvalidation.js';
import { normalizeOptionalHttpUrl } from '../utils/inputValidation.js';

// ─── Helper: resolve userId param (ObjectId or displayName) ──
async function resolveUserId(param) {
  if (mongoose.Types.ObjectId.isValid(param)) {
    return param;
  }

  const normalizedHandle = String(param || '').trim().toLowerCase();
  const isHandleLike = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(normalizedHandle);
  if (isHandleLike) {
    const byHandle = await User.findOne({ publicHandle: normalizedHandle }).select('_id');
    if (byHandle?._id) {
      return byHandle._id;
    }
  }

  const user = await User.findOne({
    displayName: { $regex: new RegExp(`^${param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  }).select('_id displayName email publicHandle');

  if (user?._id && !user.publicHandle) {
    await User.ensurePublicHandle(user);
  }

  return user?._id || null;
}

// ─── Get Profile by User ID or displayName ─────────
export const getProfile = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(req.params.userId);

  if (!userId) {
    throw new AppError('Profile not found', 404);
  }

  const profile = await Profile.findOne({ userId }).populate(
    'userId',
    [
      'displayName',
      'publicHandle',
      'email',
      'archetype',
      'secondaryArchetype',
      'githubUsername',
      'leetcodeUsername',
      'codeforcesUsername',
      'hackerrankUsername',
      'codechefUsername',
      'kaggleUsername',
      'huggingfaceUsername',
    ].join(' ')
  );

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  // If profile is private and requester is not the owner
  if (!profile.isPublic && !isOwner(req.user, profile.userId?._id || profile.userId)) {
    throw new AppError('This profile is private', 403);
  }

  res.json({ success: true, data: profile });
});

// ─── Update Own Profile ──────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['bio', 'techStack', 'college', 'isPublic'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (req.body.avatarUrl !== undefined) {
    const avatarUrl = normalizeOptionalHttpUrl(req.body.avatarUrl);
    if (avatarUrl === null) {
      throw new AppError('avatarUrl must be a valid http/https URL', 400);
    }
    updates.avatarUrl = avatarUrl || null;
  }

  if (req.body.socialLinks !== undefined) {
    if (!req.body.socialLinks || typeof req.body.socialLinks !== 'object' || Array.isArray(req.body.socialLinks)) {
      throw new AppError('socialLinks must be an object', 400);
    }

    const socialFields = ['linkedin', 'website', 'resumeUrl', 'twitter'];
    for (const field of socialFields) {
      if (req.body.socialLinks[field] === undefined) continue;
      const socialUrl = normalizeOptionalHttpUrl(req.body.socialLinks[field]);
      if (socialUrl === null) {
        throw new AppError(`socialLinks.${field} must be a valid http/https URL`, 400);
      }
      updates[`socialLinks.${field}`] = socialUrl;
    }
  }

  const profile = await Profile.findOneAndUpdate(
    { userId: req.user._id },
    updates,
    { returnDocument: 'after', runValidators: true, upsert: true }
  );

  await invalidateLeaderboardCache();

  res.json({ success: true, data: profile });
});
