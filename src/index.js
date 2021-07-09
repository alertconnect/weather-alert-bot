require('dotenv').config();
const config = require('./config/config');
const Telegraf = require('telegraf');
const job = require('./cron')
const dowloadService = require('./services/download.service')
const chatService = require('./services/chat.service')
const botService = require('./services/bot.service')
const alertService = require('./services/alert.service')
const mongoose = require('mongoose');
require("./models/chat.model");

mongoose.Promise = Promise;
const prefix = "!";

const dbUrl = `mongodb://${config.dbHost}:${config.dbPort}/${config.database}`;
const CONNECT_OPTIONS = {
  auto_reconnect: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  keepAlive: true,
  keepAliveInitialDelay: config.reconnectInterval,
};


function connect() {
  if (config.user.length || config.password.length) {
    CONNECT_OPTIONS.auth = config.auth;
    console.info('Authentication active', {
      user: config.user,
    });
  }

  mongoose.connect(dbUrl, CONNECT_OPTIONS).catch((e) => {
    console.error(e);
  });
}

const db = mongoose.connection;

db.on('connecting', () => {
  console.info('Connecting to MongoDB', {
    uri: dbUrl,
  });
});

db.on('connected', () => {
  console.info('Connected to MongoDB!');
});

db.once('open', () => {
  console.debug('MongoDB connection opened!');
});

db.on('reconnected', () => {
  console.info('MongoDB reconnected');
});

db.on('disconnected', () => {
  console.warn(
    `MongoDB disconnected! Retry in ${config.reconnectInterval / 1000}s...`,
  );
  setTimeout(() => connect(), config.reconnectInterval);
});

connect()

job.eventJob()

const bot = new Telegraf(config.botToken);

bot.on('text', async (ctx) => {
  const msg = ctx.message
  if(msg.text.startsWith(`${prefix}setup`)) {

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
    const chat = await chatService.findChat(msg.chat.id)
    const alert = await alertService.findCurrentAlert(chat.geo)
    const message = await chatService.alertMessageParsed(alert)

    await botService.sendMdMessage(
      msg.chat.id,
      message
    )
  }

  if(msg.text.startsWith(`${prefix}force-update`)) {
    console.log('update requested')
    await dowloadService.downloadLatestZip()
    await botService.sendMessage(
      msg.chat.id,
      'Aggiornamento dei record effettuato con successo!'
    )
  }
});

bot.launch();
