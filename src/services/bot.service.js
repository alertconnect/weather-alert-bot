const config = require('../config/config');
const Telegraf = require('telegraf');
const logger = require('../utils/logger');

const bot = new Telegraf(config.botToken);

const sendMessage = async (id, content) => {
  logger.info(`New message sended on group with id ${id}`);
  await bot.telegram.sendMessage(id, content);
};

const sendMdMessage = async (id, content) => {
  logger.info(`New message sended on group with id ${id}`);
  await bot.telegram.sendMessage(id, content, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Bollettino criticita',
            url: `https://mappe.protezionecivile.gov.it/it/mappe-rischi/bollettino-di-criticita`,
          },
        ],
      ],
    },
  });
};

const sendHTMLMessage = async (id, content) => {
  logger.info(`New message sended on group with id ${id}`);
  await bot.telegram.sendMessage(id, content, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'OpenSource',
            url: `https://github.com/alertconnect`,
          },
          {
            text: 'Creatore',
            url: `https://andreacw.dev/`,
          },
        ],
      ],
    },
  });
};

module.exports = {
  sendMessage,
  sendMdMessage,
  sendHTMLMessage,
};
