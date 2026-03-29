import dotenv from 'dotenv';
import { createHash } from 'crypto';
dotenv.config();

const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

const explicitEncryptionKey = process.env.ENCRYPTION_KEY || '';
const encryptionKeySource = explicitEncryptionKey || process.env.JWT_SECRET || '';
const resolvedEncryptionKey = explicitEncryptionKey
  ? (explicitEncryptionKey.length >= 32
    ? explicitEncryptionKey
    : createHash('sha256').update(explicitEncryptionKey).digest('hex'))
  : createHash('sha256').update(encryptionKeySource).digest('hex');

if (process.env.NODE_ENV === 'production' && !explicitEncryptionKey) {
  console.warn('⚠️ ENCRYPTION_KEY is not set in production. Using a derived key from JWT_SECRET. Set ENCRYPTION_KEY to a dedicated 32+ character value.');
}

if (process.env.NODE_ENV === 'production' && String(process.env.JWT_SECRET).length < 32) {
  console.warn('⚠️ JWT_SECRET is shorter than 32 characters. Rotate to a stronger secret for production security.');
}

if (process.env.NODE_ENV === 'production' && explicitEncryptionKey && String(explicitEncryptionKey).length < 32) {
  console.warn('⚠️ ENCRYPTION_KEY is shorter than 32 characters. Using a derived SHA-256 key for runtime compatibility. Rotate ENCRYPTION_KEY to a dedicated 32+ character value.');
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Encryption
  ENCRYPTION_KEY: resolvedEncryptionKey,

  // GitHub OAuth
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',

  // Client
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

export default env;
