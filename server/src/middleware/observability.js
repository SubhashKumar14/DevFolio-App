import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

const REQUEST_ID_HEADER = 'x-request-id';

function sanitizeRequestId(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return null;

  const safe = normalized
    .replace(/[^a-zA-Z0-9._:-]/g, '')
    .slice(0, 120);

  return safe || null;
}

function resolveRequestId(req) {
  const rawHeader = Array.isArray(req.headers[REQUEST_ID_HEADER])
    ? req.headers[REQUEST_ID_HEADER][0]
    : req.headers[REQUEST_ID_HEADER];

  return sanitizeRequestId(rawHeader) || randomUUID();
}

function extractIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export function attachRequestContext(req, res, next) {
  const requestId = resolveRequestId(req);
  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}

export function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    logger.info('http.request', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: extractIp(req),
      userId: req.user?._id?.toString?.() || null,
      userAgent: String(req.headers['user-agent'] || '').slice(0, 256),
    });
  });

  next();
}
