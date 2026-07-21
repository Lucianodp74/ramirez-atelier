import { db } from '@/server/db';
import { risolviConfigurazioneDinamica } from '@/lib/configurazione-dinamica';
import { TipoProgettoConfigurazioneSchema } from '@/lib/tipo-progetto-schema';

export interface CampoPersonalizzabile {
  chiave: string;
  etichetta: string;
  opzioni: { valore: string; etichetta: string }[];
}

/**
 * Solo i campi guidati da un catalogo condiviso (materiale, ferramenta,
 * configurazione interna...) hanno senso come parte di uno "stile" - le
 * dimensioni o i contatti del cliente non descrivono uno stile, sarebbe
 * innaturale poterli preimpostare. Riusa lo stesso resolver del wizard
 * pubblico, non ne inventa uno nuovo.
 */
export async function campiPersonalizzabiliPerTipoProgetto(
  tenantId: string,
  tipoProgettoId: string,
): Promise<CampoPersonalizzabile[]> {
  const tipoProgetto = await db.tipoProgetto.findUnique({ where: { id: tipoProgettoId } });
  if (!tipoProgetto) return [];

  const configurazione = TipoProgettoConfigurazioneSchema.parse(tipoProgetto.configurazione);
  const risolta = await risolviConfigurazioneDinamica(tenantId, configurazione);

  const campi: CampoPersonalizzabile[] = [];
  for (const step of risolta.step) {
    for (const campo of step.campi) {
      if (campo.fonteOpzioni && campo.opzioni && campo.opzioni.length > 0) {
        campi.push({
          chiave: campo.chiave,
          etichetta: campo.etichetta,
          opzioni: campo.opzioni.map((o) => ({ valore: o.valore, etichetta: o.etichetta })),
        });
      }
    }
  }
  return campi;
}

export interface DatiVariantePreimpostata {
  tipoProgettoId: string;
  nome: string;
  descrizione?: string | null;
  scelte: Record<string, string>;
  ordinamento?: number;
}

/** Solo le varianti attive di un dato TipoProgetto, nell'ordine dichiarato -
 * usata dal wizard pubblico (mai include quelle disattivate). */
export async function variantiAttivePerTipoProgetto(tenantId: string, tipoProgettoId: string) {
  return db.variantePreimpostata.findMany({
    where: { tenantId, tipoProgettoId, attiva: true },
    orderBy: { ordinamento: 'asc' },
  });
}

/** Tutte le varianti di un TipoProgetto, incluse quelle disattivate - usata
 * dal pannello amministrativo. */
export async function elencoVarianti(tenantId: string, tipoProgettoId: string) {
  return db.variantePreimpostata.findMany({
    where: { tenantId, tipoProgettoId },
    orderBy: { ordinamento: 'asc' },
  });
}

export async function creaVariante(tenantId: string, dati: DatiVariantePreimpostata) {
  let ordinamento = dati.ordinamento;
  if (ordinamento === undefined) {
    const esistenti = await db.variantePreimpostata.findMany({
      where: { tenantId, tipoProgettoId: dati.tipoProgettoId },
    });
    ordinamento = esistenti.length > 0 ? Math.max(...esistenti.map((v) => v.ordinamento)) + 1 : 0;
  }

  return db.variantePreimpostata.create({
    data: {
      tenantId,
      tipoProgettoId: dati.tipoProgettoId,
      nome: dati.nome,
      descrizione: dati.descrizione ?? null,
      scelte: dati.scelte,
      ordinamento,
    },
  });
}

export async function aggiornaVariante(
  tenantId: string,
  id: string,
  dati: Partial<Omit<DatiVariantePreimpostata, 'tipoProgettoId'>>,
) {
  const variante = await db.variantePreimpostata.findUnique({ where: { id } });
  if (!variante || variante.tenantId !== tenantId) throw new Error('Variante non trovata.');
  return db.variantePreimpostata.update({ where: { id }, data: dati });
}

export async function impostaAttivaVariante(tenantId: string, id: string, attiva: boolean) {
  const variante = await db.variantePreimpostata.findUnique({ where: { id } });
  if (!variante || variante.tenantId !== tenantId) throw new Error('Variante non trovata.');
  return db.variantePreimpostata.update({ where: { id }, data: { attiva } });
}

/**
 * Cancellazione libera, senza controllo d'uso: a differenza di una Finitura,
 * una Variante non è mai referenziata direttamente dai valori salvati di una
 * richiesta (le sue "scelte" vengono copiate in datiFormJson al momento della
 * selezione, non referenziate per id) - cancellarla non altera alcuno storico.
 * Il riferimento leggero RichiestaProgetto.variantePreimpostataId resta
 * comunque leggibile anche se la variante viene poi cancellata.
 */
export async function eliminaVariante(tenantId: string, id: string) {
  const variante = await db.variantePreimpostata.findUnique({ where: { id } });
  if (!variante || variante.tenantId !== tenantId) throw new Error('Variante non trovata.');
  await db.variantePreimpostata.delete({ where: { id } });
}
