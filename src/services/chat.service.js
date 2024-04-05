const axios = require('axios');
const { format } = require('date-fns');
const config = require('../config/config');
const logger = require('../utils/logger');
const messageHelper = require('../utils/message.helper');

axios.defaults.headers.common['X-API-KEY'] = config.apiAuthKey;

class chatService {
  /**
   * Get all chats
   * @returns {Promise<any|*[]>}
   */
  static async getAllChats() {
    const chats = await axios.get(`${config.apiBaseUrl}/chats`);
    return chats.data || [];
  }

  /**
   * Find a chat by id
   * @param {number} id
   * @returns {Promise<axios.AxiosResponse<any>>}
   */
  static async findChat(id) {
    return axios.get(`${config.apiBaseUrl}/chats/${id}`).catch((err) => {
      logger.error(`Error finding chat with id ${id}`, err);
    });
  }

  /**
   * Create a new chat
   * @param {Object} msg
   * @param {String} location
   * @returns {Promise<void>}
   */
  static async createChat(msg, location) {
    logger.info(`Chat created for group with id ${msg.chat.id}`, {
      chat: msg.chat,
    });
    await axios
      .post(`${config.apiBaseUrl}/chats`, {
        telegram_id: msg.chat.id,
        title: msg.chat.title || msg.chat.username,
        type: msg.chat.type || '',
        code: location,
        last_alert_code: 'DPC_BULLETIN_NEW_08_18_69441',
        last_alert_date: new Date().toISOString(),
      })
      .catch((err) => {
        logger.error(
          `Error creating chat for group with id ${msg.chat.id}`,
          err,
        );
      });
  }

  /**
   * Update the last alert code for a chat
   * @param {string} id
   * @param {string} code
   */
  static async updateChat(id, code) {
    logger.info(`Chat with id ${id} updated with last alert code ${code}`);
    return axios
      .put(`${config.apiBaseUrl}/chats/${id}`, {
        last_alert_code: code,
        last_alert_date: new Date().toISOString(),
      })
      .catch((err) => {
        logger.error(`Error updating chat with id ${id}`, err);
      });
  }

  /**
   * Delete a chat
   * @param {number} chatId
   * @returns {Promise<void>}
   */
  static async deleteChat(chatId) {
    await axios.delete(`${config.apiBaseUrl}/chats/${chatId}`).catch((err) => {
      logger.error(`Error deleting chat with id ${chatId}`, err);
    });
  }

  /**
   * Function for the message content composition
   * @param {Array} alert
   * @returns {Promise<string>}
   */
  static async messageGeneration(alert) {
    let message;
    if (alert.length > 0) {
      message = `🚨 *NUOVA ALLERTA* 🚨

Il Dipartimento della Protezione Civile ha emesso ${
  alert.length > 1 ? 'le seguenti allerte' : "un'allerta"
} nell'area attualmente monitorata *${alert[0].location_code}* (${
  alert[0].location_desc
}),

`;
      alert.forEach((event) => {
        message = message.concat(`${messageHelper.eventType(event.type)}
*${messageHelper.getAlertSeverity(event.severity)}*
*🕒 Inizio*: ${format(new Date(event.onset), 'dd/MM/yyyy HH:mm')}
*🕡 Termine*: ${format(new Date(event.expires), 'dd/MM/yyyy HH:mm')}

`);
      });

      message = message.concat(`
*Ultimo aggiornamento*: ${format(
    new Date(alert[0].received),
    'dd/MM/yyyy HH:mm',
  )}
Ulteriori dettagli su: ⤵️
`);
    } else {
      message = messageHelper.getAllGoodMessage();
    }

    return message;
  }
}

module.exports = chatService;
