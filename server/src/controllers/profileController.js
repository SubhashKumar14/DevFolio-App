import Profile from '../models/Profile.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ─── Get Profile by User ID ──────────────────────
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.params.userId }).populate('userId', 'displayName email githubUsername');

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
