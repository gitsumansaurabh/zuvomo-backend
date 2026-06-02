'use strict';

const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const signalRoutes = require('./routes/signalRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

/**
 * Express application factory. Keeping app creation separate from server
 * startup (server.js) makes the app importable for tests.
 */
function createApp() {
  const app = express();

  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json());

  // Health check.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.use('/api/signals', signalRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
