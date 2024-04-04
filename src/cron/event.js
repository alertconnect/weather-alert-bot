const cron = require('node-cron');
const chatController = require('../controllers/chat.controller');
const logger = require('../utils/logger');

/**
 * Send message on all groups with alert
 */
function sendAlertUpdates() {
  cron.schedule(
    '*/60 * * * *',
    () => {
      logger.debug(`Task scheduled: sendUpdates`);
      chatController.sendAlertsToChats().then(() => {
        logger.info(`Task completed: sendAlertsToChats`);
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
