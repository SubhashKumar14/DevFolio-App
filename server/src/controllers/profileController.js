import mongoose from 'mongoose';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ─── Helper: resolve userId param (ObjectId or displayName) ──
async function resolveUserId(param) {
  if (mongoose.Types.ObjectId.isValid(param)) {
    return param;
  }
  const user = await User.findOne({
    displayName: { $regex: new RegExp(`^${param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  });
  return user?._id || null;
}

// ─── Get Profile by User ID or displayName ─────────
export const getProfile = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(req.params.userId);

  if (!userId) {
    throw new AppError('Profile not found', 404);
  }

  const profile = await Profile.findOne({ userId }).populate('userId', 'displayName email githubUsername leetcodeUsername codeforcesUsername hackerrankUsername codechefUsername kaggleUsername gfgUsername');

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  // If profile is private and requester is not the owner
  if (!profile.isPublic && (!req.user || req.user._id.toString() !== profile.userId._id.toString())) {
    throw new AppError('This profile is private', 403);
  }

  res.json({ success: true, data: profile });
});

// ─── Update Own Profile ──────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['bio', 'avatarUrl', 'techStack', 'socialLinks', 'college', 'isPublic'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const profile = await Profile.findOneAndUpdate(
    { userId: req.user._id },
    updates,
    { new: true, runValidators: true, upsert: true }
  );

  res.json({ success: true, data: profile });
});
