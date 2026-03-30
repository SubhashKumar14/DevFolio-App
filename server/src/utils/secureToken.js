import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import env from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const TOKEN_PREFIX = 'enc:v1';

function getEncryptionKeyBuffer() {
  const raw = String(env.ENCRYPTION_KEY || '').trim();
  if (/^[a-f0-9]{64}$/i.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  return createHash('sha256').update(raw).digest();
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(`${TOKEN_PREFIX}:`);
}

export function encryptTokenAtRest(value) {
  if (!value) return null;
  if (isEncrypted(value)) return value;

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKeyBuffer(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${TOKEN_PREFIX}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptTokenAtRest(value) {
  if (!value) return null;
  if (!isEncrypted(value)) return String(value);

  try {
    const [, , ivHex, authTagHex, encryptedHex] = String(value).split(':');
    if (!ivHex || !authTagHex || !encryptedHex) return null;

    const decipher = createDecipheriv(
      ALGORITHM,
      getEncryptionKeyBuffer(),
      Buffer.from(ivHex, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, 'hex')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}
