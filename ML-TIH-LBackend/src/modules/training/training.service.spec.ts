import { dbPool } from '../../database/db.pool';
import { TrainingService } from './training.service';

jest.mock('../../database/db.pool', () => ({
  dbPool: { query: jest.fn() },
}));

describe('TrainingService', () => {
  let service: TrainingService;

  beforeEach(() => {
    service = new TrainingService();
    jest.clearAllMocks();
  });

  it('filters and paginates the training directory with bound parameters', async () => {
    jest.mocked(dbPool.query).mockResolvedValue({ rows: [] } as never);

    await service.getAllTrainings({
      district_cd: 10,
      block_cd: 20,
      village: 'Raipur',
      subject: 'Literacy',
      start_date_to: '2026-10-31',
      page: 2,
      limit: 25,
    });

    const [sql, params] = jest.mocked(dbPool.query).mock.calls[0];
    expect(sql).toContain('l.district_cd = $1');
    expect(sql).toContain('l.block_cd = $2');
    expect(sql).toContain('l.village ILIKE $3');
    expect(sql).toContain('s.name ILIKE $4');
    expect(sql).toContain("t.start_date < ($5::date + INTERVAL '1 day')");
    expect(params).toEqual([
      10,
      20,
      '%Raipur%',
      '%Literacy%',
      '2026-10-31',
      25,
      25,
    ]);
  });
});
