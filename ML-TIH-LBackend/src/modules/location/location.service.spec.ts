import { BadRequestException, NotFoundException } from '@nestjs/common';
import { dbPool } from '../../database/db.pool';
import { LocationService } from './location.service';

jest.mock('../../database/db.pool', () => ({ dbPool: { query: jest.fn() } }));

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(() => {
    service = new LocationService();
    jest.clearAllMocks();
  });

  it('builds parameterized location filters and pagination', async () => {
    jest.mocked(dbPool.query).mockResolvedValue({ rows: [] } as never);

    await service.getAllLocations({
      district: 'Raipur',
      block_cd: 21,
      page: 2,
      limit: 25,
    });

    const [sql, params] = jest.mocked(dbPool.query).mock.calls[0];
    expect(sql).toContain('district ILIKE $1');
    expect(sql).toContain('block_cd = $2');
    expect(params).toEqual(['%Raipur%', 21, 25, 25]);
  });

  it('preserves duplicate-location errors', async () => {
    jest
      .mocked(dbPool.query)
      .mockResolvedValueOnce({ rows: [{ id: 3 }] } as never);

    await expect(
      service.createLocation({
        village: 'X',
        block: 'Y',
        district: 'Z',
      }),
    ).rejects.toThrow(
      'Location with same village/block/district already exists',
    );
  });

  it('reports missing locations on lookup', async () => {
    jest.mocked(dbPool.query).mockResolvedValue({ rows: [] } as never);

    await expect(service.getLocationById(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('refuses to delete a location still used by a training', async () => {
    jest
      .mocked(dbPool.query)
      .mockResolvedValueOnce({ rows: [{ id: 9 }] } as never);

    await expect(service.deleteLocation(4)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(jest.mocked(dbPool.query)).toHaveBeenCalledTimes(1);
  });
});
