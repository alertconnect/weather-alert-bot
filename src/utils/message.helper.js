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
    } else if (event === 'geo') {
      return '⚠️ Rischio *idrogeologico*';
    } else if (event === 'storm') {
      return '⚠️ Rischio *temporali*';
    }
    return 'error';
  }
}

module.exports = MessageHelper;
