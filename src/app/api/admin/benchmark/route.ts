import { NextResponse } from 'next/server';
import {
  ErroreAccessoNegato,
  ErroreNonAutenticato,
  richiediContesto,
} from '@/server/identity/contesto';
import { cercaBenchmarkCosti } from '@/server/services/benchmark-prezzi-service';
import { cercaPrezziListino } from '@/server/services/listino-prezzi-service';

export async function GET(request: Request) {
  try {
    const identity = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
    const params = new URL(request.url).searchParams;
    const query = params.get('q') ?? '';
    const unita = params.get('unita') ?? undefined;

    if (query.trim().length < 2) return NextResponse.json({ suggerimenti: [] });

    const personali = await cercaPrezziListino(identity.tenantId, query);
    if (personali.length > 0) {
      return NextResponse.json({
        suggerimenti: personali.map((riga) => ({
          id: riga.id,
          categoria: riga.categoria,
          codice: riga.codice,
          nome: riga.nome,
          descrizione: riga.descrizione,
          unita: riga.unita,
          prezzoMin: riga.prezzo,
          prezzoMax: riga.prezzo,
          costoConsigliato: riga.prezzo,
          fonte: 'Listino del falegname',
          fonteUrl: '',
          note: 'Prezzo interno del tenant: ha priorità sul benchmark di mercato.',
          origine: 'LISTINO_PERSONALE' as const,
        })),
      });
    }

    const righe = await cercaBenchmarkCosti(identity.tenantId, query, unita);
    return NextResponse.json({
      suggerimenti: righe.map((riga) => ({
        id: riga.id,
        categoria: riga.categoria,
        codice: riga.codice,
        nome: riga.nome,
        descrizione: riga.descrizione,
        unita: riga.unita,
        prezzoMin: riga.prezzoMin,
        prezzoMax: riga.prezzoMax,
        costoConsigliato: Number(((riga.prezzoMin + riga.prezzoMax) / 2).toFixed(2)),
        fonte: riga.fonte,
        fonteUrl: riga.fonteUrl,
        note: riga.note,
        origine: 'BENCHMARK' as const,
      })),
    });
  } catch (error) {
    if (error instanceof ErroreNonAutenticato) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    if (error instanceof ErroreAccessoNegato) return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore ricerca prezzi' },
      { status: 400 },
    );
  }
}
