const axios = require('axios');
const config = require('../config/config');

axios.defaults.headers.common['X-API-KEY'] = config.apiAuthKey;

class sectorService {
  /**
   * Get alert by location
   * @param {String} location
   * @returns {Promise<any|*[]>}
   */
  static async getSector(location) {
    const sector = await axios.get(`${config.apiBaseUrl}/sectors/${location}`);
    return sector.data || {};
  }

  /**
   * Force update on chat
   * @returns {Promise<axios.AxiosResponse<any>>}
   */
  static async getAllSectors() {
    const sectors = await axios.get(`${config.apiBaseUrl}/sectors`);
    return sectors.data || [];
  }
}

module.exports = sectorService;
