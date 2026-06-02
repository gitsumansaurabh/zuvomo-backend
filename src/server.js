"use strict";

const createApp = require("./app");
const config = require("./config/env");

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(
    `[server] Signal tracker API listening on http://localhost:${config.port} (${config.nodeEnv})`,
  );
});

// Graceful shutdown.
function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`[server] ${signal} received, shutting down ...`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
