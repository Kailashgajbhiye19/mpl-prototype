import { dbPool } from '../../database/db.pool';
import { DashboardService } from './dashboard.service';

jest.mock('../../database/db.pool', () => ({
  dbPool: { query: jest.fn() },
}));

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    service = new DashboardService();
    jest.clearAllMocks();
  });

  it('applies participant-only filters only to participant totals', async () => {
    jest
      .mocked(dbPool.query)
      .mockResolvedValue({ rows: [{ count: '3' }] } as never);

    const summary = await service.getDashboardSummary({ caste: 'OBC' });

    expect(summary.total_trainings).toBe(3);
    const calls = jest.mocked(dbPool.query).mock.calls;
    expect(calls).toHaveLength(8);
    expect(calls[4][0]).toContain('p.caste = $1');
    expect(calls[4][1]).toEqual(['OBC']);
    expect(
      calls.filter(([, params]) => JSON.stringify(params).includes('"OBC"')),
    ).toHaveLength(1);
  });

  it('returns participant category and normalized attendance counts', async () => {
    jest
      .mocked(dbPool.query)
      .mockResolvedValueOnce({
        rows: [{ category: 'Women', count: '2' }],
      } as never)
      .mockResolvedValueOnce({ rows: [{ caste: 'OBC', count: '1' }] } as never)
      .mockResolvedValueOnce({
        rows: [{ education: 'Graduate', count: '2' }],
      } as never)
      .mockResolvedValueOnce({
        rows: [
          { attendance_status: 'Present', count: '2' },
          { attendance_status: 'absent', count: '1' },
        ],
      } as never);

    await expect(service.getParticipantStats()).resolves.toEqual({
      by_category: [{ category: 'Women', count: 2 }],
      by_caste: [{ caste: 'OBC', count: 1 }],
      by_education: [{ education: 'Graduate', count: 2 }],
      attendance_stats: { present: 2, absent: 1, late: 0 },
    });
  });
});
