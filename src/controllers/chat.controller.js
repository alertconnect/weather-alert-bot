const chatService = require('../services/chat.service');
const alertService = require('../services/alert.service');
const sectorService = require('../services/sector.service');
const botService = require('../services/bot.service');
const messageHelper = require('../utils/message.helper');
const logger = require('../utils/logger');
const { pingHeartbeats } = require('../services/uptime.service');
const config = require('../config/config');

const CHAT_TOKEN = config.uptime.chatToken;

class chatController {
  /**
   * Send the initial start message
   * @param msg
   * @returns {Promise<void>}
   */
  static async startChat(msg) {
    logger.info(`Start requested by ${msg.from.id} on group ${msg.chat.id}`);
    await botService.sendHTMLMessage(
      msg.chat.id,
      messageHelper.getStartMessage(),
      true,
    );
  }

  /**
   * Send command list message
    * @param msg
   * @returns {Promise<void>}
   */
  static async getCommandList(msg) {
    logger.info(`Command list requested by ${msg.from.id} on group ${msg.chat.id}`);
    await botService.sendHTMLMessage(
      msg.chat.id,
      messageHelper.getHelpCommandList(),
      false,
    );
  }

  /**
   * Set a chat for alerts
   * @param msg
   * @returns {Promise<void>}
   */
  static async setChat(msg) {
    const location = msg.text.replace('/set ', '');
    logger.info(
      `Setup requested by ${msg.from.id} on group ${msg.chat.id} with location ${location}`,
    );
    if (location === '') {
      logger.info(`Location not found for group ${msg.chat.id}`);
      await botService.sendHTMLMessage(
        msg.chat.id,
        messageHelper.locationNotFoundMessage(),
      );
    } else {
      const sector = await sectorService.getSector(location).catch(async (err) => {
        logger.error(`Error finding sector with code ${location}`, err);
        await botService.sendHTMLMessage(
          msg.chat.id,
          messageHelper.locationNotFoundMessage(),
        );
      });
      if (sector) {
        logger.info(`Chat created for group with id ${msg.chat.id}`);
        await chatService.createChat(msg, location);
        await botService.sendHTMLMessage(
          msg.chat.id,
          messageHelper.setSuccessMessage(location, msg.chat.id),
        );
      }
    }
  }

  /**
   * Request latest alert for a chat
   * @param msg
   * @returns {Promise<void>}
   */
  static async getLatesAlert(msg) {
    logger.info(`Get latest alert requested by ${msg.from.id} on group ${msg.chat.id}`);
    const chat = await chatService.findChat(msg.chat.id);
    if (!chat.data) {
      await botService.sendHTMLMessage(
        msg.chat.id,
        'Questa chat non è ancora stata configurata e non può fornire allerte sulla zona.\n\nUsa il comando <code>/set [GEOCODE]</code> per impostare una zona.\n<b>Ex. </b><code>/set Lomb-09</code>',
      );
    }
    const alert = await alertService.getAlertByLocation(chat.data.code);
    const message = await chatService.messageGeneration(alert);
    await botService.sendMdMessage(msg.chat.id, message);
  }

  /**
   * Force an update on alerts records
   * @param msg
   * @param chatId
   * @returns {Promise<void>}
   */
  static async forceUpdate(msg, chatId) {
    logger.info(`Force update command requested by ${msg.from.id}`);
    try {
      await alertService.forceAlertsUpdate();
      await botService.sendMessage(
        msg.chat.id,
        'Aggiornamento dei record effettuato con successo!',
      );
    } catch (err) {
      logger.error(
        `Force update request throw an error on group ${chatId}`,
        err,
      );
    }
  }

  /**
   * Remove a chat from the database
   * @param msg
   * @param chatId
   * @returns {Promise<void>}
   */
  static async unsyncChat(msg, chatId) {
    logger.info(
      `Unsync command requested by ${msg.from.id} on group ${msg.chat.id}`,
    );
    const chat = await chatService.findChat(msg.chat.id);
    // Check if the chat is already configured
    if (chat.data) {
      logger.info(`Chat unsynced for group with id ${msg.chat.id}`);
      await chatService.deleteChat(chatId);
      await botService.sendHTMLMessage(
        msg.chat.id,
        'Richiesta di cancellazione dalle allerte automatiche ricevuta.\n\nUsa <code>/set [GEOCODE]</code> per riattivare il servizio su una zona.\n<b>Ex. </b><code>/set Lomb-09</code>\n\nPuoi anche richiedere allerte su richiesta tramite il comando <code>/info</code>',
      );
    } else {
      await botService.sendHTMLMessage(
        msg.chat.id,
        'Questa chat non è ancora stata configurata e non può quindi essere scollegata dalle allerte periodiche.\n\nUsa il comando <code>/set [GEOCODE]</code> per impostare una zona.\n<b>Ex. </b><code>/set Lomb-09</code>',
      );
    }
  }

  /**
   * Get the sector list message
   * @param msg
   * @returns {Promise<void>}
   */
  static async getSectorList(msg) {
    // Get all available sectors
    const sectors = await sectorService.getAllSectors();
    logger.info(`Sector list requested by ${msg.from.id} on group ${msg.chat.id}`);
    let message;
    if (sectors.length > 0) {
      message = messageHelper.getSectorListMessage(sectors);
    } else {
      message = 'Nessun settore disponibile';
    }
    // Send the message to the chat
    await botService.sendHTMLMessage(msg.chat.id, message, false);
  }

  /**
   * Send alerts to chats
   * @returns {Promise<void>}
   */
  static async sendAlertsToChats() {
    // Get all registered chats
    const chats = await chatService.getAllChats();
    logger.info(`Checking for new alerts for ${chats.length} groups`);
    chats.forEach(async (chat) => {
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
    });
    // Execute ping to uptime API
    await pingHeartbeats(CHAT_TOKEN);
  }
}

module.exports = chatController;
