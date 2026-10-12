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
 * Credenziali e riferimenti interni, sostituiti da una stringa vuota:
 *
 *  - `tokenRipresa` è la prova di appartenenza della richiesta. Vive solo nel
 *    cookie httpOnly: se tornasse anche nelle risposte, qualunque script della
 *    pagina potrebbe leggerlo;
 *  - `storageObjectKey` è il percorso interno di un allegato nello storage.
 */
export const CAMPI_SVUOTATI_RICHIESTA = ['tokenRipresa'] as const;
export const CAMPI_SVUOTATI_DOCUMENTO = ['storageObjectKey'] as const;

function svuota<T extends object>(oggetto: T, campi: readonly string[]): T {
  const copia = { ...oggetto } as Record<string, unknown>;
  for (const campo of campi) {
    if (campo in copia) copia[campo] = '';
  }
  return copia as T;
}

/** Copia di un allegato adatta al browser: senza il percorso interno nello storage. */
export function documentoPerCliente<T extends object>(documento: T): T {
  return svuota(documento, CAMPI_SVUOTATI_DOCUMENTO);
}

/**
 * Copia della richiesta adatta a essere restituita da un'azione pubblica.
 * I campi riservati vengono azzerati o svuotati, non rimossi: la forma
 * dell'oggetto resta quella attesa dal wizard, che non li usa. Vale anche per
 * gli allegati inclusi nella richiesta.
 */
export function datiPerCliente<T extends object>(richiesta: T): T {
  const copia = svuota(richiesta, CAMPI_SVUOTATI_RICHIESTA) as Record<string, unknown>;
  for (const campo of CAMPI_RISERVATI_RICHIESTA) {
    if (campo in copia) copia[campo] = null;
  }
  if (Array.isArray(copia.documenti)) {
    copia.documenti = copia.documenti.map((documento) =>
      documento && typeof documento === 'object' ? documentoPerCliente(documento) : documento,
    );
  }
  return copia as T;
}
