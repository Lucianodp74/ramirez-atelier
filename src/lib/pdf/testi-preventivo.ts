/**
 * Ogni testo mostrato nel Preventivo PDF, in un solo posto. Cambiare il tono,
 * correggere una frase, o tradurre il documento richiede di modificare solo
 * questo file - mai il layout in PreventivoDocument.tsx, e viceversa: un
 * cambio di impaginazione non deve mai comportare di ritoccare le parole.
 */
export const testiPreventivo = {
  etichettaPer: 'Per',

  introduzione(tipoProgettoNome: string): string {
    return (
      `Grazie per averci raccontato il tuo progetto. Abbiamo guardato con cura ogni dettaglio ` +
      `di ${tipoProgettoNome.toLowerCase()} che ci hai descritto, e siamo pronti a trasformarlo ` +
      `in qualcosa di concreto.`
    );
  },

  messaggioCliente(messaggio: string): string {
    return ` Ci hai scritto: "${messaggio}"`;
  },

  titoloScelte: 'Le tue scelte',
  etichettaStile: 'Stile',
  etichettaMateriale: 'Materiale',
  etichettaFerramenta: 'Ferramenta',
  etichettaDimensioni: 'Dimensioni indicative',

  etichettaStima: 'Stima indicativa',
  notaStima:
    'Una stima orientativa, non un impegno definitivo: la cifra reale dipenderà dal progetto ' +
    'che definiremo insieme, nel dettaglio, durante il sopralluogo.',

  validita(dataScadenza: string): string {
    return (
      `Questa proposta resta valida fino al ${dataScadenza}. Se ti convince, il prossimo passo ` +
      `è semplice: rispondici, e fisseremo insieme un sopralluogo per definire ogni dettaglio ` +
      `con precisione.`
    );
  },

  numeroPreventivo(numero: string): string {
    return `Preventivo ${numero}`;
  },

  partitaIva(valore: string): string {
    return `P.IVA ${valore}`;
  },
};
