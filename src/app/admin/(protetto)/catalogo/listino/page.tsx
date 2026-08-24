import Link from 'next/link';
import { richiediContesto } from '@/server/identity/contesto';
import { elencoPrezziListino, storicoPrezzoListino } from '@/server/services/listino-prezzi-service';
import { creaPrezzoListinoAzione, aggiornaPrezzoListinoAzione, impostaAttivoPrezzoListinoAzione } from '@/app/admin/azioni';

export const dynamic = 'force-dynamic';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

export default async function ListinoPage() {
  const c = await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });
  const righe = await elencoPrezziListino(c.tenantId);
  const storici = await Promise.all(righe.map((riga) => storicoPrezzoListino(c.tenantId, riga.id)));

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link href="/admin/catalogo" className="text-sm text-muted-foreground hover:underline">← Catalogo Tecnico</Link>
      <div className="mb-8 mt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Listino del falegname</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">I tuoi prezzi interni hanno priorità sui benchmark. Le modifiche al prezzo vengono storicizzate e non cambiano i costi già salvati nelle BOM.</p>
      </div>

      <form action={creaPrezzoListinoAzione} className="mb-8 grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className="text-sm">Categoria<input name="categoria" required className="mt-1 w-full rounded-md border p-2" placeholder="ferramenta" /></label>
        <label className="text-sm">Codice<input name="codice" required className="mt-1 w-full rounded-md border p-2" placeholder="BLUM-110" /></label>
        <label className="text-sm lg:col-span-2">Nome<input name="nome" required className="mt-1 w-full rounded-md border p-2" placeholder="Cerniera Blum 110°" /></label>
        <label className="text-sm">Unità<input name="unita" required className="mt-1 w-full rounded-md border p-2" placeholder="pz" /></label>
        <label className="text-sm">Prezzo<input name="prezzo" required min="0" step="0.01" type="number" className="mt-1 w-full rounded-md border p-2" /></label>
        <label className="text-sm lg:col-span-5">Descrizione<input name="descrizione" className="mt-1 w-full rounded-md border p-2" placeholder="Costo reale del fornitore" /></label>
        <div className="flex items-end"><button className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Aggiungi prezzo</button></div>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-secondary/40 text-left text-muted-foreground"><tr><th className="p-3">Voce</th><th className="p-3">Categoria</th><th className="p-3">Unità</th><th className="p-3">Prezzo attuale</th><th className="p-3">Stato</th><th className="p-3">Aggiorna prezzo</th></tr></thead>
          <tbody className="divide-y">
            {righe.map((riga, indice) => {
              const storico = storici[indice];
              return (
                <tr key={riga.id}>
                  <td className="p-3"><div className="font-medium">{riga.nome}</div><div className="text-xs text-muted-foreground">{riga.codice}</div></td>
                  <td className="p-3">{riga.categoria}</td>
                  <td className="p-3">{riga.unita}</td>
                  <td className="p-3 font-semibold">{euro.format(riga.prezzo)}</td>
                  <td className="p-3">{riga.attivo ? 'Attivo' : 'Disattivo'}</td>
                  <td className="p-3">
                    <form action={aggiornaPrezzoListinoAzione} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={riga.id} />
                      <input name="prezzo" required min="0" step="0.01" type="number" defaultValue={riga.prezzo} className="w-28 rounded-md border p-2" />
                      <input name="motivo" className="w-44 rounded-md border p-2" placeholder="motivo (opzionale)" />
                      <button className="rounded-md border px-3 py-2">Salva</button>
                      <button formAction={impostaAttivoPrezzoListinoAzione.bind(null, riga.id, !riga.attivo)} className="rounded-md border px-3 py-2">{riga.attivo ? 'Disattiva' : 'Riattiva'}</button>
                      {storico.length > 0 && <span className="text-xs text-muted-foreground">Storico: {storico.length} modifiche</span>}
                    </form>
                  </td>
                </tr>
              );
            })}
            {righe.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nessun prezzo personale inserito.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
