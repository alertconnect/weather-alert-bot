const moment = require('moment');

const botService = require('../services/bot.service')
const alertService = require('../services/alert.service')

const createChat = async (msg, prefix) => {
  const geoloc = msg.text.replace(`${prefix}setup `, '')
  await mongoose.model('Chat').updateOne({chatId: msg.chat.id}, {
    chatId: msg.chat.id,
    title: msg.chat.title || msg.chat.username,
    geo: geoloc,
    type: msg.chat.type || ''
  }, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  })
}

const alertMessageParsed = async (alert) => {
  let message
  if (alert.size > 0) {
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
  return mongoose.model('Chat').findOne({ chatId: id });
}

const findAllChat = async () => {
  return mongoose.model('Chat').find({});
}

const sendUpdates = async () => {
  const chats = await findAllChat()

  for (const chat of chats) {
    const alert = await alertService.findCurrentAlert(chat.geo)
    if (alert.size > 0) {
      console.log(alert)
      const message = await alertMessageParsed(alert)

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
