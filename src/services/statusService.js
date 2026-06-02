"use strict";

const { DIRECTION, STATUS, TERMINAL_STATUSES } = require("../constants/signal");
const { computeRoi } = require("../utils/roi");

function resolveStatus(signal, currentPrice, now = new Date()) {
  const currentStatus = signal.status;

  // Terminal states are frozen — never change them.
  if (TERMINAL_STATUSES.includes(currentStatus)) {
    return {
      status: currentStatus,
      realizedRoi:
        signal.realized_roi !== null && signal.realized_roi !== undefined
          ? Number(signal.realized_roi)
          : null,
      changed: false,
    };
  }

  const entry = Number(signal.entry_price);
  const stop = Number(signal.stop_loss);
  const target = Number(signal.target_price);
  const expiry = new Date(signal.expiry_time);

  // Only evaluate price-based transitions when we actually have a live price.
  if (Number.isFinite(currentPrice)) {
    const hitTarget =
      signal.direction === DIRECTION.BUY
        ? currentPrice >= target
        : currentPrice <= target;
    const hitStop =
      signal.direction === DIRECTION.BUY
        ? currentPrice <= stop
        : currentPrice >= stop;

    if (hitTarget) {
      return {
        status: STATUS.TARGET_HIT,
        realizedRoi: computeRoi(signal.direction, entry, currentPrice),
        changed: true,
      };
    }
    if (hitStop) {
      return {
        status: STATUS.STOPLOSS_HIT,
        realizedRoi: computeRoi(signal.direction, entry, currentPrice),
        changed: true,
      };
    }
  }

  // Expiry only applies while still OPEN and not resolved above.
  if (now.getTime() >= expiry.getTime()) {
    return { status: STATUS.EXPIRED, realizedRoi: null, changed: true };
  }

  // Still open, no transition.
  return { status: STATUS.OPEN, realizedRoi: null, changed: false };
}

module.exports = { resolveStatus };
