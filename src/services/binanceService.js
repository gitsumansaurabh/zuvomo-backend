"use strict";

const config = require("../config/env");
const ApiError = require("../utils/ApiError");

const cache = new Map(); // symbol -> { price, fetchedAt }

async function getPrice(symbol) {
  const sym = String(symbol).toUpperCase();
  const cached = cache.get(sym);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < config.priceCacheTtlMs) {
    return cached.price;
  }

  const url = `${config.binanceApiBase}/api/v3/ticker/price?symbol=${encodeURIComponent(sym)}`;

  let response;
  try {
    response = await fetch(url, { method: "GET" });
  } catch (err) {
    throw ApiError.badGateway(`Failed to reach Binance: ${err.message}`);
  }

  if (response.status === 400) {
    // Binance returns 400 for unknown symbols.
    throw ApiError.badRequest(`Unknown or invalid trading pair: ${sym}`);
  }
  if (!response.ok) {
    throw ApiError.badGateway(
      `Binance responded with status ${response.status}`,
    );
  }

  const data = await response.json();
  const price = Number(data.price);
  if (!Number.isFinite(price)) {
    throw ApiError.badGateway(`Binance returned an invalid price for ${sym}`);
  }

  cache.set(sym, { price, fetchedAt: now });
  return price;
}

async function getPrices(symbols) {
  const unique = [...new Set(symbols.map((s) => String(s).toUpperCase()))];
  const entries = await Promise.all(
    unique.map(async (sym) => {
      try {
        return [sym, await getPrice(sym)];
      } catch (_err) {
        return [sym, null];
      }
    }),
  );
  return new Map(entries);
}

module.exports = { getPrice, getPrices };
