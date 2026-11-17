import { getApiBaseUrl } from './urls';

describe('getApiBaseUrl', () => {
  const original = {
    apiBaseUrl: process.env.API_BASE_URL,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
  };

  afterEach(() => {
    if (original.apiBaseUrl === undefined) delete process.env.API_BASE_URL;
    else process.env.API_BASE_URL = original.apiBaseUrl;
    if (original.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = original.nodeEnv;
    if (original.port === undefined) delete process.env.PORT;
    else process.env.PORT = original.port;
  });

  it('uses the configured public origin', () => {
    process.env.API_BASE_URL = 'https://api.example.org/';
    process.env.NODE_ENV = 'test';
    expect(getApiBaseUrl()).toBe('https://api.example.org');
  });

  it('requires an explicit origin in production', () => {
    delete process.env.API_BASE_URL;
    process.env.NODE_ENV = 'production';
    expect(() => getApiBaseUrl()).toThrow('API_BASE_URL must be configured');
  });

  it('rejects URL paths that would generate broken static upload links', () => {
    process.env.API_BASE_URL = 'https://api.example.org/api';
    process.env.NODE_ENV = 'test';
    expect(() => getApiBaseUrl()).toThrow('without credentials, path');
  });
});
