import Redis from 'ioredis';
import { randomUUID } from 'crypto';

let redis = null;
let redisDisabledLogged = false;
const NO_LOCK_BACKEND = '__NO_LOCK_BACKEND__';
const RELEASE_LOCK_SCRIPT = 'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end';

const redisUrl = process.env.REDIS_URL?.trim();
const isCloudHost = Boolean(process.env.RENDER || process.env.VERCEL);
const isProduction = process.env.NODE_ENV === 'production' || isCloudHost;
const isTest = process.env.NODE_ENV === 'test';

// On production hosts (e.g. Render), only enable Redis if REDIS_URL is provided.
const shouldEnableRedis = !isTest && (Boolean(redisUrl) || !isProduction);

if (!shouldEnableRedis) {
  console.log('ℹ️  Redis disabled (set REDIS_URL to enable caching)');
} else {
  try {
    redis = new Redis(redisUrl || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 1) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    if (redisDisabledLogged) return;
    redisDisabledLogged = true;
    console.warn('⚠️  Redis connection error (caching disabled):', err.message);

    // Stop reconnect attempts to avoid noisy logs.
    redis?.disconnect();
    redis = null;
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  // Background connect — don't block app startup
  redis.connect().catch((err) => {
    if (!redisDisabledLogged) {
      redisDisabledLogged = true;
      console.warn('⚠️  Redis unavailable — running without cache', err?.message ? `(${err.message})` : '');
    }

    redis?.disconnect();
    redis = null;
  });
  } catch {
    console.warn('⚠️  Redis not configured — running without cache');
    redis = null;
  }
}

/**
 * Get cached data or run fetcher and cache result.
 */
export async function cacheGet(key, fetcherFn, ttlSeconds = 600) {
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) return JSON.parse(cached);
    } catch { /* ignore */ }
  }

  const data = await fetcherFn();

  if (redis) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch { /* ignore */ }
  }

  return data;
}

export async function cacheInvalidate(pattern) {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch { /* ignore */ }
}

/**
 * Acquire a distributed lock. Returns:
 * - lock token string when acquired
 * - null when lock could not be acquired
 * - NO_LOCK_BACKEND when Redis is unavailable
 */
export async function acquireLock(key, ttlSeconds = 1800) {
  if (!redis) return NO_LOCK_BACKEND;

  const token = randomUUID();
  try {
    const result = await redis.set(key, token, 'EX', ttlSeconds, 'NX');
    return result === 'OK' ? token : null;
  } catch {
    return null;
  }
}

/**
 * Release a lock only if the token matches the current owner.
 */
export async function releaseLock(key, token) {
  if (!redis || !token || token === NO_LOCK_BACKEND) return;
  try {
    await redis.eval(RELEASE_LOCK_SCRIPT, 1, key, token);
  } catch {
    // Ignore release failures to avoid crashing background jobs.
  }
}

export { NO_LOCK_BACKEND };

export default redis;
