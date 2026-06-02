'use strict';

const { query } = require('../db/pool');

/**
 * Data-access layer for the `signals` table.
 * Only raw persistence concerns live here — no business logic, no HTTP.
 */

const RETURNING_COLUMNS = `
  id, symbol, direction,
  entry_price, stop_loss, target_price,
  entry_time, expiry_time, created_at,
  status, realized_roi
`;

async function create(signal) {
  const { rows } = await query(
    `INSERT INTO signals
       (symbol, direction, entry_price, stop_loss, target_price, entry_time, expiry_time, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${RETURNING_COLUMNS}`,
    [
      signal.symbol,
      signal.direction,
      signal.entry_price,
      signal.stop_loss,
      signal.target_price,
      signal.entry_time,
      signal.expiry_time,
      signal.status,
    ]
  );
  return rows[0];
}

async function findAll() {
  const { rows } = await query(
    `SELECT ${RETURNING_COLUMNS} FROM signals ORDER BY created_at DESC`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await query(
    `SELECT ${RETURNING_COLUMNS} FROM signals WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function deleteById(id) {
  const { rowCount } = await query('DELETE FROM signals WHERE id = $1', [id]);
  return rowCount > 0;
}

/**
 * Persist a status transition (and optional realized ROI).
 * Used by the status-resolution service when a live price resolves a signal.
 */
async function updateStatus(id, status, realizedRoi) {
  const { rows } = await query(
    `UPDATE signals
        SET status = $2,
            realized_roi = $3
      WHERE id = $1
      RETURNING ${RETURNING_COLUMNS}`,
    [id, status, realizedRoi]
  );
  return rows[0] || null;
}

module.exports = {
  create,
  findAll,
  findById,
  deleteById,
  updateStatus,
};
