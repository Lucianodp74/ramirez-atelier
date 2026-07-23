import { elencoRegole, ultimeEsecuzioni } from '@/server/services/regole-service';
import { richiediContesto } from '@/server/identity/contesto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleRegola } from '@/components/admin/ToggleRegola';

export const dynamic = 'force-dynamic';

const ETICHETTA_ESITO: Record<string, string> = {
  CONDIZIONE_VERA: 'Condizione vera — azioni eseguite',
  CONDIZIONE_FALSA: 'Condizione falsa',
  ERRORE: 'Errore',
};

export default async function RegolePage() {
  const contesto = await richiediContesto({ modulo: 'regole', azione: 'leggi' });
  const [regole, esecuzioni] = await Promise.all([
    elencoRegole(contesto.tenantId),
    ultimeEsecuzioni(contesto.tenantId, 30),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Regole di business</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Motore generico (Business Rules Engine) — non specifico per il pricing. Questo contesto
        attivo oggi:{' '}
        <code className="rounded bg-secondary/40 px-1">richiesta_priorita_commerciale</code>. Nuovi
        contesti (pricing, notifiche, ...) si aggiungono come nuove righe, senza modificare il
        motore.
      </p>

      <div className="mb-10 space-y-4">
        {regole.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{r.nome}</CardTitle>
                {r.descrizione && (
                  <p className="mt-1 text-sm text-muted-foreground">{r.descrizione}</p>
                )}
              </div>
              <ToggleRegola id={r.id} stato={r.stato} />
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">contesto: {r.contesto}</Badge>
              <Badge variant="outline">priorità: {r.priorita}</Badge>
              <Badge variant={r.stato === 'ATTIVA' ? 'accent' : 'default'}>{r.stato}</Badge>
              <Badge variant="outline">versione {r.versione}</Badge>
            </CardContent>
          </Card>
        ))}
        {regole.length === 0 && (
          <p className="text-muted-foreground">Nessuna regola configurata.</p>
        )}
      </div>

      <h2 className="mb-4 text-lg font-medium">Ultime esecuzioni (tracciabilità)</h2>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-normal">Regola</th>
              <th className="px-4 py-3 font-normal">Entità</th>
              <th className="px-4 py-3 font-normal">Esito</th>
              <th className="px-4 py-3 font-normal">Quando</th>
            </tr>
          </thead>
          <tbody>
            {esecuzioni.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted-foreground">{e.regolaId}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {e.entitaTipo} · {e.entitaId}
                </td>
                <td className="px-4 py-3">{ETICHETTA_ESITO[e.esito] ?? e.esito}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString('it-IT')}
                </td>
              </tr>
            ))}
            {esecuzioni.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Nessuna esecuzione registrata finora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
