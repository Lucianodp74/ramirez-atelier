import Link from 'next/link';
import { notFound } from 'next/navigation';
import { richiediContesto } from '@/server/identity/contesto';
import {
  dettaglioComposizioneListino,
  elencoComponentiPerComposizione,
} from '@/server/services/listino-composizioni-service';
import { listaBomAdmin } from '@/server/services/bom-admin-service';
import {
  aggiungiComposizioneABomAzione,
  aggiungiRigaComposizioneAzione,
  aggiornaRigaComposizioneAzione,
  rimuoviRigaComposizioneAzione,
} from '@/app/admin/composizioni-azioni';

export const dynamic = 'force-dynamic';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

function dimensioni(riga: { larghezzaCm: number | null; altezzaCm: number | null; profonditaCm: number | null }) {
  const valori = [riga.larghezzaCm, riga.altezzaCm, riga.profonditaCm];
  if (valori.every((valore) => valore == null)) return '—';
  return `${valori.map((valore) => (valore == null ? '—' : valore)).join(' × ')} cm`;
}

export default async function ComposizioneListinoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contestoCatalogo = await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });
  const contestoRichieste = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
  const dettaglio = await dettaglioComposizioneListino(contestoCatalogo.tenantId, id);
  if (!dettaglio) notFound();
  const [componenti, bom] = await Promise.all([
    elencoComponentiPerComposizione(contestoCatalogo.tenantId, id),
    listaBomAdmin(contestoRichieste.tenantId),
  ]);
  const differenza = dettaglio.composizione.prezzo - dettaglio.costoDistinta;
  const bomBozza = bom.filter((item) => item.stato === 'BOZZA');

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <Link href="/admin/catalogo/listino" className="text-sm text-muted-foreground hover:underline">
        ← Listino Atelier
      </Link>

      <div className="mb-8 mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{dettaglio.composizione.codice} · Composizione</p>
          <h1 className="text-3xl font-semibold tracking-tight">{dettaglio.composizione.nome}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{dimensioni(dettaglio.composizione)} · {dettaglio.composizione.materiale ?? 'Materiale non specificato'}</p>
        </div>
        <div className="rounded-lg border bg-secondary/20 px-5 py-4 text-right">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Prezzo listino</div>
          <div className="text-2xl font-semibold">{euro.format(dettaglio.composizione.prezzo)}</div>
        </div>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">Costo distinta</div><div className="mt-1 text-2xl font-semibold">{euro.format(dettaglio.costoDistinta)}</div></div>
        <div className="rounded-lg border p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">Voci in distinta</div><div className="mt-1 text-2xl font-semibold">{dettaglio.righe.length}</div></div>
        <div className="rounded-lg border p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">Differenza di riferimento</div><div className="mt-1 text-2xl font-semibold">{euro.format(differenza)}</div></div>
      </section>

      <section className="mb-6 rounded-lg border p-5">
        <div className="mb-4">
          <h2 className="font-semibold">Aggiungi componente alla composizione</h2>
          <p className="mt-1 text-sm text-muted-foreground">Il costo corrente del componente viene copiato nella distinta come snapshot. Le quantità restano modificabili.</p>
        </div>
        <form action={aggiungiRigaComposizioneAzione} className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
          <input type="hidden" name="composizioneId" value={id} />
          <select name="componenteId" required className="rounded-md border bg-background p-2">
            <option value="">Seleziona materiale o componente…</option>
            {componenti.map((componente) => (
              <option key={componente.id} value={componente.id}>
                {componente.nome} · {componente.unita} · {euro.format(componente.prezzo)}
              </option>
            ))}
          </select>
          <input name="quantita" type="number" min="0.001" step="0.001" defaultValue="1" required className="rounded-md border p-2" />
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Aggiungi</button>
        </form>
      </section>

      <section className="mb-6 rounded-lg border p-5">
        <div className="mb-4">
          <h2 className="font-semibold">Trasferisci la composizione in una BOM</h2>
          <p className="mt-1 text-sm text-muted-foreground">Le righe vengono copiate nella BOM come fotografia della composizione attuale. La BOM deve essere in stato BOZZA.</p>
        </div>
        {bomBozza.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna BOM in bozza disponibile. Crea prima una BOM dalla relativa richiesta di progetto.</p>
        ) : dettaglio.righe.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aggiungi almeno un componente alla composizione prima di trasferirla.</p>
        ) : (
          <form action={aggiungiComposizioneABomAzione} className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input type="hidden" name="composizioneId" value={id} />
            <select name="bomId" required className="rounded-md border bg-background p-2">
              <option value="">Seleziona BOM in bozza…</option>
              {bomBozza.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.richiestaId} · v{item.versione} · {item.righeCount} righe
                </option>
              ))}
            </select>
            <button className="rounded-md border bg-secondary px-4 py-2 text-sm">Aggiungi alla BOM</button>
          </form>
        )}
      </section>

      <section className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-secondary/40 text-left text-muted-foreground">
            <tr><th className="p-3">Tipo</th><th className="p-3">Componente</th><th className="p-3">Unità</th><th className="p-3 text-right">Quantità</th><th className="p-3 text-right">Costo unitario snapshot</th><th className="p-3 text-right">Costo totale</th><th className="p-3">Azione</th></tr>
          </thead>
          <tbody className="divide-y">
            {dettaglio.righe.map((riga) => (
              <tr key={riga.id}>
                <td className="p-3">{riga.tipo === 'MATERIALE' ? 'Materiale' : 'Componente'}</td>
                <td className="p-3"><div className="font-medium">{riga.nome}</div><div className="text-xs text-muted-foreground">{riga.codice}</div></td>
                <td className="p-3">{riga.unita}</td>
                <td className="p-3 text-right"><form action={aggiornaRigaComposizioneAzione} className="flex justify-end gap-2"><input type="hidden" name="id" value={riga.id} /><input type="hidden" name="composizioneId" value={id} /><input name="quantita" type="number" min="0.001" step="0.001" defaultValue={riga.quantita} className="w-24 rounded-md border p-2 text-right" /><button className="rounded-md border px-3 py-2">Salva</button></form></td>
                <td className="p-3 text-right">{euro.format(riga.costoUnitario)}</td>
                <td className="p-3 text-right font-semibold">{euro.format(riga.costoTotale)}</td>
                <td className="p-3"><form action={rimuoviRigaComposizioneAzione}><input type="hidden" name="id" value={riga.id} /><input type="hidden" name="composizioneId" value={id} /><button className="rounded-md border px-3 py-2 text-sm">Rimuovi</button></form></td>
              </tr>
            ))}
            {dettaglio.righe.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">Nessun componente inserito. Aggiungi materiali e ferramenta per costruire la distinta della composizione.</td></tr>}
          </tbody>
        </table>
      </section>

      <p className="mt-4 text-xs text-muted-foreground">Il prezzo della composizione ({euro.format(dettaglio.composizione.prezzo)}) resta separato dal costo della distinta ({euro.format(dettaglio.costoDistinta)}). Questo permette di aggiungere in seguito lavorazioni e margine commerciale senza perdere il costo storico dei componenti.</p>
    </main>
  );
}
