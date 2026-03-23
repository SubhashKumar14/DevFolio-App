import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * General API rate limiter.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter rate limiter for auth endpoints.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 20,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for sync endpoints.
 */
export const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 20 : 5,
  message: { success: false, message: 'Too many sync requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

