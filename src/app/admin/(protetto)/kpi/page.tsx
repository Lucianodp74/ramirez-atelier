import { calcolaKpi } from '@/server/services/kpi-service';
import { richiediContesto } from '@/server/identity/contesto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarreOrizzontali } from '@/components/admin/BarreOrizzontali';

export const dynamic = 'force-dynamic';

function formattaEuro(valore: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(valore);
}

interface ParamsRicerca {
  dataDa?: string;
  dataA?: string;
}

export default async function KpiPage({ searchParams }: { searchParams: Promise<ParamsRicerca> }) {
  const contesto = await richiediContesto({ modulo: 'kpi', azione: 'leggi' });
  const sp = await searchParams;

  const kpi = await calcolaKpi(contesto.tenantId, { dataDa: sp.dataDa, dataA: sp.dataA });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Osservabilità e KPI</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Il primo passo verso il Controllo di Gestione: trasformare le richieste raccolte in una
        visione chiara dell&apos;andamento dell&apos;azienda.
      </p>

      <form className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
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
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Applica
        </button>
        <a href="/admin/kpi" className="text-sm text-muted-foreground hover:underline">
          Azzera
        </a>
      </form>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Valore opportunità aperte
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpi.valoreOpportunitaAperte.disponibile ? (
              <p className="text-2xl font-semibold">
                {formattaEuro(kpi.valoreOpportunitaAperte.valore)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nessuna richiesta aperta con prezzo calcolato.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Valore medio richiesta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpi.valoreMedioRichiesta.disponibile ? (
              <p className="text-2xl font-semibold">
                {formattaEuro(kpi.valoreMedioRichiesta.valore)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Non ancora disponibile.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Tempo medio richiesta → preventivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpi.tempoMedioRichiestaPreventivoGiorni.disponibile ? (
              <>
                <p className="text-2xl font-semibold">
                  {kpi.tempoMedioRichiestaPreventivoGiorni.valore} giorni
                </p>
                <p className="text-xs text-muted-foreground">
                  su {kpi.tempoMedioRichiestaPreventivoGiorni.campione} richieste con preventivo
                  inviato
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nessuna richiesta ha ancora raggiunto lo stato &quot;Preventivo inviato&quot;.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Tasso di conversione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{kpi.tassoConversione.percentuale}%</p>
            <p className="text-xs text-muted-foreground">
              {kpi.tassoConversione.convertite} convertite su {kpi.tassoConversione.totale} totali
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Richieste per tipologia</CardTitle>
          </CardHeader>
          <CardContent>
            <BarreOrizzontali
              righe={kpi.richiestePerTipologia.map((t) => ({
                etichetta: t.nome,
                valore: t.conteggio,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuzione per fascia di budget</CardTitle>
          </CardHeader>
          <CardContent>
            <BarreOrizzontali
              righe={kpi.distribuzionePerFasciaBudget.map((f) => ({
                etichetta: f.nome,
                valore: f.conteggio,
              }))}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Richieste per architetto</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {kpi.richiestePerArchitetto.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-normal">Nome</th>
                    <th className="px-4 py-3 font-normal">Email</th>
                    <th className="px-4 py-3 font-normal">Richieste</th>
                    <th className="px-4 py-3 font-normal">Valore totale</th>
                  </tr>
                </thead>
                <tbody>
                  {kpi.richiestePerArchitetto.map((a) => (
                    <tr key={`${a.nome}-${a.email}`} className="border-t border-border">
                      <td className="px-4 py-3">{a.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                      <td className="px-4 py-3">{a.conteggio}</td>
                      <td className="px-4 py-3">{formattaEuro(a.valoreTotale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nessuna richiesta da un cliente di tipo &quot;Architetto&quot; nel periodo
                selezionato.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        &quot;Per architetto&quot; è approssimato raggruppando per nome ed email tra i clienti di
        tipo Architetto — non esiste ancora un&apos;identità Architetto reale collegabile a più
        progetti nel tempo (prevista in ADR-0004 come futura estensione, non ancora implementata).
      </p>
    </div>
  );
}
