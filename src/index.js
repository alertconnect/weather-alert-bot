require('dotenv').config();
const Telegraf = require('telegraf');
const config = require('./config/config');
const job = require('./cron');
const logger = require('./utils/logger');
const {
  startChat, getLatesAlert, unsyncChat, forceUpdate, getSectorList, getCommandList, setChat,
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
  await setChat(msg).catch((err) => {
    logger.error(
      `Set request throw an error on group ${msg.chat.id}`,
      err,
    );
  });
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
