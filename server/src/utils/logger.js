import env from '../config/env.js';

const LEVEL_RANK = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const DEFAULT_LEVEL = env.NODE_ENV === 'development' ? 'debug' : 'info';

function resolveLogLevel() {
  const configured = String(process.env.LOG_LEVEL || DEFAULT_LEVEL).toLowerCase();
  return LEVEL_RANK[configured] ? configured : DEFAULT_LEVEL;
}

const ACTIVE_LEVEL = resolveLogLevel();

function shouldLog(level) {
  return LEVEL_RANK[level] >= LEVEL_RANK[ACTIVE_LEVEL];
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { detail: payload };
  }
  return payload;
}

function serializeLog(entry) {
  return JSON.stringify(entry, (_key, value) => {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: env.NODE_ENV === 'development' ? value.stack : undefined,
      };
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    return value;
  });
}

function write(level, event, payload = {}) {
  if (!shouldLog(level)) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...normalizePayload(payload),
  };

  const line = serializeLog(entry);

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  debug: (event, payload) => write('debug', event, payload),
  info: (event, payload) => write('info', event, payload),
  warn: (event, payload) => write('warn', event, payload),
  error: (event, payload) => write('error', event, payload),
};
