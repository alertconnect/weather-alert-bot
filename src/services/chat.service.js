const moment = require('moment');
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

const botService = require('../services/bot.service')

const createChat = async (msg, prefix) => {
  const geoloc = msg.text.replace(`${prefix}setup `, '')
  logger.info(`Chat created for group with id ${msg.chat.id}`, {
    chat: msg.chat
  })
  await axios.put(`${config.apiBaseUrl}/group/${msg.chat.id}`, {
    chatId: msg.chat.id,
    title: msg.chat.title || msg.chat.username,
    lastAlert: new Date(),
    geo: geoloc,
    type: msg.chat.type || '',
  })
}

const alertMessageParsed = async (alert) => {
  let message
  if (alert.length > 0) {
    message = `🚨 *SITUAZIONE ATTUALE DI ALLERTA SUL TERRITORIO* 🚨

`
    for (const event of alert) {
      message = message.concat(`⚠️ ${eventType(event.type)}
*${event.severity === 'Severe' ? '🔴 Allerta Rossa' : '🟠 Allerta Arancione'}*
*🕒 Inizio*: ${moment(event.onset).format('DD/MM/yyyy HH:mm')}
*🕡 Termine*: ${moment(event.expires).format('DD/MM/yyyy HH:mm')}

`)
    }

    message = message.concat(`
*Zona di monitoraggio*: ${alert[0].description} - ${alert[0].geo}
*Ultimo aggiornamento*: ${moment(alert[0].sendedAt).format('DD/MM/yyyy HH:mm')}

Le informazioni sono raccolte dal sistema di DPC-Bollettini-Criticita-Idrogeologica-Idraulica della Presidenza del Consiglio dei Ministri - Dipartimento della Protezione Civile 
`)
  } else {
    message = `*SITUAZIONE ATTUALE DI ALLERTA SUL TERRITORIO*

✳️ Rischio temporali
🟢 Allerta Verde

✳️ Rischio idrogeologico
🟢 Allerta Verde

✳️️ Rischio idraulico
🟢 Allerta Verde

Zona di monitoraggio: 
Ultimo aggiornamento: 

Le informazioni sono raccolte dal sistema di DPC-Bollettini-Criticita-Idrogeologica-Idraulica della Presidenza del Consiglio dei Ministri - Dipartimento della Protezione Civile`
  }

  return message
}

const findChat = async (id) => {
  return await axios.get(`${config.apiBaseUrl}/group/${id}`)
}

const findAllChat = async () => {
  return await axios.get(`${config.apiBaseUrl}/group`)
}

const sendUpdates = async () => {
  const chats = await findAllChat()

  console.log(chats.data)
  for (const chat of chats.data.groups) {
    const alert = await axios.get(`${config.apiBaseUrl}/alert?geo=${chat.geo}`)
    if (alert.result.size > 0) {
      console.log(alert)
      const message = await alertMessageParsed(alert.result)

      await botService.sendMdMessage(
        chat.chatId,
        message
      )
    }else {
      console.log(`${chat.geo} no alert disponibili`)
    }
  }
}

const eventType = (event) => {
  if(event === 'hydro') {
    return 'Rischio *idraulico*'
  } else if(event === 'geo') {
    return 'Rischio *idrogeologico*'
  } else if(event === 'storm') {
    return 'Rischio *temporali*'
  } else {
    return 'error'
  }
}

module.exports = {
  createChat,
  findChat,
  alertMessageParsed,
  sendUpdates,
};
