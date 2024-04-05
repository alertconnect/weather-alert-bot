const axios = require('axios');
const config = require('../config/config');

axios.defaults.headers.common['X-API-KEY'] = config.apiAuthKey;

class alertService {
  /**
   * Get alert by location
   * @param {String} location
   * @returns {Promise<any|*[]>}
   */
  static async getAlertByLocation(location) {
    const chats = await axios.get(`${config.apiBaseUrl}/alerts/${location}`);
    return chats.data || [];
  }

  /**
   * Force update on chat
   * @returns {Promise<axios.AxiosResponse<any>>}
   */
  static async forceAlertsUpdate() {
    return axios.post(`${config.apiBaseUrl}/alerts/refresh`);
  }
}

module.exports = alertService;
