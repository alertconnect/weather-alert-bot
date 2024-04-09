const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/config');

const UPTIME_URL = config.uptime.api;
const UPTIME_KEY = config.uptime.key;

class uptimeService {
  /**
   * @description - Ping Uptime API with heartbeat
   * @param {String} token
   * @return {Promise<*>}
   */
  static async pingHeartbeats(token) {
    if (!UPTIME_KEY) {
      logger.warn('Uptime API key not found');
      return;
    }
    try {
      logger.info(`Pinging uptime heartbeats with token: ${token}`);
      await axios.post(`${UPTIME_URL}/v1/heartbeat/${token}`, {
        headers: {
          Authorization: `Bearer ${UPTIME_KEY}`,
        },
      });
    } catch (e) {
      logger.error(`Pinging uptime heartbeats with token: ${token} failed`);
      logger.error(e);
    }
  }
}

module.exports = uptimeService;
