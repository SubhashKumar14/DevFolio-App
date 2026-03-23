import PortfolioCode from '../models/PortfolioCode.js';
import { sanitizeHtml } from '../utils/sanitizer.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ─── Get Portfolio by User ID ─────────────────────
export const getPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await PortfolioCode.findOne({ userId: req.params.userId });

  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  // Private portfolio check
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
  });
});
