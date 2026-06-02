'use strict';

require('dotenv').config();

function parseOrigins(value) {
  if (!value) return ['http://localhost:5173'];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const isVercel = Boolean(process.env.VERCEL);

const config = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isVercel,
  // Comma-separated list, e.g. http://localhost:5173,https://zuvomo-frontend.vercel.app
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN),

  databaseUrl: process.env.DATABASE_URL,
  databaseSsl:
    String(process.env.DATABASE_SSL || (isVercel ? 'true' : 'false')).toLowerCase() === 'true',

  binanceApiBase: process.env.BINANCE_API_BASE || 'https://api.binance.com',
  priceCacheTtlMs: parseInt(process.env.PRICE_CACHE_TTL_MS, 10) || 5000,

  entryPastGraceHours: parseInt(process.env.ENTRY_PAST_GRACE_HOURS, 10) || 24,
};

module.exports = config;