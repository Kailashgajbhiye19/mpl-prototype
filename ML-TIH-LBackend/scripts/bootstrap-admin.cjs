const path = require('node:path');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const requiredValues = [
  'INITIAL_ADMIN_USERNAME',
  'INITIAL_ADMIN_EMAIL',
  'INITIAL_ADMIN_NAME',
  'INITIAL_ADMIN_PASSWORD',
];
const missing = requiredValues.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error('Set the initial admin values in the private .env file before bootstrapping.');
  process.exit(1);
}
if (process.env.INITIAL_ADMIN_PASSWORD.length < 12 || Buffer.byteLength(process.env.INITIAL_ADMIN_PASSWORD, 'utf8') > 72) {
  console.error('INITIAL_ADMIN_PASSWORD must be at least 12 characters and at most 72 UTF-8 bytes.');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'marketplace_literacy',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function bootstrapAdmin() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('marketplace-literacy:initial-admin'))");
    const existing = await client.query('SELECT 1 FROM admin_users LIMIT 1');
    if (existing.rowCount) {
      throw new Error('An admin account already exists. Initial bootstrap is only allowed on an empty admin table.');
    }
    const passwordHash = await bcrypt.hash(process.env.INITIAL_ADMIN_PASSWORD, 12);
    await client.query(
      'INSERT INTO admin_users (username, email, name, password_hash, is_active) VALUES ($1, $2, $3, $4, true)',
      [process.env.INITIAL_ADMIN_USERNAME.trim(), process.env.INITIAL_ADMIN_EMAIL.trim(), process.env.INITIAL_ADMIN_NAME.trim(), passwordHash],
    );
    await client.query('COMMIT');
    console.log('Initial administrator account created. Remove the INITIAL_ADMIN_* values from .env.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

bootstrapAdmin().catch((error) => {
  console.error('Administrator bootstrap failed:', error.message);
  process.exitCode = 1;
});
