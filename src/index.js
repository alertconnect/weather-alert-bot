require('dotenv').config();
const config = require('./config/config');
const Telegraf = require('telegraf');
const chatService = require('./services/chat.service');
const botService = require('./services/bot.service');
const axios = require('axios');
const job = require('./cron');
const logger = require('./utils/logger');

const bot = new Telegraf(config.botToken);

job.eventJob();

bot.command('start', async (ctx) => {
  const msg = ctx.message;
  logger.info(`Start requested by ${msg.from.id} on group ${msg.chat.id}`);
  try {
    await botService
      .sendHTMLMessage(
        msg.chat.id,
        '<b>Weather Alert Bot</b>. \n\nTi notificherà le allerte metereologiche diramate dal Dipartimento di Protezione civile nella zona configurata.\n\n<code>/set [GEOCODE]</code> per impostare una zona.\n<b>Ex. </b><code>/set Lomb-09</code>',
      )
      .then((r) => {});
  } catch (err) {}
});

bot.command('set', async (ctx) => {
  const msg = ctx.message;
  logger.info(`Setup requested by ${msg.from.id} on group ${msg.chat.id}`);
  try {
    const geoloc = msg.text.replace('/set ', '');
    if (geoloc === '' || geoloc === '/set') {
      throw '';
    } else {
      await chatService.createChat(ctx, geoloc);
      await botService.sendMdMessage(
        ctx.chat.id,
        `*Setup completato*, 
nel gruppo con id *${msg.chat.id}* verrà mandato un recap giornaliero in caso di allerte locali nella zona *${geoloc}*!`,
      );
    }
  } catch (err) {
    try {
      await botService.sendHTMLMessage(
        msg.chat.id,
        'Il geocode non è valido.\n\n<code>/set [GEOCODE]</code> per impostare una zona.\n<b>Ex. </b><code>/set Lomb-09</code>',
      );
    } catch (e) {
      logger.error(`Setup request throw an error on group ${msg.chat.id}`, err);
    }
  }
});

bot.command('help', async (ctx) => {
  const msg = ctx.message;
  logger.info(`Help requested by ${msg.from.id} on group ${msg.chat.id}`);
  try {
    await botService
      .sendHTMLMessage(
        msg.chat.id,
        '<b>Weather Alert Bot</b>. \n\nTi notificherà le allerte metereologiche diramate dal Dipartimento di Protezione civile nella zona configurata.\n\n<code>/set [GEOCODE]</code> per impostare una zona (Puoi mandare più volte il comando con zone differenti per essere notificato su tutte le zone richieste).\n<b>Ex. </b><code>/set Lomb-09</code>\n\n Il bot è open-source e disponibile pubblicamente su <a href="https://github.com/prociv-sm/weather-alert-bot">GitHub</a>',
      )
      .then((r) => {});
  } catch (err) {
    logger.error(`Help request throw an error on group ${msg.chat.id}`, err);
  }
});

bot.command('info', async (ctx) => {
  const msg = ctx.message;
  logger.info(`Info requested by ${msg.from.id} on group ${msg.chat.id}`);
  try {
    const chat = await chatService.findChat(msg.chat.id);

    if (!chat.data.geo) {
      await botService.sendHTMLMessage(
        msg.chat.id,
        'Questa chat non è ancora stata configurata e non può fornire allerte sulla zona.\n\nUsa il comando <code>/set [GEOCODE]</code> per impostare una zona.\n<b>Ex. </b><code>/set Lomb-09</code>',
      );
      logger.error(
        `Info request throw an error for unset chat on group ${msg.chat.id}`,
      );
    }

    const alert = await axios.get(`${config.apiBaseUrl}/alert`, {
      params: {
        geo: chat.data.geo,
      },
    });
    const message = await chatService.alertMessageParsed(
      msg.chat.id,
      alert.data.result,
    );

    await botService.sendMdMessage(msg.chat.id, message);
  } catch (err) {
    logger.error(`Info request throw an error on group ${msg.chat.id}`, err);
  }
});

bot.command('update', async (ctx) => {
  const msg = ctx.message;
  logger.info(`Force update command requested by ${msg.from.id}`);
  try {
    await axios.post(`${config.apiBaseUrl}/alert/refresh`);
    await botService.sendMessage(
      msg.chat.id,
      'Aggiornamento dei record effettuato con successo!',
    );
  } catch (err) {
    logger.error(
      `Force update request throw an error on group ${msg.chat.id}`,
      err,
    );
  }
});

bot.command('unsync', async (ctx) => {
  const msg = ctx.message;
  logger.info(
    `Unsync command requested by ${msg.from.id} on group ${msg.chat.id}`,
  );
  const chat = await chatService.findChat(msg.chat.id);
  if (chat.data) {
    try {
      await chatService.deleteChat(ctx);
      await botService.sendHTMLMessage(
        msg.chat.id,
        'Richiesta di cancellazione dalle allerte automatiche ricevuta.\n\nUsa <code>/set [GEOCODE]</code> per riattivare il servizio su una zona.\n<b>Ex. </b><code>/set Lomb-09</code>\n\nPuoi anche richiedere allerte su richiesta tramite il comando <code>/info</code>',
      );
    } catch (err) {
      logger.error(
        `Unsync request throw an error on group ${msg.chat.id}`,
        err,
      );
    }
  } else {
    await botService.sendHTMLMessage(
      msg.chat.id,
      'Questa chat non è ancora stata configurata e non può quindi essere scollegata dalle allerte periodiche.\n\nUsa il comando <code>/set [GEOCODE]</code> per impostare una zona.\n<b>Ex. </b><code>/set Lomb-09</code>',
    );
    logger.error(
      `Unsync request throw an error for unset chat on group ${msg.chat.id}`,
    );
  }
});

bot.launch();
