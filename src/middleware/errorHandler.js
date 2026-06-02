'use strict';

const ApiError = require('../utils/ApiError');

/**
 * 404 handler for unmatched routes.
 */
function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Central error handler. Converts ApiError (and unexpected errors) into a
 * consistent JSON envelope. Validation failures surface as HTTP 400 with
 * field-level details; unexpected errors become 500 without leaking internals.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  let statusCode = isApiError ? err.statusCode : 500;

  // DB misconfiguration / connectivity (avoid masking as generic 500)
  if (err.statusCode === 503) statusCode = 503;
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    statusCode = 503;
  }

  if (!isApiError || statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    error: {
      message: isApiError ? err.message : 'Internal server error',
      details: isApiError ? err.details : [],
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
