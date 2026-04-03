import User from '../models/User.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { invalidateLeaderboardCache } from '../utils/cacheInvalidation.js';

// ─── Serialise user data for response ─────────────
function serializeUser(user) {
  return {
    _id: user._id,
    email: user.email,
    displayName: user.displayName,
    publicHandle: user.publicHandle || null,
    role: user.role,
    archetype: user.archetype,
    secondaryArchetype: user.secondaryArchetype,
    // Supported platform handles
    ...user.getPlatformData(),
  };
}

// ─── Get Current User ─────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const resolvedHandle = await User.ensurePublicHandle(user);
  user.publicHandle = user.publicHandle || resolvedHandle || null;

  res.json({
    success: true,
    data: serializeUser(user),
  });
});

// ─── Update Current User ──────────────────────────
export const updateMe = asyncHandler(async (req, res) => {
  const allowedFields = [
    'displayName',
    'archetype',
    'secondaryArchetype',
    // Supported platforms
    'githubUsername',
    'leetcodeUsername',
    'codeforcesUsername',
    'hackerrankUsername',
    'codechefUsername',
    'kaggleUsername',
    'huggingfaceUsername',
  ];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    returnDocument: 'after',
    runValidators: true,
  });

  const resolvedHandle = await User.ensurePublicHandle(user);
  user.publicHandle = user.publicHandle || resolvedHandle || null;

  await invalidateLeaderboardCache();

  res.json({
    success: true,
    data: serializeUser(user),
  });
});
