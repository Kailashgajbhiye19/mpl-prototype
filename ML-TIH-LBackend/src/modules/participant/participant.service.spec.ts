import { NotFoundException } from '@nestjs/common';
import { dbPool } from '../../database/db.pool';
import { ParticipantService } from './participant.service';

jest.mock('../../database/db.pool', () => ({ dbPool: { query: jest.fn() } }));

describe('ParticipantService', () => {
  let service: ParticipantService;

  beforeEach(() => {
    service = new ParticipantService();
    jest.clearAllMocks();
  });

  it('looks up participant records by id', async () => {
    const participant = { id: 12, training_id: 6, name: 'Kiran' };
    jest
      .mocked(dbPool.query)
      .mockResolvedValue({ rows: [participant] } as never);

    await expect(service.getParticipantById(12)).resolves.toEqual(participant);
    expect(jest.mocked(dbPool.query).mock.calls[0][1]).toEqual([12]);
  });

  it('returns a clear not-found response for an unknown participant', async () => {
    jest.mocked(dbPool.query).mockResolvedValue({ rows: [] } as never);

    await expect(service.getParticipantById(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('uses a parameterized training filter and pagination', async () => {
    jest.mocked(dbPool.query).mockResolvedValue({ rows: [] } as never);

    await service.getAllParticipants({ training_id: 6, page: 2, limit: 15 });

    const [sql, params] = jest.mocked(dbPool.query).mock.calls[0];
    expect(sql).toContain('p.training_id = $1');
    expect(params).toEqual([6, 15, 15]);
  });
});
