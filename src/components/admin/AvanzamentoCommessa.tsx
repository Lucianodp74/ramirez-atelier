import type { StatoCommessa } from '@/server/services/commessa-service';

const PASSI: Array<{ stato: StatoCommessa; label: string }> = [
  { stato: 'DA_AVVIARE', label: 'Da avviare' },
  { stato: 'IN_PRODUZIONE', label: 'In produzione' },
  { stato: 'PRONTA', label: 'Pronta' },
  { stato: 'CONSEGNATA', label: 'Consegnata' },
  { stato: 'CHIUSA', label: 'Chiusa' },
];

const ORDINE: Record<StatoCommessa, number> = {
  DA_AVVIARE: 0,
  IN_PRODUZIONE: 1,
  PRONTA: 2,
  CONSEGNATA: 3,
  CHIUSA: 4,
  ANNULLATA: -1,
};

interface Props {
  stato: StatoCommessa;
  dataPrevistaConsegna: Date | null;
}

export function AvanzamentoCommessa({ stato, dataPrevistaConsegna }: Props) {
  const indice = ORDINE[stato];
  const annullata = stato === 'ANNULLATA';
  const oggi = new Date();
  const consegna = dataPrevistaConsegna ? new Date(dataPrevistaConsegna) : null;
  const giorniAllaConsegna = consegna
    ? Math.ceil((consegna.getTime() - oggi.getTime()) / 86400000)
    : null;

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Avanzamento produzione</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Il prossimo passaggio viene abilitato solo dal workflow della commessa.
          </p>
        </div>
        {consegna && (
          <div className="text-right text-sm">
            <p className="text-muted-foreground">Consegna prevista</p>
            <p className="font-medium">{consegna.toLocaleDateString('it-IT')}</p>
            {giorniAllaConsegna !== null && giorniAllaConsegna < 0 && stato !== 'CHIUSA' && (
              <p className="mt-1 text-xs font-medium text-destructive">Consegna in ritardo</p>
            )}
            {giorniAllaConsegna === 0 && stato !== 'CHIUSA' && (
              <p className="mt-1 text-xs font-medium">Consegna prevista oggi</p>
            )}
          </div>
        )}
      </div>

      {annullata ? (
        <div className="mt-5 rounded-md border border-dashed p-4 text-sm">
          <span className="font-medium">Commessa annullata.</span>{' '}
          Non sono disponibili ulteriori passaggi operativi.
        </div>
      ) : (
        <ol className="mt-6 grid gap-3 sm:grid-cols-5">
          {PASSI.map((passo) => {
            const completato = indice > ORDINE[passo.stato];
            const corrente = indice === ORDINE[passo.stato];
            return (
              <li key={passo.stato} className="relative">
                <div className={`rounded-md border p-3 ${corrente ? 'border-primary bg-secondary/30' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${completato || corrente ? 'bg-primary text-primary-foreground' : ''}`}>
                      {completato ? '✓' : ORDINE[passo.stato] + 1}
                    </span>
                    <span className={`text-xs ${corrente ? 'font-semibold' : 'text-muted-foreground'}`}>
                      {passo.label}
                    </span>
                  </div>
                  {corrente && <p className="mt-2 text-xs text-muted-foreground">Stato attuale</p>}
                  {completato && <p className="mt-2 text-xs text-muted-foreground">Completato</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
