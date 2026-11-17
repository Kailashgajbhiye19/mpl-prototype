const path = require('node:path');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const username = process.env.RESET_ADMIN_USERNAME?.trim();
const password = process.env.RESET_ADMIN_PASSWORD;
if (process.env.CONFIRM_ADMIN_PASSWORD_RESET !== 'true' || !username || !password) {
  console.error('Set RESET_ADMIN_USERNAME, RESET_ADMIN_PASSWORD, and CONFIRM_ADMIN_PASSWORD_RESET=true in the private .env file.');
  process.exit(1);
}
if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
  console.error('RESET_ADMIN_PASSWORD must be at least 12 characters and at most 72 UTF-8 bytes.');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'marketplace_literacy',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function resetAdminPassword() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('marketplace-literacy:admin-reset'))");
    const result = await client.query(
      'SELECT id FROM admin_users WHERE username = $1 AND is_active = true FOR UPDATE',
      [username],
    );
    if (!result.rowCount) throw new Error('No active administrator matches RESET_ADMIN_USERNAME.');
    const hash = await bcrypt.hash(password, 12);
    await client.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [hash, result.rows[0].id]);
    await client.query('COMMIT');
    console.log('Administrator password reset. Remove RESET_ADMIN_* values and CONFIRM_ADMIN_PASSWORD_RESET from .env.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetAdminPassword().catch((error) => {
  console.error('Administrator password reset failed:', error.message);
  process.exitCode = 1;
});
