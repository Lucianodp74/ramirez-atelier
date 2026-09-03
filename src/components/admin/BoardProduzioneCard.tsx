import Link from 'next/link';
import type { CommessaRow } from '@/server/services/commessa-service';

function statoConsegna(commessa: CommessaRow) {
  if (!commessa.dataPrevistaConsegna) return null;

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  const consegna = new Date(commessa.dataPrevistaConsegna);
  consegna.setHours(0, 0, 0, 0);
  const giorni = Math.round((consegna.getTime() - oggi.getTime()) / 86400000);

  if (giorni < 0) return { testo: `In ritardo di ${Math.abs(giorni)} gg`, urgente: true };
  if (giorni === 0) return { testo: 'Consegna oggi', urgente: true };
  if (giorni === 1) return { testo: 'Consegna domani', urgente: true };
  return { testo: `Tra ${giorni} giorni`, urgente: false };
}

export function BoardProduzioneCard({ commessa }: { commessa: CommessaRow }) {
  const consegna = statoConsegna(commessa);
  const totale = commessa.righeCount ?? 0;
  const completate = commessa.righeCompletateCount ?? 0;
  const percentuale = totale ? Math.round((completate / totale) * 100) : 0;

  return (
    <article className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{commessa.numero}</p>
          <h3 className="mt-1 truncate font-semibold">{commessa.clienteNome ?? 'Cliente senza nome'}</h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">{commessa.tipoProgettoNome}</p>
        </div>
        <span className="shrink-0 rounded-full border px-2 py-1 text-xs">
          {totale} {totale === 1 ? 'riga' : 'righe'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md border bg-secondary/20 p-2">
          <p className="text-muted-foreground">Consegna</p>
          <p className="mt-1 font-medium">
            {commessa.dataPrevistaConsegna
              ? commessa.dataPrevistaConsegna.toLocaleDateString('it-IT')
              : 'Da definire'}
          </p>
        </div>
        <div className="rounded-md border bg-secondary/20 p-2">
          <p className="text-muted-foreground">Produzione</p>
          <p className="mt-1 font-medium">{completate}/{totale} completate</p>
        </div>
      </div>

      {totale > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">Avanzamento</span>
            <span className="font-medium">{percentuale}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${percentuale}%` }} />
          </div>
        </div>
      )}

      <div className="mt-3 flex min-h-5 items-center justify-between gap-3 text-xs">
        {consegna ? (
          <span className={consegna.urgente ? 'font-semibold text-destructive' : 'font-medium'}>
            {consegna.testo}
          </span>
        ) : (
          <span className="text-muted-foreground">Consegna non pianificata</span>
        )}
        {commessa.noteProduzione && (
          <span className="rounded-full border px-2 py-1 font-medium" title="Sono presenti note di produzione">
            Note officina
          </span>
        )}
      </div>

      <Link
        href={`/admin/commesse/${commessa.id}`}
        className="mt-4 block rounded-md border px-3 py-2 text-center text-sm font-medium hover:bg-secondary"
      >
        Apri commessa
      </Link>
    </article>
  );
}
