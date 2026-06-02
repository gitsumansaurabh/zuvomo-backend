'use strict';

const { Pool } = require('pg');
const config = require('../config/env');

if (!config.databaseUrl) {
  // Fail fast with a clear message rather than a cryptic pg error later.
  // eslint-disable-next-line no-console
  console.warn(
    '[db] DATABASE_URL is not set. Copy .env.example to .env and configure it.'
  );
}

/**
 * Single shared connection pool for the whole process.
 * SSL is toggled via DATABASE_SSL (needed for most managed/remote Postgres).
 */
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[db] Unexpected error on idle Postgres client', err);
});

/**
 * Thin query helper so callers don't have to manage clients manually.
 * @param {string} text - parameterised SQL
 * @param {Array} [params] - query parameters
 */
async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
