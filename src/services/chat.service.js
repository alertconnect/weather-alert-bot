const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');
const moment = require('moment');
moment.locale('it');

const botService = require('../services/bot.service')

const createChat = async (msg, geoloc) => {
  logger.info(`Chat created for group with id ${msg.chat.id}`, {
    chat: msg.chat
  })
  await axios.put(`${config.apiBaseUrl}/group/${msg.chat.id}`, {
    chatId: msg.chat.id,
    title: msg.chat.title || msg.chat.username,
    lastAlert: {
      date: moment.now()
    },
    geo: geoloc,
    type: msg.chat.type || '',
  })
}

const deleteChat = async (msg) => {
  await axios.delete(`${config.apiBaseUrl}/group/${msg.chat.id}`)
}

const alertMessageParsed = async (id, alert) => {
  let message
  if (alert.length > 0) {
    await updateChatSendTime(id, alert[0].identifier)
    message = `🚨 *NUOVA ALLERTA SUL TERRITORIO* 🚨

Il Dipartimento della Protezione Civile ha emesso ${alert.length > 1 ? "le seguenti allerte" : "un'allerta"} nell'area attualmente monitorata *${alert[0].geo}* (${alert[0].description}),

`
    for (const event of alert) {
      message = message.concat(`${eventType(event.type)}
*${event.severity === 'Severe' ? '🔴 Allerta Rossa' : '🟠 Allerta Arancione'}*
*🕒 Inizio*: ${moment(event.onset).format('DD/MM/yyyy HH:mm')}
*🕡 Termine*: ${moment(event.expires).format('DD/MM/yyyy HH:mm')}

`)
    }

    message = message.concat(`
*Ultimo aggiornamento*: ${moment(alert[0].sendedAt).format('DD/MM/yyyy HH:mm')}
Ulteriori dettagli su: ⤵️
`)
  } else {
    message = `*SITUAZIONE SUL TERRITORIO*

Il Dipartimento della Protezione Civile non ha emesso allerte nell'area attualmente monitorata

🟢 Rischio temporali
🟢 Rischio idrogeologico
🟢 Rischio idraulico

Ulteriori dettagli su: ⤵️
`
  }

  return message
}

const findChat = async (id) => {
  return await axios.get(`${config.apiBaseUrl}/group/${id}`)
}

const findAllChat = async () => {
  return await axios.get(`${config.apiBaseUrl}/group`)
}

const updateChatSendTime = async (id, identifier) => {
  return await axios.put(`${config.apiBaseUrl}/group/${id}`, {
    lastAlert: {
      date: moment.now(),
      identifier: identifier
    },
  })
}

const sendUpdates = async () => {
  const chats = await findAllChat()
  for (const chat of chats.data.groups) {
    const alert = await axios.get(`${config.apiBaseUrl}/alert?geo=${chat.geo}`)
    if (alert.data.result.length > 0) {
      if (alert.data.result[0].identifier !== chat.lastAlert.identifier) {
        logger.info(`New alert available for groups ${chat.chatId} with geo ${chat.geo}, sended ${alert.data.result.length} alert`)
        const message = await alertMessageParsed(chat.chatId, alert.data.result)
        await botService.sendMdMessage(
          chat.chatId,
          message
        )
      } else {
        logger.info(`Alert available for groups ${chat.chatId} with geo ${chat.geo} but is already sended on latest scheduled sending`, {
          current: alert.data.result[0].identifier,
          chat: chat.lastAlert.identifier
        })
      }
    }else {
      logger.info(`No alert available for groups ${chat.chatId} with geo ${chat.geo}`)
    }
  }
}

const eventType = (event) => {
  if(event === 'hydro') {
    return '⚠️ Rischio *idraulico*'
  } else if(event === 'geo') {
    return '⚠️ Rischio *idrogeologico*'
  } else if(event === 'storm') {
    return '⚠️ Rischio *temporali*'
  } else {
    return 'error'
  }
}

module.exports = {
  createChat,
  deleteChat,
  findChat,
  alertMessageParsed,
  sendUpdates,
};
