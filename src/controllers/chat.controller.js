const chatService = require('../services/chat.service');
const alertService = require('../services/alert.service');
const botService = require('../services/bot.service');
const logger = require('../utils/logger');

class chatController {
  /**
   * Send alerts to chats
   * @returns {Promise<void>}
   */
  static async sendAlertsToChats() {
    // Get all registered chats
    const chats = await chatService.getAllChats();
    logger.info(`Checking for new alerts for ${chats.length} groups`);
    for (const chat of chats) {
      logger.info(`Checking for new alerts for group ${chat.telegram_id}`);
      // Get the latest alert for the chat
      const alert = await alertService.getAlertByLocation(chat.code);
      if (alert.length > 0) {
        if (alert[0].identifier !== chat.last_alert_code) {
          logger.info(
            `New alert available for groups ${chat.telegram_id} with location ${chat.code}, sended ${alert.length} alert`,
          );
          // Create the message content for the alert
          const message = await chatService.messageGeneration(alert);
          // Send the message to the chat
          await botService.sendMdMessage(chat.telegram_id, message);
          // Update the last alert code for the chat
          await chatService.updateChat(chat.id, alert[0].identifier);
        } else {
          logger.info(
            `Alert available for groups ${chat.telegram_id} with geo ${chat.code} but is already sended on latest scheduled sending`,
            {
              current: alert.identifier,
              chat: chat.last_alert_code,
            },
          );
        }
      } else {
        logger.info(
          `No alert available for groups ${chat.telegram_id} with geo ${chat.code}`,
        );
      }
    }
  }
}

module.exports = chatController;
