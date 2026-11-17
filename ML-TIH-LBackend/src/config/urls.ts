export function getApiBaseUrl(): string {
  const configured = process.env.API_BASE_URL?.trim();
  if (!configured && process.env.NODE_ENV === 'production') {
    throw new Error('API_BASE_URL must be configured when NODE_ENV=production');
  }

  const value = configured || `http://localhost:${process.env.PORT || 6062}`;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('API_BASE_URL must be an absolute HTTP or HTTPS URL');
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error(
      'API_BASE_URL must be an HTTP or HTTPS origin without credentials, path, query, or fragment',
    );
  }

  return url.origin;
}
