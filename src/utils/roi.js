"use strict";

const { DIRECTION } = require("../constants/signal");

function computeRoi(direction, entryPrice, currentPrice) {
  const entry = Number(entryPrice);
  const current = Number(currentPrice);
  if (!Number.isFinite(entry) || entry === 0 || !Number.isFinite(current)) {
    return null;
  }

  const raw =
    direction === DIRECTION.SELL
      ? ((entry - current) / entry) * 100
      : ((current - entry) / entry) * 100;

  return round2(raw);
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { computeRoi, round2 };
