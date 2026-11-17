import { getJwtSecret } from './secrets';

describe('JWT secret configuration', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwt = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalJwt === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwt;
  });

  it('uses a development-only fallback outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    expect(getJwtSecret()).toBe('local-development-only-change-this-secret');
  });

  it('requires a configured secret in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow('JWT_SECRET must be configured');
  });

  it('rejects short production secrets', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'short';
    expect(() => getJwtSecret()).toThrow('at least 32 characters');
  });
});
