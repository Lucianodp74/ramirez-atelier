import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const labels: Record<string, string> = {
  BASE: 'Base', PENSILE: 'Pensile', COLONNA: 'Colonna', CASSETTIERA: 'Cassettiera', LIBRERIA: 'Libreria / contenitore',
  TRUCIOLARE: 'Truciolare', MDF: 'MDF', MULTISTRATO: 'Multistrato',
  MELAMINICO: 'Melaminico', LAMINATO: 'Laminato', LACCATO: 'Laccato',
  APERTO: 'Aperto', '1_PORTA': '1 porta', '2_PORTE': '2 porte', '3_CASSETTI': '3 cassetti', '4_CASSETTI': '4 cassetti', PORTE_CASSETTI: 'Porte + cassetti',
};

type Props = { datiEstensione: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function PreventivatoreSnapshotCard({ datiEstensione }: Props) {
  if (!isRecord(datiEstensione)) return null;
  const snapshot = datiEstensione.preventivatoreModulare;
  if (!isRecord(snapshot) || snapshot.origine !== undefined && snapshot.origine !== 'preventivatore-modulare-v2') return null;
  const moduli = Array.isArray(snapshot.moduli) ? snapshot.moduli.filter(isRecord) : [];
  const stima = isRecord(snapshot.stima) ? snapshot.stima : null;
  if (moduli.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurazione Preventivatore Modulare</CardTitle>
        <p className="text-sm text-muted-foreground">Snapshot tecnico ricevuto dal cliente.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {moduli.map((modulo, index) => {
            const tipo = String(modulo.tipo ?? '');
            const materiale = String(modulo.materiale ?? '');
            const finitura = String(modulo.finitura ?? '');
            const configurazione = String(modulo.configurazione ?? '');
            return (
              <div key={String(modulo.id ?? index)} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{index + 1}. {labels[tipo] ?? tipo}</p>
                  <span className="text-xs text-muted-foreground">V2</span>
                </div>
                <p className="mt-2 text-sm">{String(modulo.larghezzaCm ?? '—')} × {String(modulo.altezzaCm ?? '—')} × {String(modulo.profonditaCm ?? '—')} cm</p>
                <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between gap-2"><dt>Materiale</dt><dd className="font-medium text-foreground">{labels[materiale] ?? materiale}</dd></div>
                  <div className="flex justify-between gap-2"><dt>Finitura</dt><dd className="font-medium text-foreground">{labels[finitura] ?? finitura}</dd></div>
                  <div className="flex justify-between gap-2"><dt>Configurazione</dt><dd className="font-medium text-foreground">{labels[configurazione] ?? configurazione}</dd></div>
                  <div className="flex justify-between gap-2"><dt>Ripiani</dt><dd className="font-medium text-foreground">{String(modulo.ripiani ?? 0)}</dd></div>
                </dl>
              </div>
            );
          })}
        </div>

        {stima && (
          <div className="space-y-3">
            {typeof stima.prezzoIndicativo === 'number' && (
              <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Prezzo privato / architetto</p>
                  <p className="text-xs text-muted-foreground">Stima indicativa ricevuta dal configuratore.</p>
                </div>
                <p className="text-2xl font-semibold">{euro.format(stima.prezzoIndicativo)}</p>
              </div>
            )}
            {typeof stima.prezzoFalegname === 'number' && (
              <div className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Prezzo falegname</p>
                  <p className="text-xs text-muted-foreground">Valore interno dello stesso snapshot; non viene ricalcolato con il Listino corrente.</p>
                </div>
                <p className="text-xl font-semibold">{euro.format(stima.prezzoFalegname)}</p>
              </div>
            )}
            {typeof stima.costoProduzione === 'number' && (
              <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <span className="text-muted-foreground">Costo produzione interno</span>
                <span className="font-medium">{euro.format(stima.costoProduzione)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
