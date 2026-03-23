import User from '../models/User.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ─── Get Current User ─────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      githubUsername: user.githubUsername,
      leetcodeUsername: user.leetcodeUsername,
      codeforcesUsername: user.codeforcesUsername,
    },
  });
});

// ─── Update Current User ──────────────────────────
export const updateMe = asyncHandler(async (req, res) => {
  const allowedFields = ['displayName', 'githubUsername', 'leetcodeUsername', 'codeforcesUsername'];
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
    data: {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      githubUsername: user.githubUsername,
      leetcodeUsername: user.leetcodeUsername,
      codeforcesUsername: user.codeforcesUsername,
    },
  });
});
