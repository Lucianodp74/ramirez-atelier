import Link from 'next/link';
import { riepilogoDashboard } from '@/server/services/richieste-service';
import { richiediContesto } from '@/server/identity/contesto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatoBadge } from '@/components/admin/StatoBadge';
import { ETICHETTA_STATO } from '@/lib/workflow';

export const dynamic = 'force-dynamic'; // sempre dati freschi: è la prima cosa che il titolare guarda al mattino

function formattaEuro(valore: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(valore);
}

export default async function DashboardHomePage() {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
  const riepilogo = await riepilogoDashboard(contesto.tenantId);

  const kpiPrincipali = [
    { etichetta: 'Nuove', valore: riepilogo.conteggiPerStato.NUOVA },
    { etichetta: 'In revisione', valore: riepilogo.conteggiPerStato.IN_REVISIONE },
    { etichetta: 'Preventivo inviato', valore: riepilogo.conteggiPerStato.PREVENTIVO_INVIATO },
    { etichetta: 'Convertite', valore: riepilogo.conteggiPerStato.CONVERTITA },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Come va oggi</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiPrincipali.map((kpi) => (
          <Card key={kpi.etichetta}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {kpi.etichetta}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{kpi.valore}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Valore economico stimato
            </CardTitle>
          </CardHeader>
          <CardContent>
            {riepilogo.valoreEconomicoStimato.disponibile ? (
              <p className="text-2xl font-semibold">
                {formattaEuro(riepilogo.valoreEconomicoStimato.min)} –{' '}
                {formattaEuro(riepilogo.valoreEconomicoStimato.max)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Non ancora disponibile — il motore di pricing non è stato ancora sviluppato (v.
                ADR-0003). Comparirà qui non appena le richieste avranno una fascia di prezzo
                calcolata.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Completezza media
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{riepilogo.completezzaMedia}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Ultime richieste ricevute</h2>
          <Link href="/admin/richieste" className="text-sm text-accent hover:underline">
            Vedi tutte →
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-normal">Cliente</th>
                <th className="px-4 py-3 font-normal">Progetto</th>
                <th className="px-4 py-3 font-normal">Completezza</th>
                <th className="px-4 py-3 font-normal">Stato</th>
                <th className="px-4 py-3 font-normal">Ricevuta</th>
              </tr>
            </thead>
            <tbody>
              {riepilogo.ultimeRichieste.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-secondary/20">
                  <td className="px-4 py-3">
                    <Link href={`/admin/richieste/${r.id}`} className="hover:underline">
                      {r.clienteNome ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.tipoProgetto?.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.indiceCompletezza}%</td>
                  <td className="px-4 py-3">
                    <StatoBadge stato={r.stato} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString('it-IT')}
                  </td>
                </tr>
              ))}
              {riepilogo.ultimeRichieste.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nessuna richiesta ricevuta finora.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Stati non mostrati qui: {ETICHETTA_STATO.CHIUSA} (visibile nell&apos;elenco completo).
      </p>
    </div>
  );
}
