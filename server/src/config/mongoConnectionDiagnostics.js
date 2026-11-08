const SRV_DNS_ERROR = /\bquery(?:Srv|Txt)\s+(?:ENOTFOUND|ENODATA|ESERVFAIL|ETIMEOUT|ECONNREFUSED)\b/i;
const DNS_CODES = new Set(['ENOTFOUND', 'ENODATA', 'ESERVFAIL', 'ETIMEOUT', 'ECONNREFUSED']);
const MONGO_URI = /mongodb(?:\+srv)?:\/\/[^\s"'\`<>]+/gi;

/**
 * Return an actionable, credential-safe startup error for Render and local runs.
 * A DNS failure must not be mistaken for an authentication or firewall error.
 */
export function describeMongoConnectionError(error, uri = '') {
  const code = error?.code || error?.cause?.code;
  const message = String(error?.message || 'Unknown connection error');
  const isSrvUri = uri.startsWith('mongodb+srv://');

  if (SRV_DNS_ERROR.test(message) || (isSrvUri && DNS_CODES.has(code))) {
    return 'MongoDB Atlas DNS SRV lookup failed. Verify that the cluster is active and that ' +
      'Render MONGODB_URI uses the current host copied from Atlas > Connect > Drivers. ' +
      'If the host is correct but SRV lookup fails, use the standard (non-SRV) connection ' +
      'string provided by Atlas. Do not commit database credentials.';
  }

  return `MongoDB connection failed: ${message.replace(MONGO_URI, '[redacted MongoDB URI]')}`;
}
