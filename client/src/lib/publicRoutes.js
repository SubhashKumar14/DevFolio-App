function pickNonEmptyString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function getPublicIdentifier(entity) {
  if (!entity || typeof entity !== 'object') return null;

  return (
    pickNonEmptyString(entity.publicHandle)
    || pickNonEmptyString(entity.displayName)
    || null
  );
}

export function getPublicProfilePath(entity) {
  const identifier = getPublicIdentifier(entity);
  if (!identifier) return null;
  return `/p/${encodeURIComponent(identifier)}`;
}

export function getPublicPortfolioPath(entity) {
  const identifier = getPublicIdentifier(entity);
  if (!identifier) return null;
  return `/portfolio/${encodeURIComponent(identifier)}`;
}

export function getPublicPortfolioPreviewPath(entity) {
  const identifier = getPublicIdentifier(entity);
  if (!identifier) return null;
  return `/portfolio/preview/${encodeURIComponent(identifier)}`;
}
