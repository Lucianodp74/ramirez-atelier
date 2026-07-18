import Link from 'next/link';
import { listaRichieste, type FiltriRichieste } from '@/server/services/richieste-service';
import { elencoFasceBudgetAttive } from '@/server/services/fasce-budget-service';
import { richiediContesto } from '@/server/identity/contesto';
import { db } from '@/server/db';
import { StatoBadge } from '@/components/admin/StatoBadge';
import { ETICHETTA_STATO, STATI_OPERATIVI } from '@/lib/workflow';
import { ETICHETTA_LIVELLO_COMPLETEZZA } from '@/lib/tipo-progetto-schema';

export const dynamic = 'force-dynamic';

interface ParamsRicerca {
  ricerca?: string;
  stato?: string;
  tipoProgettoId?: string;
  livelloCompletezza?: string;
  fasciaBudgetId?: string;
  dataDa?: string;
  dataA?: string;
  pagina?: string;
  ordinaPer?: string;
  direzione?: string;
}

export default async function ElencoRichiestePage({
  searchParams,
}: {
  searchParams: Promise<ParamsRicerca>;
}) {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
  const sp = await searchParams;

  const filtri: FiltriRichieste = {
    ricerca: sp.ricerca || undefined,
    stato: (sp.stato as FiltriRichieste['stato']) || undefined,
    tipoProgettoId: sp.tipoProgettoId || undefined,
    livelloCompletezza:
      (sp.livelloCompletezza as FiltriRichieste['livelloCompletezza']) || undefined,
    fasciaBudgetId: sp.fasciaBudgetId || undefined,
    dataDa: sp.dataDa || undefined,
    dataA: sp.dataA || undefined,
    pagina: sp.pagina ? Number(sp.pagina) : 1,
    perPagina: 20,
    ordinaPer: (sp.ordinaPer as FiltriRichieste['ordinaPer']) || 'createdAt',
    direzione: (sp.direzione as FiltriRichieste['direzione']) || 'desc',
  };

  const [{ richieste, totale, pagina, totalePagine }, tipiProgetto, fasceBudget] =
    await Promise.all([
      listaRichieste(contesto.tenantId, filtri),
      db.tipoProgetto.findMany({
        where: { tenantId: contesto.tenantId },
        orderBy: { ordinamento: 'asc' },
      }),
      elencoFasceBudgetAttive(contesto.tenantId),
    ]);

  // Preserva i filtri correnti quando si cambia pagina/ordinamento (link costruiti lato server)
  function costruisciQuery(sovrascrizioni: Record<string, string | undefined>) {
    const parametri = new URLSearchParams();
    const base = { ...sp, ...sovrascrizioni };
    for (const [chiave, valore] of Object.entries(base)) {
      if (valore) parametri.set(chiave, String(valore));
    }
    return `?${parametri.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Tutte le richieste</h1>
        <p className="text-sm text-muted-foreground">{totale} risultati</p>
      </div>

      {/* Filtri - form GET nativo, funziona senza JavaScript */}
      <form className="mb-6 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-3 lg:grid-cols-6">
        <input
          type="text"
          name="ricerca"
          placeholder="Cerca cliente o email…"
          defaultValue={sp.ricerca}
          className="col-span-2 rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
        />
        <select
          name="stato"
          defaultValue={sp.stato ?? ''}
          className="rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
        >
          <option value="">Tutti gli stati</option>
          {STATI_OPERATIVI.map((s) => (
            <option key={s} value={s}>
              {ETICHETTA_STATO[s]}
            </option>
          ))}
        </select>
        <select
          name="tipoProgettoId"
          defaultValue={sp.tipoProgettoId ?? ''}
          className="rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
        >
          <option value="">Tutti i progetti</option>
          {tipiProgetto.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
        <select
          name="livelloCompletezza"
          defaultValue={sp.livelloCompletezza ?? ''}
          className="rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
        >
          <option value="">Ogni completezza</option>
          {Object.entries(ETICHETTA_LIVELLO_COMPLETEZZA).map(([valore, etichetta]) => (
            <option key={valore} value={valore}>
              {etichetta}
            </option>
          ))}
        </select>
        <select
          name="fasciaBudgetId"
          defaultValue={sp.fasciaBudgetId ?? ''}
          className="rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
        >
          <option value="">Ogni fascia di budget</option>
          {fasceBudget.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
        <div className="col-span-full flex items-center gap-3">
          <label className="text-xs text-muted-foreground">
            Da
            <input
              type="date"
              name="dataDa"
              defaultValue={sp.dataDa}
              className="ml-2 rounded-md border border-input bg-secondary/40 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            A
            <input
              type="date"
              name="dataA"
              defaultValue={sp.dataA}
              className="ml-2 rounded-md border border-input bg-secondary/40 px-2 py-1 text-sm"
            />
          </label>
          <button
            type="submit"
            className="ml-auto rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Filtra
          </button>
          <Link href="/admin/richieste" className="text-sm text-muted-foreground hover:underline">
            Azzera
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-normal">
                <Link
                  href={costruisciQuery({
                    ordinaPer: 'clienteNome',
                    direzione: filtri.direzione === 'asc' ? 'desc' : 'asc',
                  })}
                  className="hover:underline"
                >
                  Cliente
                </Link>
              </th>
              <th className="px-4 py-3 font-normal">Progetto</th>
              <th className="px-4 py-3 font-normal">
                <Link
                  href={costruisciQuery({
                    ordinaPer: 'indiceCompletezza',
                    direzione: filtri.direzione === 'asc' ? 'desc' : 'asc',
                  })}
                  className="hover:underline"
                >
                  Completezza
                </Link>
              </th>
              <th className="px-4 py-3 font-normal">Stato</th>
              <th className="px-4 py-3 font-normal">Priorità</th>
              <th className="px-4 py-3 font-normal">
                <Link
                  href={costruisciQuery({
                    ordinaPer: 'createdAt',
                    direzione: filtri.direzione === 'asc' ? 'desc' : 'asc',
                  })}
                  className="hover:underline"
                >
                  Ricevuta
                </Link>
              </th>
            </tr>
          </thead>
          <tbody>
            {richieste.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-secondary/20">
                <td className="px-4 py-3">
                  <Link href={`/admin/richieste/${r.id}`} className="hover:underline">
                    {r.clienteNome ?? '—'}
                  </Link>
                  <div className="text-xs text-muted-foreground">{r.clienteEmail}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.tipoProgetto?.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.indiceCompletezza}%</td>
                <td className="px-4 py-3">
                  <StatoBadge stato={r.stato} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {r.prioritaCommerciale ?? '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString('it-IT')}
                </td>
              </tr>
            ))}
            {richieste.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nessuna richiesta corrisponde ai filtri selezionati.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalePagine > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: totalePagine }, (_, i) => i + 1).map((numeroPagina) => (
            <Link
              key={numeroPagina}
              href={costruisciQuery({ pagina: String(numeroPagina) })}
              className={`rounded-md px-3 py-1 text-sm ${numeroPagina === pagina ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-secondary/40'}`}
            >
              {numeroPagina}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
