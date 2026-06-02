'use strict';

/**
 * Vercel serverless entry point.
 * Do NOT call app.listen() here — Vercel invokes this module per request.
 * Local development still uses src/server.js.
 */
const createApp = require('../src/app');

module.exports = createApp();
