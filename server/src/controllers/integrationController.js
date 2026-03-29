import User from '../models/User.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ─── Sanitize Handles ──────────────────────────────
function extractUsername(input, platform) {
  if (!input || typeof input !== 'string') return input;
  let cleaned = input.trim();
  cleaned = cleaned.replace(/\/+$/, '');

  const urlPatterns = {
    github: /^https?:\/\/(www\.)?github\.com\//i,
    leetcode: /^https?:\/\/(www\.)?leetcode\.com\/(u\/)?/i,
    codeforces: /^https?:\/\/(www\.)?codeforces\.com\/(profile\/)?/i,
    hackerrank: /^https?:\/\/(www\.)?hackerrank\.com\//i,
    codechef: /^https?:\/\/(www\.)?codechef\.com\/users\//i,
    kaggle: /^https?:\/\/(www\.)?kaggle\.com\//i,
    huggingface: /^https?:\/\/(www\.)?huggingface\.co\//i,
  };

  if (urlPatterns[platform]) {
    cleaned = cleaned.replace(urlPatterns[platform], '');
  }

  cleaned = cleaned.replace(/\//g, '');
  return cleaned || null;
}

// ─── Connect All Platforms ────────────────────────
export const connectDsa = asyncHandler(async (req, res) => {
  const {
    githubUsername, leetcodeUsername, codeforcesUsername,
    hackerrankUsername, codechefUsername, kaggleUsername,
    huggingfaceUsername,
  } = req.body;

  const fields = [
    ['githubUsername', githubUsername, 'github'],
    ['leetcodeUsername', leetcodeUsername, 'leetcode'],
    ['codeforcesUsername', codeforcesUsername, 'codeforces'],
    ['hackerrankUsername', hackerrankUsername, 'hackerrank'],
    ['codechefUsername', codechefUsername, 'codechef'],
    ['kaggleUsername', kaggleUsername, 'kaggle'],
    ['huggingfaceUsername', huggingfaceUsername, 'huggingface'],
  ];

  const updates = {};
  for (const [key, value, platform] of fields) {
    if (value !== undefined) updates[key] = extractUsername(value, platform);
  }

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
      hackerrankUsername: user.hackerrankUsername,
      codechefUsername: user.codechefUsername,
      kaggleUsername: user.kaggleUsername,
      huggingfaceUsername: user.huggingfaceUsername,
    },
  });
});

// ─── GitHub Connect Redirect ─────────────────────
export const connectGithub = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    throw new AppError('GitHub authorization code is required', 400);
  }
  throw new AppError('Use POST /api/auth/github/link instead', 301);
});
