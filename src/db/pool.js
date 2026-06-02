'use strict';

const { Pool } = require('pg');
const config = require('../config/env');

if (!config.databaseUrl) {
  // eslint-disable-next-line no-console
  console.warn(
    '[db] DATABASE_URL is not set. Set it in .env (local) or Vercel Project Settings (production).'
  );
}

/**
 * Postgres pool tuned for both local dev and Vercel serverless.
 * connectionTimeoutMillis prevents 300s Vercel hangs when DB is unreachable.
 */
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: config.isVercel ? 1 : 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 15000,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[db] Unexpected error on idle Postgres client', err);
});

async function query(text, params) {
  if (!config.databaseUrl) {
    const err = new Error(
      'DATABASE_URL is not configured. Add it in Vercel → Settings → Environment Variables.'
    );
    err.statusCode = 503;
    throw err;
  }
  return pool.query(text, params);
}

module.exports = { pool, query };
