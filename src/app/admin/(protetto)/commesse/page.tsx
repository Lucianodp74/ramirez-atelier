import Link from 'next/link';
import { richiediContesto } from '@/server/identity/contesto';
import {
  ETICHETTA_STATO_COMMESSA,
  listaCommesse,
  type StatoCommessa,
} from '@/server/services/commessa-service';

export const dynamic = 'force-dynamic';

const STATI: Array<{ value: StatoCommessa; label: string }> = [
  { value: 'DA_AVVIARE', label: 'Da avviare' },
  { value: 'IN_PRODUZIONE', label: 'In produzione' },
  { value: 'PRONTA', label: 'Pronta' },
  { value: 'CONSEGNATA', label: 'Consegnata' },
  { value: 'CHIUSA', label: 'Chiusa' },
  { value: 'ANNULLATA', label: 'Annullata' },
];

export default async function CommessePage({
  searchParams,
}: {
  searchParams: Promise<{ stato?: string }>;
}) {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
  const params = await searchParams;
  const stato = STATI.some((item) => item.value === params.stato)
    ? (params.stato as StatoCommessa)
    : undefined;
  const commesse = await listaCommesse(contesto.tenantId, stato);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Area operativa</p>
          <h1 className="text-3xl font-semibold tracking-tight">Commesse</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Il lavoro vero dopo il preventivo: stato di produzione e distinta operativa congelata al momento dell&apos;avvio.
          </p>
        </div>
        <Link href="/admin/richieste?stato=CONVERTITA" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary">
          Vedi richieste convertite
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/commesse" className={`rounded-full border px-3 py-1 text-sm ${!stato ? 'bg-secondary font-medium' : ''}`}>
          Tutte
        </Link>
        {STATI.map((item) => (
          <Link
            key={item.value}
            href={`/admin/commesse?stato=${item.value}`}
            className={`rounded-full border px-3 py-1 text-sm ${stato === item.value ? 'bg-secondary font-medium' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {commesse.length === 0 ? (
        <section className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">Nessuna commessa in questo filtro.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Una richiesta diventa commessa quando è nello stato &quot;Convertita&quot;.
          </p>
          <Link href="/admin/richieste?stato=CONVERTITA" className="mt-4 inline-block text-sm font-medium underline">
            Apri le richieste convertite
          </Link>
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-secondary/40 text-muted-foreground">
                <tr>
                  <th className="p-4">Commessa</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Progetto</th>
                  <th className="p-4">Stato</th>
                  <th className="p-4">Righe produzione</th>
                  <th className="p-4">Aggiornata</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {commesse.map((commessa) => (
                  <tr key={commessa.id}>
                    <td className="p-4 font-semibold">{commessa.numero}</td>
                    <td className="p-4">{commessa.clienteNome ?? '—'}</td>
                    <td className="p-4">{commessa.tipoProgettoNome}</td>
                    <td className="p-4">
                      <span className="rounded-full border px-2.5 py-1 text-xs">
                        {ETICHETTA_STATO_COMMESSA[commessa.stato]}
                      </span>
                    </td>
                    <td className="p-4">{commessa.righeCount ?? 0}</td>
                    <td className="p-4 text-muted-foreground">{commessa.updatedAt.toLocaleString('it-IT')}</td>
                    <td className="p-4 text-right">
                      <Link href={`/admin/commesse/${commessa.id}`} className="font-medium underline">
                        Apri
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        La creazione della commessa avviene dalla richiesta convertita, non da un pulsante generico qui: questo evita commesse senza origine commerciale.
      </p>
    </main>
  );
}
