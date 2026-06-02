"use strict";

require("dotenv").config();

const config = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  databaseUrl: process.env.DATABASE_URL,
  databaseSsl:
    String(process.env.DATABASE_SSL || "false").toLowerCase() === "true",

  binanceApiBase: process.env.BINANCE_API_BASE || "https://api.binance.com",
  priceCacheTtlMs: parseInt(process.env.PRICE_CACHE_TTL_MS, 10) || 5000,

  entryPastGraceHours: parseInt(process.env.ENTRY_PAST_GRACE_HOURS, 10) || 24,
};

module.exports = config;
