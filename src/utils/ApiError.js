'use strict';

/**
 * Operational error carrying an HTTP status code and optional field-level details.
 * The central error handler turns these into clean JSON responses.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - human readable message
   * @param {Array<{field: string, message: string}>} [details] - validation details
   */
  constructor(statusCode, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = []) {
    return new ApiError(400, message, details);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static badGateway(message = 'Upstream service error') {
    return new ApiError(502, message);
  }
}

module.exports = ApiError;
