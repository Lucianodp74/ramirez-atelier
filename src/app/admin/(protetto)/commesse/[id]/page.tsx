import Link from 'next/link';
import { notFound } from 'next/navigation';
import { richiediContesto } from '@/server/identity/contesto';
import {
  dettaglioCommessa,
  ETICHETTA_STATO_COMMESSA,
  prossimiStatiCommessa,
  type StatoCommessa,
} from '@/server/services/commessa-service';
import { cambiaStatoCommessaAzione } from '@/app/admin/commesse-azioni';
import { AvanzamentoCommessa } from '@/components/admin/AvanzamentoCommessa';
import { DatiOperativiCommessa } from '@/components/admin/DatiOperativiCommessa';
import { RiepilogoOfficinaCommessa } from '@/components/admin/RiepilogoOfficinaCommessa';

export const dynamic = 'force-dynamic';

const EURO = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
});

const LABEL_PROSSIMO: Record<StatoCommessa, string> = {
  DA_AVVIARE: 'Da avviare',
  IN_PRODUZIONE: 'Avvia produzione',
  PRONTA: 'Segna pronta',
  CHIUSA: 'Chiudi commessa',
  CONSEGNATA: 'Segna consegnata',
  ANNULLATA: 'Annulla commessa',
};

export default async function CommessaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
  const commessa = await dettaglioCommessa(contesto.tenantId, id);
  if (!commessa) notFound();

  const prossimi = prossimiStatiCommessa(commessa.stato);
  const costoSnapshot = commessa.righe.reduce(
    (totale, riga) => totale + (riga.costoUnitario ?? 0) * riga.quantita,
    0,
  );
  const datiOperativiBloccati = ['CONSEGNATA', 'CHIUSA', 'ANNULLATA'].includes(commessa.stato);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/admin/commesse" className="text-sm text-muted-foreground hover:underline">
        ← Commesse
      </Link>

      <div className="mb-8 mt-3 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm text-muted-foreground">{commessa.numero}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{commessa.clienteNome ?? 'Cliente senza nome'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{commessa.tipoProgettoNome}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border px-3 py-1.5 text-sm font-medium">
            {ETICHETTA_STATO_COMMESSA[commessa.stato]}
          </span>
          {prossimi.map((stato) => (
            <form key={stato} action={cambiaStatoCommessaAzione.bind(null, commessa.id, stato)}>
              <button
                type="submit"
                className={`rounded-md px-4 py-2 text-sm font-medium ${stato === 'ANNULLATA' ? 'border' : 'bg-primary text-primary-foreground'}`}
              >
                {LABEL_PROSSIMO[stato]}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <AvanzamentoCommessa
          stato={commessa.stato}
          dataPrevistaConsegna={commessa.dataPrevistaConsegna}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <RiepilogoOfficinaCommessa
            righe={commessa.righe}
            stato={ETICHETTA_STATO_COMMESSA[commessa.stato]}
            noteProduzione={commessa.noteProduzione}
          />

          <section className="overflow-hidden rounded-lg border bg-card">
            <div className="border-b p-5">
              <h2 className="font-semibold">Distinta operativa</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Snapshot della BOM {commessa.fonteBomVersione ? `v${commessa.fonteBomVersione}` : ''}. Le modifiche future alla BOM non alterano questa commessa.
              </p>
            </div>
            {commessa.righe.length === 0 ? (
              <div className="p-8 text-sm text-amber-700">
                Nessuna riga di produzione. La commessa è stata creata senza una BOM confermata.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-secondary/40 text-muted-foreground">
                    <tr>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Codice</th>
                      <th className="p-3">Descrizione</th>
                      <th className="p-3">Materiale</th>
                      <th className="p-3">Lavorazione</th>
                      <th className="p-3 text-right">Qtà</th>
                      <th className="p-3 text-right">Costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {commessa.righe.map((riga) => (
                      <tr key={riga.id}>
                        <td className="p-3">{riga.categoria}</td>
                        <td className="p-3">{riga.codice ?? '—'}</td>
                        <td className="p-3 font-medium">{riga.descrizione}</td>
                        <td className="p-3">{riga.materiale ?? '—'}</td>
                        <td className="p-3">{riga.lavorazione ?? '—'}</td>
                        <td className="p-3 text-right">{riga.quantita} {riga.unita}</td>
                        <td className="p-3 text-right">
                          {riga.costoUnitario == null ? '—' : EURO.format(riga.costoUnitario * riga.quantita)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Dati operativi</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {datiOperativiBloccati
                ? 'Dati congelati al momento della consegna o chiusura della commessa.'
                : 'Informazioni modificabili dal laboratorio senza alterare lo snapshot della BOM.'}
            </p>
            <div className="mt-4">
              <DatiOperativiCommessa
                commessaId={commessa.id}
                stato={commessa.stato}
                dataPrevistaConsegna={commessa.dataPrevistaConsegna}
                noteProduzione={commessa.noteProduzione}
              />
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Contatti cliente</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs text-muted-foreground">Nome</p><p className="text-sm">{commessa.clienteNome ?? '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm">{commessa.clienteEmail ?? '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Telefono</p><p className="text-sm">{commessa.clienteTelefono ?? '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Richiesta origine</p><Link href={`/admin/richieste/${commessa.richiestaId}`} className="text-sm underline">Apri richiesta</Link></div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Stato operativo</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Creata</dt><dd>{commessa.createdAt.toLocaleDateString('it-IT')}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Avviata</dt><dd>{commessa.avviataIl?.toLocaleDateString('it-IT') ?? '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Pronta</dt><dd>{commessa.prontaIl?.toLocaleDateString('it-IT') ?? '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Consegnata</dt><dd>{commessa.consegnataIl?.toLocaleDateString('it-IT') ?? '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Chiusa</dt><dd>{commessa.chiusaIl?.toLocaleDateString('it-IT') ?? '—'}</dd></div>
              <div className="flex justify-between gap-3 border-t pt-3"><dt className="text-muted-foreground">Consegna prevista</dt><dd className="font-medium">{commessa.dataPrevistaConsegna?.toLocaleDateString('it-IT') ?? '—'}</dd></div>
            </dl>
          </section>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Snapshot economico</h2>
            <p className="mt-1 text-xs text-muted-foreground">Costo della distinta congelata nella commessa.</p>
            <p className="mt-4 text-2xl font-semibold">{EURO.format(costoSnapshot)}</p>
          </section>

          {commessa.fonteBomId && (
            <section className="rounded-lg border bg-card p-5">
              <h2 className="font-semibold">Origine</h2>
              <p className="mt-2 text-sm text-muted-foreground">BOM confermata v{commessa.fonteBomVersione}</p>
              <Link href={`/admin/bom/${commessa.fonteBomId}`} className="mt-3 inline-block text-sm underline">
                Apri BOM originale
              </Link>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
