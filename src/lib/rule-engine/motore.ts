import { db } from '@/server/db';
import { Prisma } from '@prisma/client';
import { valuta } from './valutatore';
import { eseguiAzione } from './registro-azioni';
import { NodoCondizioneSchema, ElencoAzioniSchema, type Fatti } from './tipi';

export interface RisultatoValutazioneRegola {
  regolaId: string;
  nome: string;
  esito: 'CONDIZIONE_VERA' | 'CONDIZIONE_FALSA' | 'ERRORE';
  erroreMessaggio?: string;
}

/**
 * Recupera ed esegue le regole attive per un dato contesto, contro i fatti
 * forniti, nell'ordine di priorità dichiarato (decrescente). Ogni valutazione -
 * che la condizione risulti vera o falsa, e anche in caso di errore - genera una
 * riga di tracciabilità in EsecuzioneRegola (Requisito esplicito: quale regola,
 * quando, su quale entità, quale risultato).
 *
 * Risoluzione dei conflitti (risolta in questo incremento, con il secondo
 * consumatore reale - pricing - che la rendeva necessaria, come anticipato):
 * `fermaAlPrimoMatch` (default true) interrompe la valutazione non appena la
 * PRIMA regola con condizione vera ha eseguito le proprie azioni - dato che le
 * regole sono valutate in ordine di priorità decrescente, questo equivale a
 * "vince la regola più specifica/prioritaria che matcha", la semantica corretta
 * per decisioni a esito singolo (priorità commerciale, fascia di prezzo). Un
 * futuro consumatore "di tipo notifica" (dove più regole devono poter reagire
 * allo stesso evento) potrà impostarlo esplicitamente a `false`.
 */
export async function eseguiRegolePerContesto(
  tenantId: string,
  contesto: string,
  entitaTipo: string,
  entitaId: string,
  fatti: Fatti,
  opzioni: { fermaAlPrimoMatch?: boolean } = {},
): Promise<RisultatoValutazioneRegola[]> {
  const fermaAlPrimoMatch = opzioni.fermaAlPrimoMatch ?? true;
  const ora = new Date();

  const regoleAttive = await db.regola.findMany({
    where: { tenantId, contesto, stato: 'ATTIVA' },
    orderBy: { priorita: 'desc' },
  });

  const risultati: RisultatoValutazioneRegola[] = [];

  for (const regola of regoleAttive) {
    if (regola.validoDa && new Date(regola.validoDa) > ora) continue;
    if (regola.validoA && new Date(regola.validoA) < ora) continue;

    let esito: 'CONDIZIONE_VERA' | 'CONDIZIONE_FALSA' | 'ERRORE';
    let risultatoJson: Record<string, unknown> | null = null;
    let erroreMessaggio: string | null = null;

    try {
      const condizioni = NodoCondizioneSchema.parse(regola.condizioni);
      const condizioneVera = valuta(condizioni, fatti);

      if (condizioneVera) {
        esito = 'CONDIZIONE_VERA';
        const azioni = ElencoAzioniSchema.parse(regola.azioni);
        const azioniEseguite: Array<{ azione: string; risultato: unknown }> = [];
        for (const azione of azioni) {
          const risultato = await eseguiAzione(azione, fatti, {
            entitaTipo,
            entitaId,
            regolaId: regola.id,
          });
          azioniEseguite.push({ azione: azione.tipo, risultato: risultato ?? null });
        }
        risultatoJson = { azioniEseguite };
      } else {
        esito = 'CONDIZIONE_FALSA';
      }
    } catch (e) {
      esito = 'ERRORE';
      erroreMessaggio =
        e instanceof Error ? e.message : 'Errore sconosciuto durante la valutazione.';
    }

    await db.esecuzioneRegola.create({
      data: {
        regolaId: regola.id,
        entitaTipo,
        entitaId,
        esito,
        risultatoJson: (risultatoJson as Prisma.InputJsonValue | null) ?? Prisma.JsonNull,
        erroreMessaggio,
      },
    });

    risultati.push({
      regolaId: regola.id,
      nome: regola.nome,
      esito,
      erroreMessaggio: erroreMessaggio ?? undefined,
    });

    if (fermaAlPrimoMatch && esito === 'CONDIZIONE_VERA') break;
  }

  return risultati;
}
