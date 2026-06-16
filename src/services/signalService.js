"use strict";

const signalModel = require("../models/signalModel");
const binanceService = require("./binanceService");
const { resolveStatus } = require("./statusService");
const { computeRoi } = require("../utils/roi");
const { STATUS, TERMINAL_STATUSES } = require("../constants/signal");
const ApiError = require("../utils/ApiError");

function normalizeSymbol(symbol) {
  return String(symbol || "").trim().toUpperCase();
}

async function createSignal(validatedSignal) {
  return signalModel.create({ ...validatedSignal, status: STATUS.OPEN });
}

async function listSignals() {
  const signals = await signalModel.findAll();
  if (signals.length === 0) return [];

  const symbols = signals.map((s) => s.symbol);
  const priceMap = await binanceService.getPrices(symbols);

  const enriched = [];
  for (const signal of signals) {
    const currentPrice = priceMap.get(normalizeSymbol(signal.symbol));
    const refreshed = await refreshSignalStatus(signal, currentPrice);
    enriched.push(presentSignal(refreshed, currentPrice));
  }
  return enriched;
}

async function getSignalById(id) {
  const signal = await signalModel.findById(id);
  if (!signal) throw ApiError.notFound("Signal not found");

  let currentPrice = null;
  try {
    currentPrice = await binanceService.getPrice(normalizeSymbol(signal.symbol));
  } catch (_err) {
    currentPrice = null; // keep working even if price fetch fails
  }

  const refreshed = await refreshSignalStatus(signal, currentPrice);
  return presentSignal(refreshed, currentPrice);
}

async function deleteSignal(id) {
  const deleted = await signalModel.deleteById(id);
  if (!deleted) throw ApiError.notFound("Signal not found");
}

async function getSignalStatus(id) {
  const presented = await getSignalById(id);
  return {
    id: presented.id,
    symbol: presented.symbol,
    status: presented.status,
    current_price: presented.current_price,
    roi: presented.roi,
    realized_roi: presented.realized_roi,
    time_remaining_ms: presented.time_remaining_ms,
  };
}

async function refreshSignalStatus(signal, currentPrice) {
  // Expiry lock: never re-evaluate terminal signals.
  if (TERMINAL_STATUSES.includes(signal.status)) {
    return signal;
  }

  const result = resolveStatus(signal, currentPrice, new Date());
  if (!result.changed) {
    return signal;
  }

  const updated = await signalModel.updateStatus(
    signal.id,
    result.status,
    result.realizedRoi,
  );
  return updated || signal;
}

function presentSignal(signal, currentPrice) {
  const price = Number.isFinite(currentPrice) ? currentPrice : null;

  // Live (unrealized) ROI for OPEN signals; realized ROI takes over once resolved.
  const liveRoi =
    price !== null
      ? computeRoi(signal.direction, signal.entry_price, price)
      : null;
  const realizedRoi =
    signal.realized_roi !== null && signal.realized_roi !== undefined
      ? Number(signal.realized_roi)
      : null;

  const timeRemainingMs = Math.max(
    0,
    new Date(signal.expiry_time).getTime() - Date.now(),
  );

  return {
    id: signal.id,
    symbol: normalizeSymbol(signal.symbol),
    direction: signal.direction,
    entry_price: Number(signal.entry_price),
    stop_loss: Number(signal.stop_loss),
    target_price: Number(signal.target_price),
    entry_time: signal.entry_time,
    expiry_time: signal.expiry_time,
    created_at: signal.created_at,
    status: signal.status,
    current_price: price,
    // For resolved signals, ROI reflects the realized value; otherwise it is live.
    roi: realizedRoi !== null ? realizedRoi : liveRoi,
    realized_roi: realizedRoi,
    time_remaining_ms: timeRemainingMs,
  };
}

module.exports = {
  createSignal,
  listSignals,
  getSignalById,
  deleteSignal,
  getSignalStatus,
};
