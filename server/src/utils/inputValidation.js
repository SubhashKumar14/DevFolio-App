export function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeSearchTerm(value, { minLength = 2, maxLength = 64 } = {}) {
  const trimmed = String(value || '').trim();
  if (!trimmed || trimmed.length < minLength) return null;
  return escapeRegex(trimmed.slice(0, maxLength));
}

export function normalizeOptionalHttpUrl(value, { allowedHosts } = {}) {
  if (value === null || value === undefined) return '';

  const trimmed = String(value).trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;

    if (Array.isArray(allowedHosts) && allowedHosts.length > 0) {
      const host = parsed.hostname.toLowerCase();
      const allowed = allowedHosts.some((candidate) => {
        const expected = String(candidate || '').toLowerCase();
        return host === expected || host.endsWith(`.${expected}`);
      });
      if (!allowed) return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
