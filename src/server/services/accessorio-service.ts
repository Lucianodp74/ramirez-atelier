import { db } from '@/server/db';
import { generaSlug, prossimoOrdinamento, valoreUsatoInRichieste } from './catalogo-comune';

export async function elencoAccessori(tenantId: string) {
  return db.accessorio.findMany({
    where: { tenantId },
    orderBy: [{ categoria: 'asc' }, { ordinamento: 'asc' }],
  });
}

export async function categorieAccessorioEsistenti(tenantId: string): Promise<string[]> {
  const righe = await db.accessorio.findMany({ where: { tenantId } });
  return [...new Set(righe.map((f) => f.categoria))].sort();
}

export interface DatiAccessorio {
  categoria: string;
  nome: string;
  descrizione?: string | null;
  ordinamento?: number;
}

export async function creaAccessorio(tenantId: string, dati: DatiAccessorio) {
  const slugBase = generaSlug(dati.nome);
  if (!slugBase) throw new Error('Il nome deve contenere almeno un carattere alfanumerico.');

  let slug = slugBase;
  let tentativo = 1;
  while (await db.accessorio.findUnique({ where: { tenantId_slug: { tenantId, slug } } })) {
    tentativo++;
    slug = `${slugBase}_${tentativo}`;
  }

  let ordinamento = dati.ordinamento;
  if (ordinamento === undefined) {
    const esistentiStessaCategoria = await db.accessorio.findMany({
      where: { tenantId, categoria: dati.categoria },
    });
    ordinamento = prossimoOrdinamento(esistentiStessaCategoria);
  }

  return db.accessorio.create({
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

export async function aggiornaAccessorio(
  tenantId: string,
  id: string,
  dati: Partial<DatiAccessorio>,
) {
  const riga = await db.accessorio.findUnique({ where: { id } });
  if (!riga || riga.tenantId !== tenantId) throw new Error('Accessorio non trovato.');
  return db.accessorio.update({ where: { id }, data: dati });
}

export async function impostaAttivaAccessorio(tenantId: string, id: string, attiva: boolean) {
  const riga = await db.accessorio.findUnique({ where: { id } });
  if (!riga || riga.tenantId !== tenantId) throw new Error('Accessorio non trovato.');
  return db.accessorio.update({ where: { id }, data: { attiva } });
}

export async function eliminaAccessorio(tenantId: string, id: string) {
  const riga = await db.accessorio.findUnique({ where: { id } });
  if (!riga || riga.tenantId !== tenantId) throw new Error('Accessorio non trovato.');

  const inUso = await valoreUsatoInRichieste(tenantId, riga.slug);
  if (inUso) {
    throw new Error(
      'Questo accessorio è già stato usato in una o più richieste: non può essere cancellato, per non alterare lo storico. Usa "Disattiva" per nasconderlo dalle nuove scelte, mantenendo intatte quelle passate.',
    );
  }

  await db.accessorio.delete({ where: { id } });
}
