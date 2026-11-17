import { dbPool } from '../database/db.pool';
import { bulkInsert } from './bulk-insert.util';

jest.mock('../database/db.pool', () => ({ dbPool: { query: jest.fn() } }));

describe('bulkInsert', () => {
  beforeEach(() => jest.clearAllMocks());

  it('binds every row value as a query parameter', async () => {
    await bulkInsert(
      'trainers',
      ['name', 'phone'],
      [
        ['Asha', '1111111111'],
        ['Ravi', null],
      ],
    );

    expect(dbPool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "trainers" ("name","phone")'),
      ['Asha', '1111111111', 'Ravi', null],
    );
  });

  it('rejects injected table or column identifiers before querying', async () => {
    await expect(
      bulkInsert('trainers; DROP TABLE admin_users', ['name'], [['Asha']]),
    ).rejects.toThrow('must be SQL identifiers');
    await expect(
      bulkInsert('trainers', ['name) VALUES (NULL);--'], [['Asha']]),
    ).rejects.toThrow('must be SQL identifiers');
    expect(dbPool.query).not.toHaveBeenCalled();
  });

  it('rejects rows that do not match the column count', async () => {
    await expect(
      bulkInsert('trainers', ['name', 'phone'], [['Asha']]),
    ).rejects.toThrow('must match the number of columns');
    expect(dbPool.query).not.toHaveBeenCalled();
  });
});
