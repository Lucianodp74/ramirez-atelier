import Link from 'next/link';
import { richiediContesto } from '@/server/identity/contesto';
import {
  ETICHETTA_STATO_COMMESSA,
  listaCommesse,
  type CommessaRow,
  type StatoCommessa,
} from '@/server/services/commessa-service';

export const dynamic = 'force-dynamic';

const COLONNE: Array<{ stato: StatoCommessa; titolo: string; descrizione: string }> = [
  { stato: 'DA_AVVIARE', titolo: 'Da avviare', descrizione: 'Commesse pronte per entrare in laboratorio.' },
  { stato: 'IN_PRODUZIONE', titolo: 'In produzione', descrizione: 'Lavori attualmente in lavorazione.' },
  { stato: 'PRONTA', titolo: 'Pronte', descrizione: 'Lavori completati e in attesa di consegna.' },
  { stato: 'CONSEGNATA', titolo: 'Consegnate', descrizione: 'Consegne effettuate, da chiudere.' },
];

function inRitardo(commessa: CommessaRow) {
  if (!commessa.dataPrevistaConsegna) return false;
  if (commessa.stato === 'CONSEGNATA' || commessa.stato === 'CHIUSA' || commessa.stato === 'ANNULLATA') return false;
  return commessa.dataPrevistaConsegna.getTime() < Date.now();
}

function Card({ commessa }: { commessa: CommessaRow }) {
  const ritardo = inRitardo(commessa);
  return (
    <article className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{commessa.numero}</p>
          <h3 className="mt-1 font-semibold">{commessa.clienteNome ?? 'Cliente senza nome'}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{commessa.tipoProgettoNome}</p>
        </div>
        <span className="rounded-full border px-2 py-1 text-xs">
          {commessa.righeCount ?? 0} righe
        </span>
      </div>

      <div className="mt-4 border-t pt-3 text-xs">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Consegna</span>
          <span className={ritardo ? 'font-semibold text-destructive' : 'font-medium'}>
            {commessa.dataPrevistaConsegna
              ? commessa.dataPrevistaConsegna.toLocaleDateString('it-IT')
              : 'Da definire'}
          </span>
        </div>
        {ritardo && <p className="mt-1 font-medium text-destructive">Consegna in ritardo</p>}
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

export default async function ProduzionePage() {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
  const commesse = await listaCommesse(contesto.tenantId);
  const attive = commesse.filter((commessa) =>
    ['DA_AVVIARE', 'IN_PRODUZIONE', 'PRONTA', 'CONSEGNATA'].includes(commessa.stato),
  );

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/commesse" className="text-sm text-muted-foreground hover:underline">
            ← Commesse
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">Area operativa</p>
          <h1 className="text-3xl font-semibold tracking-tight">Board produzione</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Una vista unica dei lavori attivi, ordinati per fase produttiva. Le modifiche di stato restano nella scheda della commessa.
          </p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">Lavori attivi</span>
          <strong className="ml-2">{attive.length}</strong>
        </div>
      </div>

      {attive.length === 0 ? (
        <section className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">Nessun lavoro attivo.</p>
          <p className="mt-2 text-sm text-muted-foreground">Le commesse convertite compariranno qui quando saranno operative.</p>
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-4">
          {COLONNE.map((colonna) => {
            const items = attive.filter((commessa) => commessa.stato === colonna.stato);
            return (
              <section key={colonna.stato} className="min-h-[220px] rounded-xl border bg-secondary/10 p-3">
                <div className="mb-3 flex items-start justify-between gap-2 px-1">
                  <div>
                    <h2 className="font-semibold">{colonna.titolo}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{colonna.descrizione}</p>
                  </div>
                  <span className="rounded-full border bg-background px-2 py-1 text-xs font-medium">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.map((commessa) => <Card key={commessa.id} commessa={commessa} />)}
                  {items.length === 0 && <p className="rounded-lg border border-dashed p-5 text-center text-xs text-muted-foreground">Nessuna commessa</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Stato mostrato dal workflow ufficiale della commessa. La BOM resta congelata nello snapshot di produzione.
      </p>
    </main>
  );
}
