import { db } from '@/server/db';
import { generaSlug, prossimoOrdinamento, valoreUsatoInRichieste } from './catalogo-comune';

export { TEXTURE_DISPONIBILI } from '@/lib/catalogo-costanti';

export async function elencoFiniture(tenantId: string) {
  return db.finitura.findMany({
    where: { tenantId },
    orderBy: [{ categoria: 'asc' }, { ordinamento: 'asc' }],
  });
}

/** Categorie realmente in uso oggi, non un elenco scritto nel codice - il
 * form di creazione le propone come scelta rapida, mai come vincolo. */
export async function categorieEsistenti(tenantId: string): Promise<string[]> {
  const finiture = await db.finitura.findMany({ where: { tenantId } });
  return [...new Set(finiture.map((f) => f.categoria))].sort();
}

export interface DatiFinitura {
  categoria: string;
  nome: string;
  descrizione?: string | null;
  coloreHex: string;
  texture: string;
  ordinamento?: number;
}

export async function creaFinitura(tenantId: string, dati: DatiFinitura) {
  const slugBase = generaSlug(dati.nome);
  if (!slugBase) throw new Error('Il nome deve contenere almeno un carattere alfanumerico.');

  let slug = slugBase;
  let tentativo = 1;
  while (await db.finitura.findUnique({ where: { tenantId_slug: { tenantId, slug } } })) {
    tentativo++;
    slug = `${slugBase}_${tentativo}`;
  }

  let ordinamento = dati.ordinamento;
  if (ordinamento === undefined) {
    const esistentiStessaCategoria = await db.finitura.findMany({
      where: { tenantId, categoria: dati.categoria },
    });
    ordinamento = prossimoOrdinamento(esistentiStessaCategoria);
  }

  return db.finitura.create({
    data: {
      tenantId,
      slug,
      categoria: dati.categoria,
      nome: dati.nome,
      descrizione: dati.descrizione ?? null,
      coloreHex: dati.coloreHex,
      texture: dati.texture,
      ordinamento,
    },
  });
}

/** Lo slug NON viene mai rigenerato qui, anche se il nome cambia - deve
 * restare stabile per sempre, dato che le Regole di pricing lo referenziano
 * direttamente (v. ADR-0006, Incremento 1). */
export async function aggiornaFinitura(tenantId: string, id: string, dati: Partial<DatiFinitura>) {
  const finitura = await db.finitura.findUnique({ where: { id } });
  if (!finitura || finitura.tenantId !== tenantId) throw new Error('Finitura non trovata.');
  return db.finitura.update({ where: { id }, data: dati });
}

export async function impostaAttivaFinitura(tenantId: string, id: string, attiva: boolean) {
  const finitura = await db.finitura.findUnique({ where: { id } });
  if (!finitura || finitura.tenantId !== tenantId) throw new Error('Finitura non trovata.');
  return db.finitura.update({ where: { id }, data: { attiva } });
}

/**
 * Cancellazione fisica, permessa solo se la finitura non è mai stata usata
 * in nessuna richiesta - altrimenti lancia un errore esplicito che guida
 * verso la disattivazione, senza intaccare lo storico.
 */
export async function eliminaFinitura(tenantId: string, id: string) {
  const finitura = await db.finitura.findUnique({ where: { id } });
  if (!finitura || finitura.tenantId !== tenantId) throw new Error('Finitura non trovata.');

  const inUso = await valoreUsatoInRichieste(tenantId, finitura.slug);
  if (inUso) {
    throw new Error(
      'Questa finitura è già stata usata in una o più richieste: non può essere cancellata, per non alterare lo storico. Usa "Disattiva" per nasconderla dalle nuove scelte, mantenendo intatte quelle passate.',
    );
  }

  await db.finitura.delete({ where: { id } });
}
