const cron = require('node-cron');
const chatService = require('../services/chat.service');

/**
 * Send message on all groups with alert
 */
function sendAlertUpdates() {
  cron.schedule(
    '*/5 * * * *',
    () => {
      console.log('debug', 'starting task: sendUpdates');
      chatService
        .sendUpdates()
        .then(() => {
          console.log('info', 'task completed: sendUpdates');
        })
        .catch((error) => {
          console.log('error', 'task failed: sendUpdates');
          console.error(error);
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
