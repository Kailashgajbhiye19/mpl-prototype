const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'marketplace_literacy',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  const client = await pool.connect();
  const migrationsDirectory = path.resolve(process.cwd(), 'migrations');
  const applicationTables = [
    'admin_users', 'locations', 'mst_cluster', 'participants', 'subjects',
    'trainers', 'training_attendance', 'training_center_photos',
    'training_participant_photos', 'trainings',
  ];

  try {
    await client.query("SELECT pg_advisory_lock(hashtext('marketplace-literacy:migrations'))");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    const files = fs.readdirSync(migrationsDirectory)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const alreadyApplied = await client.query(
        'SELECT 1 FROM public.schema_migrations WHERE name = $1',
        [file],
      );
      if (alreadyApplied.rowCount) {
        console.log(`Skipped ${file}; already applied.`);
        continue;
      }

      if (file === '000_initial_schema.sql') {
        const existingTables = await client.query(
          `SELECT tablename FROM pg_tables
           WHERE schemaname = 'public' AND tablename = ANY($1::text[])`,
          [applicationTables],
        );

        if (existingTables.rowCount === applicationTables.length) {
          await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
          console.log(`Marked ${file} as baseline; the application tables already exist.`);
          continue;
        }
        if (existingTables.rowCount > 0) {
          throw new Error('The database has a partial application schema; restore a complete schema before migrating.');
        }
      }

      await client.query('BEGIN');
      try {
        await client.query('SET search_path TO public');
        await client.query(fs.readFileSync(path.join(migrationsDirectory, file), 'utf8'));
        await client.query('SET search_path TO public');
        await client.query('INSERT INTO public.schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        await client.query('SET search_path TO public');
        console.log(`Applied ${file}.`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('marketplace-literacy:migrations'))");
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Database migration failed:', error.message);
  process.exitCode = 1;
});
