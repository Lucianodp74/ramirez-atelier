import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = { datiEstensione: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function PreventivatoreBOMParametricaCard({ datiEstensione }: Props) {
  if (!isRecord(datiEstensione)) return null;
  const snapshot = datiEstensione.preventivatoreModulare;
  if (!isRecord(snapshot)) return null;
  const moduli = Array.isArray(snapshot.moduli) ? snapshot.moduli : [];
  if (moduli.length === 0) return null;

  const stima = isRecord(snapshot.stima) ? snapshot.stima : null;
  const prezzoIndicativo = typeof stima?.prezzoIndicativo === 'number' ? stima.prezzoIndicativo : null;
  const calcolataIl = typeof stima?.calcolataIl === 'string' ? stima.calcolataIl : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurazione parametrica acquisita</CardTitle>
        <p className="text-sm text-muted-foreground">
          Questa scheda mostra esclusivamente i dati congelati al momento della richiesta. Non ricalcola la configurazione con il Listino corrente.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Moduli acquisiti</p>
            <p className="mt-1 text-lg font-medium">{moduli.length}</p>
          </div>
          {prezzoIndicativo !== null && (
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Stima indicativa congelata</p>
              <p className="mt-1 text-lg font-medium">€ {prezzoIndicativo.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</p>
            </div>
          )}
        </div>
        {calcolataIl && (
          <p className="text-xs text-muted-foreground">
            Calcolata il {new Date(calcolataIl).toLocaleString('it-IT')}. Per una nuova distinta economica è necessario avviare esplicitamente un nuovo calcolo.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
