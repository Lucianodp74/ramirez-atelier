import Link from 'next/link';
import { richiediContesto } from '@/server/identity/contesto';
import { elencoBenchmarkPrezzi } from '@/server/services/benchmark-prezzi-service';

export const dynamic = 'force-dynamic';

function euro(min: number, max: number, unita: string) {
  const formatter = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  });
  const valore =
    min === max ? formatter.format(min) : `${formatter.format(min)} – ${formatter.format(max)}`;
  return `${valore} / ${unita}`;
}

export default async function BenchmarkPrezziPage() {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });
  const righe = await elencoBenchmarkPrezzi(contesto.tenantId);
  const costi = righe.filter((r) => r.tipo === 'COSTO');
  const prezzi = righe.filter((r) => r.tipo === 'PREZZO_VENDITA');

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link href="/admin/catalogo" className="text-sm text-muted-foreground hover:underline">
        ← Catalogo Tecnico
      </Link>
      <div className="mb-8 mt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Listino benchmark</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Riferimenti di mercato raccolti da fonti pubbliche. I valori sono indicativi e servono per
          calibrare la BOM: non sostituiscono i costi reali dei tuoi fornitori e non sono prezzi
          commerciali automatici.
        </p>
      </div>

      <section className="mb-10 rounded-lg border bg-amber-50/50 p-4 text-sm text-amber-950">
        <strong>Regola di utilizzo:</strong> le voci <strong>COSTO</strong> possono essere usate come
        punto di partenza per il costo BOM; le voci <strong>PREZZO_VENDITA</strong> sono benchmark del
        mercato e non devono essere inserite come costo unitario della produzione.
      </section>

      <div className="space-y-10">
        {[
          ['Costi di riferimento', costi],
          ['Prezzi di mercato', prezzi],
        ].map(([titolo, elenco]) => {
          const righeSezione = elenco as typeof righe;
          return (
            <section key={titolo as string}>
              <h2 className="mb-3 text-lg font-semibold">{titolo as string}</h2>
              <div className="overflow-hidden rounded-lg border bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-secondary/40 text-left text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-normal">Voce</th>
                        <th className="px-4 py-3 font-normal">Categoria</th>
                        <th className="px-4 py-3 font-normal">Valore benchmark</th>
                        <th className="px-4 py-3 font-normal">Fonte</th>
                        <th className="px-4 py-3 font-normal">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {righeSezione.map((riga) => (
                        <tr key={riga.id}>
                          <td className="px-4 py-3">
                            <div className="font-medium">{riga.nome}</div>
                            <div className="text-xs text-muted-foreground">{riga.codice}</div>
                          </td>
                          <td className="px-4 py-3">{riga.categoria}</td>
                          <td className="px-4 py-3 font-medium">
                            {euro(riga.prezzoMin, riga.prezzoMax, riga.unita)}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={riga.fonteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-2"
                            >
                              {riga.fonte}
                            </a>
                            <div className="text-xs text-muted-foreground">
                              Rilevato{' '}
                              {new Intl.DateTimeFormat('it-IT').format(new Date(riga.rilevatoIl))}
                            </div>
                          </td>
                          <td className="max-w-sm px-4 py-3 text-xs text-muted-foreground">
                            {riga.note ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
