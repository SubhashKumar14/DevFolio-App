import mongoose from 'mongoose';
import PortfolioCode from '../models/PortfolioCode.js';
import User from '../models/User.js';
import { sanitizeHtml } from '../utils/sanitizer.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ─── Get Portfolio by User ID ─────────────────────
export const getPortfolio = asyncHandler(async (req, res) => {
  const param = req.params.identifier;
  let userId;

  // Check if param is a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(param)) {
    userId = param;
  } else {
    // Otherwise, look up user by displayName (case-insensitive)
    const escaped = param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({ displayName: { $regex: new RegExp(`^${escaped}$`, 'i') } });
    if (!user) {
      return res.json({ success: true, data: null });
    }
    userId = user._id;
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
    { upsert: true, new: true, runValidators: true }
  );

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
    { new: true }
  );

  if (!portfolio) {
    throw new AppError('Portfolio not found. Save your portfolio first.', 404);
  }

  res.json({
    success: true,
    message: `Portfolio is now ${isPublic ? 'public' : 'private'}`,
    data: portfolio,
  });
});
