import type { RigaProduzione } from '@/server/services/commessa-service';

interface Props {
  righe: RigaProduzione[];
  stato: string;
  noteProduzione: string | null;
}

export function RiepilogoOfficinaCommessa({ righe, stato, noteProduzione }: Props) {
  const quantitaTotale = righe.reduce((totale, riga) => totale + riga.quantita, 0);
  const categorie = new Set(righe.map((riga) => riga.categoria)).size;
  const righeConNote = righe.filter((riga) => riga.note?.trim()).length;
  const completate = righe.filter((riga) => riga.statoLavorazione === 'COMPLETATA').length;
  const inLavorazione = righe.filter((riga) => riga.statoLavorazione === 'IN_LAVORAZIONE').length;
  const percentuale = righe.length ? Math.round((completate / righe.length) * 100) : 0;

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Riepilogo officina</h2>
          <p className="mt-1 text-sm text-muted-foreground">Quadro rapido prima di iniziare o riprendere la lavorazione.</p>
        </div>
        <span className="rounded-full border px-3 py-1 text-xs font-medium">{stato.replaceAll('_', ' ')}</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Righe produzione</p>
          <p className="mt-1 text-xl font-semibold">{righe.length}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Quantità complessiva</p>
          <p className="mt-1 text-xl font-semibold">{quantitaTotale}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Categorie</p>
          <p className="mt-1 text-xl font-semibold">{categorie}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Avanzamento righe</p>
          <p className="mt-1 text-xl font-semibold">{percentuale}%</p>
          <p className="mt-1 text-xs text-muted-foreground">{completate} completate · {inLavorazione} in lavorazione</p>
        </div>
      </div>

      {righe.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">Avanzamento produzione</span>
            <span className="font-medium">{completate}/{righe.length} righe</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentuale}%` }} />
          </div>
        </div>
      )}

      {noteProduzione?.trim() && (
        <div className="mt-4 rounded-md border p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Note laboratorio</p>
          <p className="mt-2 whitespace-pre-wrap text-sm">{noteProduzione}</p>
        </div>
      )}

      {righeConNote > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">{righeConNote} {righeConNote === 1 ? 'riga contiene' : 'righe contengono'} note specifiche di produzione.</p>
      )}
    </section>
  );
}
