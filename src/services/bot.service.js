const config = require('../config/config');
const Telegraf = require('telegraf');
const logger = require('../utils/logger');

const bot = new Telegraf(config.botToken);

const sendMessage = async (id, content) => {
  logger.info(`New message sended on group with id ${id}`)
  await bot.telegram.sendMessage(
    id,
    content
  )
}

const sendMdMessage = async (id, content) => {
  logger.info(`New message sended on group with id ${id}`)
  await bot.telegram.sendMessage(
    id,
    content,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Bollettini criticita', url: `https://github.com/pcm-dpc/DPC-Bollettini-Criticita-Idrogeologica-Idraulica` }]
        ]
      }
    }
  )
}

module.exports = {
  sendMessage,
  sendMdMessage
};
