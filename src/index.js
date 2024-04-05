require('dotenv').config();
const Telegraf = require('telegraf');
const config = require('./config/config');
const chatService = require('./services/chat.service');
const botService = require('./services/bot.service');
const job = require('./cron');
const logger = require('./utils/logger');
const {
  startChat, getLatesAlert, unsyncChat, forceUpdate, getSectorList, getCommandList,
} = require('./controllers/chat.controller');

const bot = new Telegraf(config.botToken);

job.eventJob();

bot.command('start', async (ctx) => {
  const msg = ctx.message;
  await startChat(msg).catch(() => {
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
      'La posizione inserita non è valida.\n\n<code>/set [POSIZIONE]</code> per impostare la tua zona. \n\nAd esempio, digita <b><code>/set Lomb-09</code></b> per la Lombardia "Nodo Idraulico di Milano".',
    );
  } else {
    await chatService.createChat(ctx, location);
    await botService.sendHTMLMessage(
      ctx.chat.id,
      `<b>Configurazione completata con successo!</b>\n\n Il recap giornaliero delle eventuali allerte locali nella zona <b>${location}</b> sarà inviato nel gruppo con ID <b>${msg.chat.id}</b>.\n\nGrazie per aver impostato le notifiche! 🌟`,
    );
  }
});

bot.command('help', async (ctx) => {
  const msg = ctx.message;
  await getCommandList(msg).catch((err) => {
    logger.error(
      `Sector list request throw an error on group ${msg.chat.id}`,
      err,
    );
  });
});

bot.command('sectors', async (ctx) => {
  const msg = ctx.message;
  await getSectorList(msg).catch((err) => {
    logger.error(
      `Sector list request throw an error on group ${msg.chat.id}`,
      err,
    );
  });
});

bot.command('alert', async (ctx) => {
  const msg = ctx.message;
  await getLatesAlert(msg).catch((err) => {
    logger.error(
      `Force update request throw an error on group ${msg.chat.id}`,
      err,
    );
  });
});

bot.command('update', async (ctx) => {
  const msg = ctx.message;
  await forceUpdate(msg, ctx.chat.id).catch((err) => {
    logger.error(
      `Force update request throw an error on group ${msg.chat.id}`,
      err,
    );
  });
});

bot.command('unsync', async (ctx) => {
  const msg = ctx.message;
  await unsyncChat(msg, ctx.chat.id).catch((err) => {
    logger.error(
      `Unsync request throw an error on group ${msg.chat.id}`,
      err,
    );
  });
});

bot.launch().then(() => {
  logger.info('Bot started');
});
