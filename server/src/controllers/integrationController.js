import User from '../models/User.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const PLATFORM_FIELD_MAP = {
  github: 'githubUsername',
  leetcode: 'leetcodeUsername',
  codeforces: 'codeforcesUsername',
  hackerrank: 'hackerrankUsername',
  codechef: 'codechefUsername',
  kaggle: 'kaggleUsername',
  huggingface: 'huggingfaceUsername',
};

const PLATFORM_LABEL_MAP = {
  github: 'GitHub',
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  hackerrank: 'HackerRank',
  codechef: 'CodeChef',
  kaggle: 'Kaggle',
  huggingface: 'Hugging Face',
};

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

function toUserPlatformPayload(user) {
  return {
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
  };
}

// ─── Connect All Platforms ────────────────────────
export const connectDsa = asyncHandler(async (req, res) => {
  const updates = {};

  for (const [platform, field] of Object.entries(PLATFORM_FIELD_MAP)) {
    if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;
    const rawValue = req.body[field];
    if (rawValue === undefined) continue;
    updates[field] = extractUsername(rawValue, platform);
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
    data: toUserPlatformPayload(user),
  });
});

// ─── Soft Disconnect Platform ────────────────────
export const disconnectPlatform = asyncHandler(async (req, res) => {
  const platform = String(req.params.platform || '').trim().toLowerCase();
  const field = PLATFORM_FIELD_MAP[platform];

  if (!field) {
    throw new AppError('Unsupported platform for disconnect', 400);
  }

  const userWithSensitiveFields = await User.findById(req.user._id).select('+githubAccessToken');
  if (!userWithSensitiveFields) {
    throw new AppError('User not found', 404);
  }

  const previousHandle = userWithSensitiveFields[field] || null;
  if (!previousHandle && platform !== 'github') {
    throw new AppError(`${PLATFORM_LABEL_MAP[platform]} is not connected`, 400);
  }

  const updates = {
    [field]: null,
  };

  if (platform === 'github') {
    updates.githubAccessToken = null;
    updates.githubId = null;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    message: `${PLATFORM_LABEL_MAP[platform]} disconnected`,
    data: toUserPlatformPayload(user),
    meta: {
      platform,
      softDeleted: true,
      historicalDataRetained: true,
      disconnectedAt: new Date().toISOString(),
      previousHandle,
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
