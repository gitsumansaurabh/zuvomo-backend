"use strict";

const config = require("../config/env");
const ApiError = require("../utils/ApiError");

const cache = new Map(); // symbol -> { price, fetchedAt }

function normalizeSymbol(symbol) {
  return String(symbol || "").trim().toUpperCase();
}

function parseSymbolPair(sym) {
  const m = /^([A-Z0-9]+)(USDT|USDC|BUSD|USD|BTC|ETH|BNB)$/.exec(sym);
  if (!m) return null;
  return { base: m[1], quote: m[2] };
}

async function fetchKucoinPrice(sym) {
  const pair = parseSymbolPair(sym);
  if (!pair) {
    throw ApiError.badRequest(`Unsupported trading pair format: ${sym}`);
  }
  const kucoinSymbol = `${pair.base}-${pair.quote}`;
  const url = `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${encodeURIComponent(kucoinSymbol)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "User-Agent": "signal-tracker-backend/1.0" },
  });
  if (!response.ok) {
    throw ApiError.badGateway(
      `KuCoin responded with status ${response.status} (${kucoinSymbol})`,
    );
  }
  const payload = await response.json();
  const price = Number(payload?.data?.price);
  if (!Number.isFinite(price)) {
    throw ApiError.badGateway(
      `KuCoin returned an invalid price for ${kucoinSymbol}`,
    );
  }
  return price;
}

async function fetchMexcPrice(sym) {
  const url = `https://api.mexc.com/api/v3/ticker/price?symbol=${encodeURIComponent(sym)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "User-Agent": "signal-tracker-backend/1.0" },
  });
  if (response.status === 400) {
    throw ApiError.badRequest(`Unknown or invalid trading pair: ${sym}`);
  }
  if (!response.ok) {
    throw ApiError.badGateway(`MEXC responded with status ${response.status}`);
  }
  const payload = await response.json();
  const price = Number(payload?.price);
  if (!Number.isFinite(price)) {
    throw ApiError.badGateway(`MEXC returned an invalid price for ${sym}`);
  }
  return price;
}

async function getPrice(symbol) {
  const sym = normalizeSymbol(symbol);
  if (!sym) {
    throw ApiError.badRequest("Trading pair symbol is required");
  }
  const cached = cache.get(sym);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < config.priceCacheTtlMs) {
    return cached.price;
  }

  const candidates =
    Array.isArray(config.binanceApiBases) && config.binanceApiBases.length > 0
      ? config.binanceApiBases
      : [config.binanceApiBase];

  const failures = [];
  let price = null;
  for (const base of candidates) {
    const url = `${base}/api/v3/ticker/price?symbol=${encodeURIComponent(sym)}`;
    let response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "signal-tracker-backend/1.0" },
      });
    } catch (err) {
      failures.push(`Binance ${base} network error: ${err.message}`);
      continue;
    }

    if (response.status === 400) {
      // Binance returns 400 for unknown symbols.
      throw ApiError.badRequest(`Unknown or invalid trading pair: ${sym}`);
    }
    if (!response.ok) {
      failures.push(`Binance ${base} status ${response.status}`);
      continue;
    }

    const data = await response.json();
    price = Number(data.price);
    if (Number.isFinite(price)) {
      break;
    }
    failures.push(`Binance ${base} invalid payload`);
  }

  // If Binance is blocked (e.g. 451 on Vercel region), try other public exchanges.
  if (!Number.isFinite(price)) {
    try {
      price = await fetchKucoinPrice(sym);
      // eslint-disable-next-line no-console
      console.warn(`[price-fallback] using KuCoin price for ${sym}`);
    } catch (err) {
      failures.push(`KuCoin failed: ${err.message}`);
    }
  }

  if (!Number.isFinite(price)) {
    try {
      price = await fetchMexcPrice(sym);
      // eslint-disable-next-line no-console
      console.warn(`[price-fallback] using MEXC price for ${sym}`);
    } catch (err) {
      failures.push(`MEXC failed: ${err.message}`);
    }
  }

  if (!Number.isFinite(price)) {
    throw ApiError.badGateway(
      `Unable to fetch price for ${sym}. Attempts: ${failures.join(" | ")}`,
    );
  }

  cache.set(sym, { price, fetchedAt: now });
  return price;
}

async function getPrices(symbols) {
  const unique = [
    ...new Set(symbols.map((s) => normalizeSymbol(s)).filter(Boolean)),
  ];
  const entries = await Promise.all(
    unique.map(async (sym) => {
      try {
        return [sym, await getPrice(sym)];
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(
          `[binance] failed to fetch price for ${sym}: ${err.message}`,
        );
        return [sym, null];
      }
    }),
  );
  return new Map(entries);
}

module.exports = { getPrice, getPrices };
