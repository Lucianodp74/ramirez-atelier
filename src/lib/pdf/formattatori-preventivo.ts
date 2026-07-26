/**
 * Formattatori di presentazione per il preventivo - separati dal layout
 * (PreventivoDocument.tsx) perché qualunque futuro canale (email, snapshot,
 * un riepilogo testuale) deve poter mostrare lo stesso importo o la stessa
 * data con le stesse regole, senza duplicare la logica o importare un
 * componente React per prendere in prestito una funzione.
 */

export function formattaEuro(valore: number): string {
  return valore.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formattaData(data: Date): string {
  return data.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function dataScadenza(dataEmissione: Date, giorni: number): string {
  const scadenza = new Date(dataEmissione);
  scadenza.setDate(scadenza.getDate() + giorni);
  return formattaData(scadenza);
}
