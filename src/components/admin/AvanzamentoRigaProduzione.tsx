import {
  aggiornaStatoRigaProduzioneAzione,
} from '@/app/admin/commesse-azioni';
import {
  ETICHETTA_STATO_LAVORAZIONE,
  type StatoLavorazioneRiga,
} from '@/server/services/commessa-service';

const STATI: StatoLavorazioneRiga[] = ['DA_FARE', 'IN_LAVORAZIONE', 'COMPLETATA'];

export function AvanzamentoRigaProduzione({
  commessaId,
  rigaId,
  stato,
  modificabile,
}: {
  commessaId: string;
  rigaId: string;
  stato: StatoLavorazioneRiga;
  modificabile: boolean;
}) {
  return (
    <div className="min-w-[270px]">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full border px-2 py-1 text-xs font-medium">
          {ETICHETTA_STATO_LAVORAZIONE[stato]}
        </span>
      </div>
      {modificabile ? (
        <div className="flex flex-wrap gap-1.5">
          {STATI.map((prossimoStato) => (
            <form
              key={prossimoStato}
              action={aggiornaStatoRigaProduzioneAzione.bind(null, commessaId, rigaId, prossimoStato)}
            >
              <button
                type="submit"
                disabled={prossimoStato === stato}
                className="rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-secondary disabled:cursor-default disabled:bg-secondary disabled:opacity-100"
              >
                {ETICHETTA_STATO_LAVORAZIONE[prossimoStato]}
              </button>
            </form>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Avanzamento bloccato con lo stato della commessa.</p>
      )}
    </div>
  );
}
