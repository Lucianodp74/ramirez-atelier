import { db } from '@/server/db';
import type { TipoProgettoConfigurazione } from './tipo-progetto-schema';

/**
 * Fonti dati dinamiche disponibili per i campi select del wizard. Aggiungere una
 * nuova fonte significa aggiungere una voce qui, mai toccare il wizard o
 * CampoRenderer (che resta ignaro di come le opzioni sono state ottenute).
 */
async function risolviOpzioniPerFonte(
  tenantId: string,
  fonte: string,
): Promise<
  {
    valore: string;
    etichetta: string;
    descrizione?: string;
    coloreHex?: string;
    texture?: string;
    categoria?: string;
  }[]
> {
  if (fonte === 'fascia_budget') {
    const fasce = await db.fasciaBudget.findMany({
      where: { tenantId, attiva: true },
      orderBy: { ordinamento: 'asc' },
    });
    return fasce.map((f) => ({ valore: f.id, etichetta: f.nome }));
  }
  if (fonte === 'finitura') {
    const finiture = await db.finitura.findMany({
      where: { tenantId, attiva: true },
      orderBy: [{ categoria: 'asc' }, { ordinamento: 'asc' }],
    });
    return finiture.map((f) => ({
      valore: f.slug,
      etichetta: f.nome,
      descrizione: f.descrizione ?? undefined,
      coloreHex: f.coloreHex,
      texture: f.texture,
      categoria: f.categoria,
    }));
  }
  if (fonte === 'ferramenta') {
    const righe = await db.ferramenta.findMany({
      where: { tenantId, attiva: true },
      orderBy: [{ categoria: 'asc' }, { ordinamento: 'asc' }],
    });
    return righe.map((r) => ({
      valore: r.slug,
      etichetta: r.nome,
      descrizione: r.descrizione ?? undefined,
      categoria: r.categoria,
    }));
  }
  if (fonte === 'accessorio') {
    const righe = await db.accessorio.findMany({
      where: { tenantId, attiva: true },
      orderBy: [{ categoria: 'asc' }, { ordinamento: 'asc' }],
    });
    return righe.map((r) => ({
      valore: r.slug,
      etichetta: r.nome,
      descrizione: r.descrizione ?? undefined,
      categoria: r.categoria,
    }));
  }
  throw new Error(`Fonte di opzioni dinamiche sconosciuta: "${fonte}"`);
}

/**
 * Ritorna una copia della configurazione con le `opzioni` dei campi che dichiarano
 * `fonteOpzioni` risolte dai dati correnti. Va chiamata una sola volta, lato server,
 * prima di inviare la configurazione al client (v. azioni.ts:iniziaORecuperaBozza) -
 * il wizard riceve sempre opzioni già pronte, statiche o dinamiche che siano.
 */
export async function risolviConfigurazioneDinamica(
  tenantId: string,
  configurazione: TipoProgettoConfigurazione,
): Promise<TipoProgettoConfigurazione> {
  const stepRisolti = await Promise.all(
    configurazione.step.map(async (step) => ({
      ...step,
      campi: await Promise.all(
        step.campi.map(async (campo) => {
          if (!campo.fonteOpzioni) return campo;
          const opzioni = await risolviOpzioniPerFonte(tenantId, campo.fonteOpzioni);
          return { ...campo, opzioni };
        }),
      ),
    })),
  );

  return { step: stepRisolti };
}
