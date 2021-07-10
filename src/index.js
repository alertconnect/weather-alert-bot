require('dotenv').config();
const config = require('./config/config');
const Telegraf = require('telegraf');
const chatService = require('./services/chat.service');
const botService = require('./services/bot.service');
const axios = require('axios');
const job = require('./cron');
const logger = require('./utils/logger');

const prefix = "!";

const bot = new Telegraf(config.botToken);

job.eventJob();

bot.on('text', async (ctx) => {
  const msg = ctx.message
  if(msg.text.startsWith(`${prefix}setup`)) {
    logger.info(`Setup requested by ${msg.from.id} on group ${msg.chat.id}`);
    const geoloc = msg.text.replace(`${prefix}setup `, '')
    if (geoloc === '' || geoloc === `${prefix}setup`) {
      await botService.sendMessage(msg.chat.id, 'geoloc assente')
    } else {
      await chatService.createChat(msg, prefix)
      await botService.sendMdMessage(
        msg.chat.id,
        `*Setup completato*, 
nel gruppo con id *${msg.chat.id}* verrà mandato un recap giornaliero in caso di allerte locali nella zona *${geoloc}*!`
      )
    }
  }

  if(msg.text.startsWith(`${prefix}info`)) {
    logger.info(`Info requested by ${msg.from.id} on group ${msg.chat.id}`);
    const chat = await chatService.findChat(msg.chat.id)
    console.log(chat.data.geo)
    const alert = await axios.get(`${config.apiBaseUrl}/alert`, {
      params: {
        geo: chat.data.geo
      }
    })
    const message = await chatService.alertMessageParsed(alert.data.result)

    await botService.sendMdMessage(
      msg.chat.id,
      message
    )
  }

  if(msg.text.startsWith(`${prefix}force-update`)) {
    logger.info(`Force update command requested by ${msg.from.id}`);
    await axios.post(`${config.apiBaseUrl}/alert/refresh`)
    await botService.sendMessage(
      msg.chat.id,
      'Aggiornamento dei record effettuato con successo!'
    )
  }
});

bot.launch();
