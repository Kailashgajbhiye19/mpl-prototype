import { Pool } from 'pg';

export const dbPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'marketplace_literacy',
  password: process.env.DB_PASSWORD,

  port: parseInt(process.env.DB_PORT ?? '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
dbPool.on('connect', () => {
  console.log('Database connected successfully');
});

dbPool.on('error', (err) => {
  console.error('Database connection error:', err);
});
