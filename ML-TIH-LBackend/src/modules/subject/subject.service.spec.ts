import { BadRequestException } from '@nestjs/common';
import { dbPool } from '../../database/db.pool';
import { SubjectService } from './subject.service';

jest.mock('../../database/db.pool', () => ({ dbPool: { query: jest.fn() } }));

describe('SubjectService', () => {
  let service: SubjectService;

  beforeEach(() => {
    service = new SubjectService();
    jest.clearAllMocks();
  });

  it('creates a subject after checking for duplicate names', async () => {
    const subject = { id: 5, name: 'Digital Literacy' };
    jest
      .mocked(dbPool.query)
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rows: [subject] } as never);

    await expect(
      service.createSubject({ name: subject.name }),
    ).resolves.toEqual(subject);
    expect(jest.mocked(dbPool.query).mock.calls[1][1]).toEqual([
      subject.name,
      undefined,
    ]);
  });

  it('rejects duplicate subject names', async () => {
    jest
      .mocked(dbPool.query)
      .mockResolvedValueOnce({ rows: [{ id: 1 }] } as never);

    await expect(service.createSubject({ name: 'Existing' })).rejects.toThrow(
      'Subject with this name already exists',
    );
  });

  it('uses bound search and paging parameters', async () => {
    jest.mocked(dbPool.query).mockResolvedValue({ rows: [] } as never);

    await service.getAllSubjects({ search: 'market', page: 3, limit: 10 });

    const [sql, params] = jest.mocked(dbPool.query).mock.calls[0];
    expect(sql).toContain('name ILIKE $1 OR description ILIKE $1');
    expect(params).toEqual(['%market%', 10, 20]);
  });

  it('blocks deletion when a subject has trainings', async () => {
    jest
      .mocked(dbPool.query)
      .mockResolvedValueOnce({ rows: [{ id: 8 }] } as never);

    await expect(service.deleteSubject(3)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(jest.mocked(dbPool.query)).toHaveBeenCalledTimes(1);
  });
});
