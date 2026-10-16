/**
 * CONVENZIONE MONETARIA DELLA BOM - unica per chi crea, riepiloga, conferma
 * o copia una distinta:
 *
 *  - totale di riga = quantità × costo unitario, arrotondato al centesimo
 *    (arrotondamento commerciale: la metà va verso l'alto);
 *  - totale della BOM = somma dei totali di riga già arrotondati.
 *
 * Quantità e costo unitario sono quelli salvati (DECIMAL(12,3) e
 * DECIMAL(12,2)): il prodotto si calcola in interi, millesimi × centesimi,
 * così casi come 33,01 × 2,50 = 82,525 non diventano 82,52 per un errore di
 * virgola mobile.
 */

/** Totale di riga in centesimi, secondo la convenzione della BOM. */
export function totaleRigaBomInCentesimi(quantita: number, costoUnitario: number): number {
  const millesimi = Math.round(quantita * 1000);
  const centesimi = Math.round(costoUnitario * 100);
  // Prodotto in centomillesimi di euro: 1000 unità fanno un centesimo.
  const prodotto = millesimi * centesimi;
  // Valori non numerici: nessun totale, come prima; chi chiama li scarta.
  if (!Number.isFinite(prodotto)) return Number.NaN;
  if (Number.isSafeInteger(prodotto)) {
    return Math.sign(prodotto) * Math.floor((Math.abs(prodotto) + 500) / 1000);
  }
  const esatto = BigInt(millesimi) * BigInt(centesimi);
  const assoluto = esatto < BigInt(0) ? -esatto : esatto;
  const arrotondato = Number((assoluto + BigInt(500)) / BigInt(1000));
  return esatto < BigInt(0) ? -arrotondato : arrotondato;
}

/** Totale di riga in euro, arrotondato al centesimo. */
export function totaleRigaBom(quantita: number, costoUnitario: number): number {
  return totaleRigaBomInCentesimi(quantita, costoUnitario) / 100;
}

/** Totale della BOM in euro: somma dei totali di riga arrotondati. */
export function totaleBom(righe: Iterable<{ quantita: number; costoUnitario: number }>): number {
  let centesimi = 0;
  for (const riga of righe)
    centesimi += totaleRigaBomInCentesimi(riga.quantita, riga.costoUnitario);
  return centesimi / 100;
}
