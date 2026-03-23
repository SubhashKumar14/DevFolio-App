import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';
import { AppError } from './errorHandler.js';

/**
 * JWT verification middleware.
 * Extracts token from Authorization header, verifies it,
 * attaches user to req.user.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('User not found. Token is invalid.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    // JWT errors (JsonWebTokenError, TokenExpiredError) are handled by errorHandler
    next(error);
  }
};

/**
 * Optional authentication — attaches user if token present, but doesn't block.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) req.user = user;
    }

    next();
  } catch {
    // Silently continue without user
    next();
  }
};
