/**
 * Campi di `RichiestaProgetto` riservati all'area operativa: non devono mai
 * arrivare al browser di un cliente.
 *
 *  - `datiEstensione`: contiene costo di produzione, prezzo falegname e i
 *    preventivi salvati con il loro dettaglio economico;
 *  - `noteInterne`: note del titolare;
 *  - `prioritaCommerciale` e `regolaPrezzoApplicataId`: valutazioni e regole
 *    interne.
 */
export const CAMPI_RISERVATI_RICHIESTA = [
  'datiEstensione',
  'noteInterne',
  'prioritaCommerciale',
  'regolaPrezzoApplicataId',
] as const;

/**
 * Copia della richiesta adatta a essere restituita da un'azione pubblica.
 * I campi riservati vengono azzerati, non rimossi: la forma dell'oggetto
 * resta quella attesa dal wizard, che non li usa.
 */
export function datiPerCliente<T extends object>(richiesta: T): T {
  const copia = { ...richiesta } as Record<string, unknown>;
  for (const campo of CAMPI_RISERVATI_RICHIESTA) {
    if (campo in copia) copia[campo] = null;
  }
  return copia as T;
}
