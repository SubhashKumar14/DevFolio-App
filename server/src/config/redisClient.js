import Redis from 'ioredis';

let redis = null;
let redisDisabledLogged = false;

const redisUrl = process.env.REDIS_URL?.trim();
const isCloudHost = Boolean(process.env.RENDER || process.env.VERCEL);
const isProduction = process.env.NODE_ENV === 'production' || isCloudHost;

// On production hosts (e.g. Render), only enable Redis if REDIS_URL is provided.
const shouldEnableRedis = Boolean(redisUrl) || !isProduction;

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

export default redis;
