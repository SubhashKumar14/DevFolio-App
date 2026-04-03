import { logger } from '../utils/logger.js';

/**
 * Custom application error class.
 * Set isOperational = true to distinguish from programming errors.
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper — catches async errors and forwards to error middleware.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Centralized error handling middleware (must be last app.use()).
 */
export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  const requestId = req.requestId || res.locals?.requestId || null;

  const errorLogPayload = {
    requestId,
    method: req.method,
    path: req.originalUrl || req.url,
    statusCode,
    errorName: err.name,
    message: err.message,
  };

  // Log non-operational errors for debugging
  if (!err.isOperational) {
    logger.error('http.error.unexpected', {
      ...errorLogPayload,
      error: err,
    });
  } else {
    logger.warn('http.error.operational', errorLogPayload);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(', '), requestId });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `${field} already exists`, requestId });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token', requestId });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired', requestId });
  }

  res.status(statusCode).json({ success: false, message, requestId });
};
