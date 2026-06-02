'use strict';

const DIRECTION = Object.freeze({
  BUY: 'BUY',
  SELL: 'SELL',
});

const STATUS = Object.freeze({
  OPEN: 'OPEN',
  TARGET_HIT: 'TARGET_HIT',
  STOPLOSS_HIT: 'STOPLOSS_HIT',
  EXPIRED: 'EXPIRED',
});

// A signal in any of these states is permanently resolved and must never change.
const TERMINAL_STATUSES = Object.freeze([
  STATUS.TARGET_HIT,
  STATUS.STOPLOSS_HIT,
  STATUS.EXPIRED,
]);

module.exports = { DIRECTION, STATUS, TERMINAL_STATUSES };
