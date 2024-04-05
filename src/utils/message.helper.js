class MessageHelper {
  static getAllGoodMessage() {
    return `*SITUAZIONE SUL TERRITORIO*

Il Dipartimento della Protezione Civile non ha emesso allerte nell'area attualmente monitorata

🟢 Rischio temporali
🟢 Rischio idrogeologico
🟢 Rischio idraulico

Ulteriori dettagli su: ⤵️
`;
  }

  static getAlertSeverity(severity) {
    if (severity === 'Severe') {
      return '🔴 Allerta Rossa';
    }
    return '🟠 Allerta Arancione';
  }

  static eventType(event) {
    if (event === 'hydro') {
      return '⚠️ Rischio *idraulico*';
    } if (event === 'geo') {
      return '⚠️ Rischio *idrogeologico*';
    } if (event === 'storm') {
      return '⚠️ Rischio *temporali*';
    }
    return 'error';
  }

  /**
   * Get the start message
   * @returns {string}
   */
  static getStartMessage() {
    return '<b>Ciao!</b> Sono il bot delle allerte di AlertConnect. \n\nUna volta configurato, ti terrò aggiornato sulle ultime allerte meteo emesse dal Dipartimento di Protezione Civile nella tua zona designata.\n\nPer iniziare, ottieni il codice del settore in cui risiedi: \n <b>/sectors</b> - Visualizza la lista dei settori disponibili \n Una volta fatto esegui il comando: \n <b>/set [Codice del settore]</b> per impostare la tua zona. \n\nAd esempio, digita <b><code>/set Lomb-09</code></b> per la Lombardia "Nodo Idraulico di Milano".\n\nUsa il comando <b>/help</b> per ottenere la lista dei comandi disponibili!\n\nAlertConnect è un <b>progetto Open Source</b>. Puoi trovarlo su GitHub: <a href="https://github.com/alertconnect">github.com</a>. \n\nÈ stato ideato e sviluppato da <a href="https://andreacw.dev/">Andrea T.</a>.\n\nResta al sicuro e informato! 🌦️📢';
  }

  static getSectorListMessage(sectors) {
    let message;
    message = '<b>Lista dei settori disponibili:</b>\n\nDi seguito è possibile trovare una lista dei settori disponibili per la configurazione delle allerte automatiche. Utilizza il codice del settore per impostare la tua zona di interesse.\n\n<b>Es. </b><code>/set Lomb-09</code>\n\n<b>Settori:</b>\n';
    sectors.forEach((sector) => {
      message = message.concat(`<b>${sector.code}</b> - ${sector.description}\n`);
    });
    return message;
  }

  static getHelpCommandList() {
    return '<b>Lista dei comandi disponibili:</b>\n\n<b>/set [Codice del settore]</b> - Imposta la tua zona di interesse, il codice può essere trovato eseguendo il comando /sectors\n<b>/unsync</b> - Disattiva le allerte automatiche\n<b>/alert</b> - Visualizza l\'ultima allerta\n<b>/sectors</b> - Visualizza la lista dei settori disponibili\n<b>/help</b> - Visualizza questo messaggio\n<b>/start</b> - Visualizza il messaggio iniziale\n\n<b>Es. </b><code>/set Lomb-09</code>\n\n<b>Resta al sicuro e informato! 🌦️📢</b>';
  }
}

module.exports = MessageHelper;
