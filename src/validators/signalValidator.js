"use strict";

const { DIRECTION } = require("../constants/signal");
const config = require("../config/env");

function validateCreateSignal(body = {}) {
  const errors = [];

  const symbol =
    typeof body.symbol === "string" ? body.symbol.trim().toUpperCase() : null;
  if (!symbol) {
    errors.push({ field: "symbol", message: "symbol is required" });
  } else if (!/^[A-Z0-9]{4,20}$/.test(symbol)) {
    errors.push({
      field: "symbol",
      message: "symbol must be a valid trading pair, e.g. BTCUSDT",
    });
  }

  const direction =
    typeof body.direction === "string"
      ? body.direction.trim().toUpperCase()
      : null;
  if (direction !== DIRECTION.BUY && direction !== DIRECTION.SELL) {
    errors.push({
      field: "direction",
      message: "direction must be either BUY or SELL",
    });
  }

  const entryPrice = toPositiveNumber(body.entry_price);
  if (entryPrice === null) {
    errors.push({
      field: "entry_price",
      message: "entry_price must be a positive number",
    });
  }

  const stopLoss = toPositiveNumber(body.stop_loss);
  if (stopLoss === null) {
    errors.push({
      field: "stop_loss",
      message: "stop_loss must be a positive number",
    });
  }

  const targetPrice = toPositiveNumber(body.target_price);
  if (targetPrice === null) {
    errors.push({
      field: "target_price",
      message: "target_price must be a positive number",
    });
  }

  const entryTime = toDate(body.entry_time);
  if (!entryTime) {
    errors.push({
      field: "entry_time",
      message: "entry_time must be a valid date/time",
    });
  }

  const expiryTime = toDate(body.expiry_time);
  if (!expiryTime) {
    errors.push({
      field: "expiry_time",
      message: "expiry_time must be a valid date/time",
    });
  }

  // Direction-aware price relationships (only when prices are valid).
  if (
    entryPrice !== null &&
    stopLoss !== null &&
    targetPrice !== null &&
    direction
  ) {
    if (direction === DIRECTION.BUY) {
      if (!(stopLoss < entryPrice)) {
        errors.push({
          field: "stop_loss",
          message: "For BUY signals, stop_loss must be less than entry_price",
        });
      }
      if (!(targetPrice > entryPrice)) {
        errors.push({
          field: "target_price",
          message:
            "For BUY signals, target_price must be greater than entry_price",
        });
      }
    } else if (direction === DIRECTION.SELL) {
      if (!(stopLoss > entryPrice)) {
        errors.push({
          field: "stop_loss",
          message:
            "For SELL signals, stop_loss must be greater than entry_price",
        });
      }
      if (!(targetPrice < entryPrice)) {
        errors.push({
          field: "target_price",
          message:
            "For SELL signals, target_price must be less than entry_price",
        });
      }
    }
  }

  // Time relationships (only when both times are valid).
  if (entryTime && expiryTime) {
    if (expiryTime.getTime() <= entryTime.getTime()) {
      errors.push({
        field: "expiry_time",
        message: "expiry_time must be after entry_time",
      });
    }
  }

  if (entryTime) {
    const now = Date.now();
    const earliestAllowed = now - config.entryPastGraceHours * 60 * 60 * 1000;
    if (entryTime.getTime() < earliestAllowed) {
      errors.push({
        field: "entry_time",
        message: `entry_time cannot be more than ${config.entryPastGraceHours} hours in the past`,
      });
    }
  }

  if (errors.length > 0) {
    return { value: null, errors };
  }

  return {
    value: {
      symbol,
      direction,
      entry_price: entryPrice,
      stop_loss: stopLoss,
      target_price: targetPrice,
      entry_time: entryTime.toISOString(),
      expiry_time: expiryTime.toISOString(),
    },
    errors: [],
  };
}

function toPositiveNumber(input) {
  if (input === null || input === undefined || input === "") return null;
  const n = Number(input);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function toDate(input) {
  if (!input) return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

module.exports = { validateCreateSignal };
