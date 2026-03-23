import { AppError } from './errorHandler.js';

/**
 * Role-based access control middleware.
 * Usage: roleGuard('admin') or roleGuard('admin', 'recruiter')
 */
export const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Access denied. Insufficient permissions.', 403));
    }

    next();
  };
};
