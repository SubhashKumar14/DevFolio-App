import mongoose from 'mongoose';
import PortfolioCode from '../models/PortfolioCode.js';
import User from '../models/User.js';
import { sanitizeHtml } from '../utils/sanitizer.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { invalidateLeaderboardCache } from '../utils/cacheInvalidation.js';

async function resolvePortfolioUserId(identifier) {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return identifier;
  }

  const normalizedHandle = String(identifier || '').trim().toLowerCase();
  const isHandleLike = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(normalizedHandle);
  if (isHandleLike) {
    const byHandle = await User.findOne({ publicHandle: normalizedHandle }).select('_id');
    if (byHandle?._id) {
      return byHandle._id;
    }
  }

  // Backward-compatibility fallback for legacy displayName links.
  const escaped = String(identifier || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const legacyUser = await User.findOne({ displayName: { $regex: new RegExp(`^${escaped}$`, 'i') } }).select('_id publicHandle displayName email');
  if (!legacyUser) {
    return null;
  }

  if (!legacyUser.publicHandle) {
    await User.ensurePublicHandle(legacyUser);
  }

  return legacyUser._id;
}

// ─── Get Portfolio by User ID/Public Handle ─────────────────────
export const getPortfolio = asyncHandler(async (req, res) => {
  const param = req.params.identifier;
  const userId = await resolvePortfolioUserId(param);

  if (!userId) {
    return res.json({ success: true, data: null });
  }

  const portfolio = await PortfolioCode.findOne({ userId });

  if (!portfolio) {
    return res.json({ success: true, data: null });
  }

  // Private portfolio check (allow owner to always access)
  if (!portfolio.isPublic && (!req.user || req.user._id.toString() !== portfolio.userId.toString())) {
    throw new AppError('This portfolio is private', 403);
  }

  res.json({ success: true, data: portfolio });
});

// ─── Save / Update Portfolio ──────────────────────
export const savePortfolio = asyncHandler(async (req, res) => {
  const { rawHtml, cssContent, jsContent } = req.body;

  // Sanitize HTML for public preview
  const htmlContent = sanitizeHtml(rawHtml || '');

  const portfolio = await PortfolioCode.findOneAndUpdate(
    { userId: req.user._id },
    {
      userId: req.user._id,
      rawHtml: rawHtml || '',
      htmlContent,
      cssContent: cssContent || '',
      jsContent: jsContent || '',
    },
    { upsert: true, returnDocument: 'after', runValidators: true }
  );

  await invalidateLeaderboardCache();

  res.json({
    success: true,
    message: 'Portfolio saved',
    data: portfolio,
  });
});

// ─── Toggle Portfolio Visibility ──────────────────
export const toggleVisibility = asyncHandler(async (req, res) => {
  const { isPublic } = req.body;

  if (typeof isPublic !== 'boolean') {
    throw new AppError('isPublic must be a boolean', 400);
  }

  const portfolio = await PortfolioCode.findOneAndUpdate(
    { userId: req.user._id },
    { isPublic },
    { returnDocument: 'after' }
  );

  if (!portfolio) {
    throw new AppError('Portfolio not found. Save your portfolio first.', 404);
  }

  await invalidateLeaderboardCache();

  res.json({
    success: true,
    message: `Portfolio is now ${isPublic ? 'public' : 'private'}`,
    data: portfolio,
  });
});
