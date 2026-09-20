import { db } from '@/server/db';
import { validaInputModuli } from '@/lib/preventivatore/validazione-moduli';
import type { ModuloConfigurato } from '@/lib/preventivatore/moduli';

/**
 * COMPOSIZIONI / CATALOGO V1 - CRUD del catalogo di progetti preimpostati
 * che alimentano il Preventivatore Modulare V2/V3 esistente.
 *
 * Ricalcato deliberatamente sul pattern già collaudato di
 * `variante-preimpostata-service.ts` (stessa forma di ownership check,
 * stesso calcolo di `ordinamento`, stessa cancellazione libera). Nessuna
 * logica di prezzo qui dentro: `moduli` viene solo validato con le stesse
 * funzioni già usate da `azioni.ts` (mai duplicate) e restituito per valore,
 * mai referenziato per id nel calcolo del Preventivatore.
 */

export interface DatiProgettoPreimpostato {
  nome: string;
  categoria: string;
  descrizione?: string | null;
  immagine?: string | null;
  moduli: ModuloConfigurato[];
  ordinamento?: number;
}

function validaDatiBase(dati: Pick<DatiProgettoPreimpostato, 'nome' | 'categoria' | 'moduli'>) {
  const nome = dati.nome?.trim();
  const categoria = dati.categoria?.trim();
  if (!nome || nome.length < 2 || nome.length > 120) throw new Error('Inserisci un nome valido per il progetto preimpostato.');
  if (!categoria || categoria.length > 60) throw new Error('Inserisci una categoria valida.');
  // Riusa esattamente le regole già applicate dal Preventivatore: nessuna
  // regola nuova, nessuna duplicazione di validaModulo/isModuloConfigurato.
  validaInputModuli(dati.moduli);
}

/** Tutti i progetti preimpostati di un tenant, incluse le non pubblicate - uso admin. */
export async function elencoProgettiPreimpostati(tenantId: string) {
  return db.progettoPreimpostato.findMany({
    where: { tenantId },
    orderBy: { ordinamento: 'asc' },
  });
}

/** Solo i progetti pubblicati, nell'ordine dichiarato - uso pubblico (galleria). */
export async function progettiPreimpostatiPubblicati(tenantId: string) {
  return db.progettoPreimpostato.findMany({
    where: { tenantId, pubblicata: true },
    orderBy: { ordinamento: 'asc' },
  });
}

/**
 * Recupera un singolo progetto preimpostato per uso pubblico: tenant-scoped,
 * verificato come pubblicato, e con i `moduli` rivalidati con le stesse
 * funzioni del Preventivatore prima di essere restituiti (mai fidarsi
 * ciecamente del JSON salvato, anche se già validato in scrittura).
 */
export async function recuperaProgettoPreimpostatoPubblicato(tenantId: string, id: string): Promise<{
  id: string;
  nome: string;
  categoria: string;
  descrizione: string | null;
  immagine: string | null;
  moduli: ModuloConfigurato[];
} | null> {
  const progetto = await db.progettoPreimpostato.findFirst({
    where: { id, tenantId, pubblicata: true },
  });
  if (!progetto) return null;

  const moduli = progetto.moduli;
  try {
    validaInputModuli(moduli);
  } catch {
    // Un progetto preimpostato con moduli non più validi (es. un modulo
    // deprecato dal catalogo tecnico nel frattempo) non deve rompere la
    // pagina pubblica: viene semplicemente trattato come non disponibile.
    return null;
  }

  return {
    id: progetto.id,
    nome: progetto.nome,
    categoria: progetto.categoria,
    descrizione: progetto.descrizione,
    immagine: progetto.immagine,
    moduli,
  };
}

export async function creaProgettoPreimpostato(tenantId: string, dati: DatiProgettoPreimpostato) {
  validaDatiBase(dati);

  let ordinamento = dati.ordinamento;
  if (ordinamento === undefined) {
    const esistenti = await db.progettoPreimpostato.findMany({ where: { tenantId } });
    ordinamento = esistenti.length > 0 ? Math.max(...esistenti.map((p) => p.ordinamento)) + 1 : 0;
  }

  return db.progettoPreimpostato.create({
    data: {
      tenantId,
      nome: dati.nome.trim(),
      categoria: dati.categoria.trim(),
      descrizione: dati.descrizione?.trim() || null,
      immagine: dati.immagine?.trim() || null,
      moduli: dati.moduli,
      ordinamento,
    },
  });
}

export async function aggiornaProgettoPreimpostato(
  tenantId: string,
  id: string,
  dati: Partial<DatiProgettoPreimpostato>,
) {
  const progetto = await db.progettoPreimpostato.findUnique({ where: { id } });
  if (!progetto || progetto.tenantId !== tenantId) throw new Error('Progetto preimpostato non trovato.');

  const successivo = {
    nome: dati.nome ?? progetto.nome,
    categoria: dati.categoria ?? progetto.categoria,
    moduli: (dati.moduli ?? progetto.moduli) as ModuloConfigurato[],
  };
  validaDatiBase(successivo);

  return db.progettoPreimpostato.update({
    where: { id },
    data: {
      ...(dati.nome !== undefined ? { nome: dati.nome.trim() } : {}),
      ...(dati.categoria !== undefined ? { categoria: dati.categoria.trim() } : {}),
      ...(dati.descrizione !== undefined ? { descrizione: dati.descrizione?.trim() || null } : {}),
      ...(dati.immagine !== undefined ? { immagine: dati.immagine?.trim() || null } : {}),
      ...(dati.moduli !== undefined ? { moduli: dati.moduli } : {}),
      ...(dati.ordinamento !== undefined ? { ordinamento: dati.ordinamento } : {}),
    },
  });
}

export async function impostaPubblicazioneProgettoPreimpostato(tenantId: string, id: string, pubblicata: boolean) {
  const progetto = await db.progettoPreimpostato.findUnique({ where: { id } });
  if (!progetto || progetto.tenantId !== tenantId) throw new Error('Progetto preimpostato non trovato.');
  return db.progettoPreimpostato.update({ where: { id }, data: { pubblicata } });
}

/**
 * Cancellazione libera, senza controllo d'uso: come VariantePreimpostata, un
 * progetto preimpostato non è mai referenziato per id dal calcolo o dal
 * salvataggio di una richiesta - i suoi moduli vengono copiati per valore
 * nel Preventivatore al momento della selezione, non referenziati.
 * L'eventuale traccia `origineProgettoPreimpostatoId` in
 * `datiEstensione.preventivatoreModulare` resta comunque leggibile anche se
 * il progetto viene poi cancellato.
 */
export async function eliminaProgettoPreimpostato(tenantId: string, id: string) {
  const progetto = await db.progettoPreimpostato.findUnique({ where: { id } });
  if (!progetto || progetto.tenantId !== tenantId) throw new Error('Progetto preimpostato non trovato.');
  await db.progettoPreimpostato.delete({ where: { id } });
}
