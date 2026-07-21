import { elencoFasceBudget } from '@/server/services/fasce-budget-service';
import { richiediContesto } from '@/server/identity/contesto';
import { Card, CardContent } from '@/components/ui/card';
import { FormNuovaFascia } from '@/components/admin/FormNuovaFascia';
import { ToggleFasciaBudget } from '@/components/admin/ToggleFasciaBudget';

export const dynamic = 'force-dynamic';

export default async function FasceBudgetPage() {
  const contesto = await richiediContesto({ modulo: 'fasce_budget', azione: 'leggi' });
  const fasce = await elencoFasceBudget(contesto.tenantId);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Fasce di budget</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Ogni azienda definisce le proprie fasce: sono usate nel configuratore (step budget), nei
        filtri della dashboard e, in futuro, per priorità commerciale, statistiche e assegnazione
        automatica. Modificarle qui non richiede alcun intervento di sviluppo.
      </p>

      <div className="mb-8">
        <FormNuovaFascia />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-normal">Ordine</th>
                <th className="px-4 py-3 font-normal">Nome</th>
                <th className="px-4 py-3 font-normal">Intervallo</th>
                <th className="px-4 py-3 font-normal">Stato</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {fasce.map((f) => (
                <tr key={f.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">{f.ordinamento}</td>
                  <td className="px-4 py-3 font-medium">{f.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {Number(f.minimo).toLocaleString('it-IT')} € –{' '}
                    {f.massimo !== null
                      ? `${Number(f.massimo).toLocaleString('it-IT')} €`
                      : 'illimitato'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={f.attiva ? 'text-accent' : 'text-muted-foreground'}>
                      {f.attiva ? 'Attiva' : 'Disattivata'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ToggleFasciaBudget id={f.id} attiva={f.attiva} />
                  </td>
                </tr>
              ))}
              {fasce.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nessuna fascia configurata.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
