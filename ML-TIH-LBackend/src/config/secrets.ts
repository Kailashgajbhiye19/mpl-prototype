const DEVELOPMENT_JWT_SECRET = 'local-development-only-change-this-secret';

function getRequiredSecret(name: 'JWT_SECRET', fallback: string) {
  const value = process.env[name]?.trim();
  if (value) {
    if (process.env.NODE_ENV === 'production' && value.length < 32) {
      throw new Error(
        `${name} must be at least 32 characters when NODE_ENV=production`,
      );
    }
    return value;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must be configured when NODE_ENV=production`);
  }

  return fallback;
}

export const getJwtSecret = () =>
  getRequiredSecret('JWT_SECRET', DEVELOPMENT_JWT_SECRET);
