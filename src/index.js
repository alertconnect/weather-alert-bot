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
  await botService
    .sendHTMLMessage(
      msg.chat.id,
      '<b>Ciao!</b> Sono il bot delle allerte di AlertConnect. \n\nUna volta configurato, ti terrò aggiornato sulle ultime allerte meteo emesse dal Dipartimento di Protezione Civile nella tua zona designata.\n\nPer iniziare, utilizza il comando: \n\n<code>/set [POSIZIONE]</code> per impostare la tua zona. \n\nAd esempio, digita <b><code>/set Lomb-09</code></b> per la Lombardia "Nodo Idraulico di Milano".\n\nAlertConnect è un <b>progetto Open Source</b>. Puoi trovarci su GitHub: <a href="https://github.com/alertconnect">github.com/alertconnect</a>. \n\nÈ stato ideato e sviluppato da Andrea T. Per ulteriori informazioni, visita il sito <a href="https://andreacw.dev/">andreacw.dev</a>.\n\nResta al sicuro e informato! 🌦️📢',
    )
    .catch(() => {
      logger.error(`Start request throw an error on group ${msg.chat.id}`);
    });
});

bot.command('set', async (ctx) => {
  const msg = ctx.message;
  const location = msg.text.replace('/set ', '');
  logger.info(
    `Setup requested by ${msg.from.id} on group ${msg.chat.id} with location ${location}`,
  );
  if (location === '') {
    await botService.sendHTMLMessage(
      msg.chat.id,
      'Il geocode non è valido.\n\n<code>/set [GEOCODE]</code> per impostare una zona.\n<b>Ex. </b><code>/set Lomb-09</code>',
    );
  } else {
    await chatService.createChat(ctx, location);
    await botService.sendMdMessage(
      ctx.chat.id,
      `*Setup completato*, 
nel gruppo con id *${msg.chat.id}* verrà mandato un recap giornaliero in caso di allerte locali nella zona *${location}*!`,
    );
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
      .then(() => {
        logger.error(`Help request throw an error on group ${msg.chat.id}`);
      });
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
      await chatService.deleteChat(ctx.chat.id);
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
