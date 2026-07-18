import { db } from '@/server/db';
import { transizioneAmmessa } from '@/lib/workflow';
import { STATI_OPERATIVI } from '@/lib/workflow';
import type { StatoRichiesta } from '@prisma/client';

/**
 * Vincolo esplicito (Incremento 5): nessuna funzione di questo servizio opera
 * senza un tenantId. Non è un parametro opzionale con default - è sempre il
 * primo argomento, e ogni query lo include nella clausola WHERE. Una richiesta
 * di un altro Tenant restituisce "non trovata", mai un errore che ne riveli
 * l'esistenza (isolamento tra tenant, richiesto esplicitamente).
 */

export interface FiltriRichieste {
  ricerca?: string;
  stato?: StatoRichiesta;
  tipoProgettoId?: string;
  livelloCompletezza?: 'appena_iniziata' | 'in_corso' | 'quasi_completa' | 'completa';
  fasciaBudgetId?: string;
  dataDa?: string;
  dataA?: string;
  pagina?: number;
  perPagina?: number;
  ordinaPer?: 'createdAt' | 'indiceCompletezza' | 'clienteNome';
  direzione?: 'asc' | 'desc';
}

const FASCE_COMPLETEZZA: Record<
  NonNullable<FiltriRichieste['livelloCompletezza']>,
  { gte: number; lte: number }
> = {
  appena_iniziata: { gte: 0, lte: 24 },
  in_corso: { gte: 25, lte: 69 },
  quasi_completa: { gte: 70, lte: 99 },
  completa: { gte: 100, lte: 100 },
};

/** Isolata in una funzione propria per essere testabile senza dover invocare il database. */
export function costruisciFiltroRichieste(tenantId: string, filtri: FiltriRichieste) {
  const where: Record<string, unknown> = {
    tenantId,
    stato: filtri.stato ?? { in: STATI_OPERATIVI },
  };

  if (filtri.tipoProgettoId) where.tipoProgettoId = filtri.tipoProgettoId;
  if (filtri.livelloCompletezza)
    where.indiceCompletezza = FASCE_COMPLETEZZA[filtri.livelloCompletezza];

  if (filtri.dataDa || filtri.dataA) {
    where.createdAt = {
      ...(filtri.dataDa ? { gte: new Date(filtri.dataDa) } : {}),
      ...(filtri.dataA ? { lte: new Date(filtri.dataA) } : {}),
    };
  }

  if (filtri.fasciaBudgetId) where.fasciaBudgetId = filtri.fasciaBudgetId;

  if (filtri.ricerca) {
    where.OR = [
      { clienteNome: { contains: filtri.ricerca, mode: 'insensitive' } },
      { clienteEmail: { contains: filtri.ricerca, mode: 'insensitive' } },
    ];
  }

  return where;
}

export async function listaRichieste(tenantId: string, filtri: FiltriRichieste) {
  const pagina = filtri.pagina ?? 1;
  const perPagina = filtri.perPagina ?? 20;
  const where = costruisciFiltroRichieste(tenantId, filtri);
  const ordinaPer = filtri.ordinaPer ?? 'createdAt';
  const direzione = filtri.direzione ?? 'desc';

  const [richieste, totale] = await Promise.all([
    db.richiestaProgetto.findMany({
      where,
      orderBy: { [ordinaPer]: direzione },
      skip: (pagina - 1) * perPagina,
      take: perPagina,
      include: { tipoProgetto: true, fasciaBudget: true },
    }),
    db.richiestaProgetto.count({ where }),
  ]);

  return {
    richieste,
    totale,
    pagina,
    perPagina,
    totalePagine: Math.max(1, Math.ceil(totale / perPagina)),
  };
}

/** Isolamento tra tenant: una richiesta di un altro Tenant risulta "non trovata", non un errore diverso. */
export async function dettaglioRichiesta(tenantId: string, id: string) {
  const richiesta = await db.richiestaProgetto.findUnique({
    where: { id },
    include: {
      tipoProgetto: true,
      documenti: true,
      eventi: true,
      commenti: true,
      fasciaBudget: true,
    },
  });
  if (!richiesta || richiesta.tenantId !== tenantId) return null;
  return richiesta;
}

export type EsitoCambioStato =
  | { successo: true; richiesta: NonNullable<Awaited<ReturnType<typeof dettaglioRichiesta>>> }
  | { successo: false; errore: string };

export async function cambiaStato(
  tenantId: string,
  id: string,
  nuovoStato: StatoRichiesta,
): Promise<EsitoCambioStato> {
  const richiesta = await db.richiestaProgetto.findUnique({ where: { id } });
  if (!richiesta || richiesta.tenantId !== tenantId)
    return { successo: false, errore: 'Richiesta non trovata.' };

  if (!transizioneAmmessa(richiesta.stato, nuovoStato)) {
    return {
      successo: false,
      errore: `Non è possibile passare da "${richiesta.stato}" a "${nuovoStato}".`,
    };
  }

  const aggiornata = await db.richiestaProgetto.update({
    where: { id },
    data: { stato: nuovoStato },
    include: {
      tipoProgetto: true,
      documenti: true,
      eventi: true,
      commenti: true,
      fasciaBudget: true,
    },
  });

  await db.eventoAttivita.create({
    data: {
      richiestaId: id,
      tipo: 'STATO_MODIFICATO',
      descrizione: `Stato cambiato da "${richiesta.stato}" a "${nuovoStato}"`,
      metadatiJson: { statoPrecedente: richiesta.stato, statoNuovo: nuovoStato },
      attore: 'TITOLARE',
    },
  });

  return { successo: true, richiesta: aggiornata };
}

export async function aggiungiCommento(
  tenantId: string,
  id: string,
  testo: string,
  autore = 'Titolare',
) {
  const richiesta = await db.richiestaProgetto.findUnique({ where: { id } });
  if (!richiesta || richiesta.tenantId !== tenantId) throw new Error('Richiesta non trovata.');
  if (!testo.trim()) throw new Error('Il commento non può essere vuoto.');

  const commento = await db.commentoInterno.create({
    data: { richiestaId: id, testo: testo.trim(), autore },
  });

  await db.eventoAttivita.create({
    data: {
      richiestaId: id,
      tipo: 'COMMENTO_INSERITO',
      descrizione: `Nota interna aggiunta da ${autore}`,
      attore: 'TITOLARE',
    },
  });

  return commento;
}

export interface RiepilogoDashboard {
  conteggiPerStato: Record<StatoRichiesta, number>;
  valoreEconomicoStimato: { min: number; max: number; disponibile: boolean };
  completezzaMedia: number;
  ultimeRichieste: Awaited<ReturnType<typeof listaRichieste>>['richieste'];
}

export async function riepilogoDashboard(tenantId: string): Promise<RiepilogoDashboard> {
  const conteggi = await Promise.all(
    STATI_OPERATIVI.map(
      async (stato) =>
        [stato, await db.richiestaProgetto.count({ where: { tenantId, stato } })] as const,
    ),
  );
  const conteggiPerStato = Object.fromEntries(conteggi) as Record<StatoRichiesta, number>;

  const attive = await db.richiestaProgetto.findMany({
    where: { tenantId, stato: { in: STATI_OPERATIVI } },
  });

  const conFasciaPrezzo = attive.filter(
    (r) => r.fasciaPrezzoMin !== null && r.fasciaPrezzoMax !== null,
  );
  const valoreEconomicoStimato = {
    min: conFasciaPrezzo.reduce((acc, r) => acc + (r.fasciaPrezzoMin ?? 0), 0),
    max: conFasciaPrezzo.reduce((acc, r) => acc + (r.fasciaPrezzoMax ?? 0), 0),
    disponibile: conFasciaPrezzo.length > 0,
  };

  const completezzaMedia =
    attive.length === 0
      ? 0
      : Math.round(attive.reduce((acc, r) => acc + r.indiceCompletezza, 0) / attive.length);

  const { richieste: ultimeRichieste } = await listaRichieste(tenantId, {
    perPagina: 5,
    ordinaPer: 'createdAt',
    direzione: 'desc',
  });

  return { conteggiPerStato, valoreEconomicoStimato, completezzaMedia, ultimeRichieste };
}
