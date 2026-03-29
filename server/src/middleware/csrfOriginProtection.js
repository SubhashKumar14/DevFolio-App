import env from '../config/env.js';
import { AppError } from './errorHandler.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getAllowedOrigins() {
  return String(env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function csrfOriginProtection(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const origin = req.get('origin');
  const allowedOrigins = getAllowedOrigins();

  // Non-browser tools (curl/Postman/server-to-server) often omit Origin.
  // Keep DX flexible in development but enforce origin in production.
  if (!origin) {
    if (env.NODE_ENV === 'production') {
      return next(new AppError('Origin header required for this request', 403));
    }
    return next();
  }

  if (!allowedOrigins.includes(origin)) {
    return next(new AppError('Invalid request origin', 403));
  }

  return next();
}
