const cron = require('node-cron');
const chatService = require('../services/chat.service');
const logger = require('../utils/logger');

/**
 * Send message on all groups with alert
 */
function sendAlertUpdates() {
  cron.schedule(
    '*/60 * * * *',
    () => {
      logger.debug(`Task scheduled: sendUpdates`);
      chatService
        .sendUpdates()
        .then(() => {
          logger.info(`Task completed: sendUpdates`);
        })
        .catch((error) => {
          logger.error(`Task failed: sendUpdates`, {
            error,
          });
        });
    },
    {
      scheduled: true,
    },
  );
}

module.exports = () => {
  sendAlertUpdates();
};
