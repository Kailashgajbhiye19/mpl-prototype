import { NotFoundException } from '@nestjs/common';
import { dbPool } from '../../database/db.pool';
import { TrainerService } from './trainer.service';

jest.mock('../../database/db.pool', () => ({ dbPool: { query: jest.fn() } }));

describe('TrainerService', () => {
  let service: TrainerService;

  beforeEach(() => {
    service = new TrainerService();
    jest.clearAllMocks();
  });

  it('searches and paginates trainers with bound values', async () => {
    jest
      .mocked(dbPool.query)
      .mockResolvedValue({ rows: [{ id: 7, name: 'Asha' }] } as never);

    await expect(
      service.getAllTrainers({ search: 'Ash', page: 2, limit: 20 }),
    ).resolves.toEqual([{ id: 7, name: 'Asha' }]);
    const [sql, params] = jest.mocked(dbPool.query).mock.calls[0];
    expect(sql).toContain('name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1');
    expect(params).toEqual(['%Ash%', 20, 20]);
  });

  it('returns a trainer by id and reports missing records', async () => {
    const trainer = { id: 3, name: 'Asha' };
    jest
      .mocked(dbPool.query)
      .mockResolvedValueOnce({ rows: [trainer] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    await expect(service.getTrainerById(3)).resolves.toEqual(trainer);
    await expect(service.getTrainerById(4)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates only provided fields and rejects unknown ids', async () => {
    const trainer = { id: 3, name: 'Asha Rao' };
    jest
      .mocked(dbPool.query)
      .mockResolvedValueOnce({ rows: [trainer] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    await expect(
      service.updateTrainer(3, { name: 'Asha Rao' }),
    ).resolves.toEqual(trainer);
    expect(jest.mocked(dbPool.query).mock.calls[0][0]).toContain(
      'UPDATE trainers SET name = $1 WHERE id = $2',
    );
    expect(jest.mocked(dbPool.query).mock.calls[0][1]).toEqual(['Asha Rao', 3]);
    await expect(
      service.updateTrainer(4, { name: 'Missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a trainer and reports unknown ids', async () => {
    jest
      .mocked(dbPool.query)
      .mockResolvedValueOnce({ rows: [{ id: 3 }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    await expect(service.deleteTrainer(3)).resolves.toBeUndefined();
    await expect(service.deleteTrainer(4)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
