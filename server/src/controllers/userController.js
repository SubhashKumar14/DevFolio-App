import User from '../models/User.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ─── Serialise user data for response ─────────────
function serializeUser(user) {
  return {
    _id: user._id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    archetype: user.archetype,
    secondaryArchetype: user.secondaryArchetype,
    // All 15 platform handles
    ...user.getPlatformData(),
  };
}

// ─── Get Current User ─────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

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
    // All 15 platforms
    'githubUsername',
    'leetcodeUsername',
    'codeforcesUsername',
    'hackerrankUsername',
    'codechefUsername',
    'gfgUsername',
    'kaggleUsername',
    'atcoderUsername',
    'hackerEarthUsername',
    'huggingfaceUsername',
    'stackoverflowUserId',
    'devtoUsername',
    'gitlabUsername',
    'tryhackmeUsername',
    'codesignalUsername',
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
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    data: serializeUser(user),
  });
});
