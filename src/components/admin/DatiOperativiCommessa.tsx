import { aggiornaDatiOperativiCommessaAzione } from '@/app/admin/commesse-azioni';

interface Props {
  commessaId: string;
  dataPrevistaConsegna: Date | null;
  noteProduzione: string | null;
}

function valoreData(data: Date | null) {
  if (!data) return '';
  const anno = data.getFullYear();
  const mese = String(data.getMonth() + 1).padStart(2, '0');
  const giorno = String(data.getDate()).padStart(2, '0');
  return `${anno}-${mese}-${giorno}`;
}

export function DatiOperativiCommessa({
  commessaId,
  dataPrevistaConsegna,
  noteProduzione,
}: Props) {
  return (
    <form
      action={aggiornaDatiOperativiCommessaAzione.bind(null, commessaId)}
      className="space-y-4"
    >
      <div>
        <label htmlFor="dataPrevistaConsegna" className="text-xs text-muted-foreground">
          Data prevista consegna
        </label>
        <input
          id="dataPrevistaConsegna"
          name="dataPrevistaConsegna"
          type="date"
          defaultValue={valoreData(dataPrevistaConsegna)}
          className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="noteProduzione" className="text-xs text-muted-foreground">
          Note di produzione
        </label>
        <textarea
          id="noteProduzione"
          name="noteProduzione"
          defaultValue={noteProduzione ?? ''}
          rows={5}
          placeholder="Indicazioni utili alla produzione, montaggio o consegna…"
          className="mt-1 block w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Salva dati operativi
      </button>
    </form>
  );
}
