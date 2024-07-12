const pino = require('pino');

const config = require('../config/config');

const LOGS_TOKEN = config.uptime.logsToken;

const transports = pino.transport({
  targets: [
    {
      target: '@logtail/pino',
      options: { sourceToken: LOGS_TOKEN },
    },
    {
      target: 'pino-pretty',
    },
  ],
});

const logger = pino(
  transports,
);

module.exports = logger;
