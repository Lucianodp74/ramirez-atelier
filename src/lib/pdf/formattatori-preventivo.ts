/** Formattatori condivisi per i documenti commerciali. */

export function formattaEuro(valore: number): string {
  return valore.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formattaEuroPreciso(valore: number): string {
  return valore.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formattaData(data: Date): string {
  return data.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function dataScadenza(dataEmissione: Date, giorni: number): string {
  const scadenza = new Date(dataEmissione);
  scadenza.setDate(scadenza.getDate() + giorni);
  return formattaData(scadenza);
}
