import { dbPool } from '../database/db.pool';

type BulkInsertValue = string | number | boolean | Date | Buffer | null;

export async function bulkInsert(
  table: string,
  columns: string[],
  rows: BulkInsertValue[][],
) {
  if (!rows.length) return;

  const identifiers = [table, ...columns];
  if (
    !identifiers.every((identifier) => /^[a-z_][a-z0-9_]*$/i.test(identifier))
  ) {
    throw new Error(
      'Bulk insert table and column names must be SQL identifiers',
    );
  }
  if (!columns.length || rows.some((row) => row.length !== columns.length)) {
    throw new Error('Each bulk insert row must match the number of columns');
  }

  const values: BulkInsertValue[] = [];

  const placeholders = rows.map((row, i) => {
    const base = i * columns.length;

    const params = row.map((_, j) => `$${base + j + 1}`);
    values.push(...row);

    return `(${params.join(',')})`;
  });

  const query = `
    INSERT INTO "${table}" (${columns.map((column) => `"${column}"`).join(',')})
    VALUES ${placeholders.join(',')}
  `;

  await dbPool.query(query, values);
}
