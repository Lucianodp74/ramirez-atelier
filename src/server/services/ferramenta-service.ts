import { db } from '@/server/db';
import { generaSlug, prossimoOrdinamento, valoreUsatoInRichieste } from './catalogo-comune';

export async function elencoFerramenta(tenantId: string) {
  return db.ferramenta.findMany({
    where: { tenantId },
    orderBy: [{ categoria: 'asc' }, { ordinamento: 'asc' }],
  });
}

export async function categorieFerramentaEsistenti(tenantId: string): Promise<string[]> {
  const righe = await db.ferramenta.findMany({ where: { tenantId } });
  return [...new Set(righe.map((f) => f.categoria))].sort();
}

export interface DatiFerramenta {
  categoria: string;
  nome: string;
  descrizione?: string | null;
  ordinamento?: number;
}

export async function creaFerramenta(tenantId: string, dati: DatiFerramenta) {
  const slugBase = generaSlug(dati.nome);
  if (!slugBase) throw new Error('Il nome deve contenere almeno un carattere alfanumerico.');

  let slug = slugBase;
  let tentativo = 1;
  while (await db.ferramenta.findUnique({ where: { tenantId_slug: { tenantId, slug } } })) {
    tentativo++;
    slug = `${slugBase}_${tentativo}`;
  }

  let ordinamento = dati.ordinamento;
  if (ordinamento === undefined) {
    const esistentiStessaCategoria = await db.ferramenta.findMany({
      where: { tenantId, categoria: dati.categoria },
    });
    ordinamento = prossimoOrdinamento(esistentiStessaCategoria);
  }

  return db.ferramenta.create({
    data: {
      tenantId,
      slug,
      categoria: dati.categoria,
      nome: dati.nome,
      descrizione: dati.descrizione ?? null,
      ordinamento,
    },
  });
}

/** Lo slug NON viene mai rigenerato - stessa disciplina di Finitura. */
export async function aggiornaFerramenta(
  tenantId: string,
  id: string,
  dati: Partial<DatiFerramenta>,
) {
  const riga = await db.ferramenta.findUnique({ where: { id } });
  if (!riga || riga.tenantId !== tenantId) throw new Error('Ferramenta non trovata.');
  return db.ferramenta.update({ where: { id }, data: dati });
}

export async function impostaAttivaFerramenta(tenantId: string, id: string, attiva: boolean) {
  const riga = await db.ferramenta.findUnique({ where: { id } });
  if (!riga || riga.tenantId !== tenantId) throw new Error('Ferramenta non trovata.');
  return db.ferramenta.update({ where: { id }, data: { attiva } });
}

export async function eliminaFerramenta(tenantId: string, id: string) {
  const riga = await db.ferramenta.findUnique({ where: { id } });
  if (!riga || riga.tenantId !== tenantId) throw new Error('Ferramenta non trovata.');

  const inUso = await valoreUsatoInRichieste(tenantId, riga.slug);
  if (inUso) {
    throw new Error(
      'Questa ferramenta è già stata usata in una o più richieste: non può essere cancellata, per non alterare lo storico. Usa "Disattiva" per nasconderla dalle nuove scelte, mantenendo intatte quelle passate.',
    );
  }

  await db.ferramenta.delete({ where: { id } });
}
