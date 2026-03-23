import User from '../models/User.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ─── Sanitize Handles ──────────────────────────────
// Users may paste full URLs instead of just usernames. Strip the URL parts.
function extractUsername(input, platform) {
  if (!input || typeof input !== 'string') return input;
  let cleaned = input.trim();

  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');

  if (platform === 'github') {
    // https://github.com/SubhashKumar14 → SubhashKumar14
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
  } else if (platform === 'leetcode') {
    // https://leetcode.com/u/Subhash_Kumar14/ → Subhash_Kumar14
    // https://leetcode.com/Subhash_Kumar14/ → Subhash_Kumar14
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?leetcode\.com\/(u\/)?/i, '');
  } else if (platform === 'codeforces') {
    // https://codeforces.com/profile/handle → handle
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?codeforces\.com\/(profile\/)?/i, '');
  }

  // Remove any remaining slashes
  cleaned = cleaned.replace(/\//g, '');

  return cleaned || null;
}

// ─── Connect Platforms (GitHub, LeetCode, Codeforces) ─
export const connectDsa = asyncHandler(async (req, res) => {
  const { githubUsername, leetcodeUsername, codeforcesUsername } = req.body;

  const updates = {};
  if (githubUsername !== undefined) updates.githubUsername = extractUsername(githubUsername, 'github');
  if (leetcodeUsername !== undefined) updates.leetcodeUsername = extractUsername(leetcodeUsername, 'leetcode');
  if (codeforcesUsername !== undefined) updates.codeforcesUsername = extractUsername(codeforcesUsername, 'codeforces');

  if (Object.keys(updates).length === 0) {
    throw new AppError('At least one platform username is required', 400);
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    message: 'Platforms connected',
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

// ─── GitHub Connect Redirect ─────────────────────
// Reuses the same OAuth flow from auth
export const connectGithub = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    throw new AppError('GitHub authorization code is required', 400);
  }

  // Forward to linkGithub logic (imported at route level for cleanliness)
  // This is handled via authController.linkGithub for code reuse
  throw new AppError('Use POST /api/auth/github/link instead', 301);
});
