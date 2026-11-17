import { ServiceUnavailableException } from '@nestjs/common';
import { dbPool } from '../../database/db.pool';
import { HealthService } from './health.service';

jest.mock('../../database/db.pool', () => ({
  dbPool: { query: jest.fn() },
}));

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService();
    jest.clearAllMocks();
  });

  it('reports readiness when PostgreSQL responds', async () => {
    jest
      .mocked(dbPool.query)
      .mockResolvedValue({ rows: [{ '?column?': 1 }] } as never);

    await expect(service.check()).resolves.toMatchObject({
      status: 'ok',
      database: 'connected',
    });
    expect(dbPool.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns service unavailable when PostgreSQL is unreachable', async () => {
    jest
      .mocked(dbPool.query)
      .mockRejectedValue(new Error('connection refused'));

    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
