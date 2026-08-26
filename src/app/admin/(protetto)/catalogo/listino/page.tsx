import Link from 'next/link';
import { richiediContesto } from '@/server/identity/contesto';
import { elencoPrezziListino, storicoPrezzoListino } from '@/server/services/listino-prezzi-service';
import {
  creaPrezzoListinoAzione,
  aggiornaPrezzoListinoAzione,
  impostaAttivoPrezzoListinoAzione,
} from '@/app/admin/listino-azioni';

export const dynamic = 'force-dynamic';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const tipi = [
  { value: 'MATERIALE', label: 'Materiale' },
  { value: 'COMPONENTE', label: 'Componente' },
  { value: 'COMPOSIZIONE', label: 'Composizione / modulo' },
] as const;

function dimensioni(riga: { larghezzaCm: number | null; altezzaCm: number | null; profonditaCm: number | null }) {
  const valori = [riga.larghezzaCm, riga.altezzaCm, riga.profonditaCm];
  if (valori.every((valore) => valore == null)) return null;
  return `${valori.map((valore) => (valore == null ? '—' : valore)).join(' × ')} cm`;
}

export default async function ListinoPage() {
  const c = await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });
  const righe = await elencoPrezziListino(c.tenantId);
  const storici = await Promise.all(righe.map((riga) => storicoPrezzoListino(c.tenantId, riga.id)));

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <Link href="/admin/catalogo" className="text-sm text-muted-foreground hover:underline">← Catalogo Tecnico</Link>
      <div className="mb-8 mt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Listino del falegname</h1>
        <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
          Un unico listino Atelier per materiali, componenti e composizioni. I prezzi interni hanno priorità sui benchmark; le modifiche vengono storicizzate e non cambiano i costi già salvati nelle BOM.
        </p>
      </div>

      <form action={creaPrezzoListinoAzione} className="mb-8 grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className="text-sm">Tipo<select name="tipo" defaultValue="COMPONENTE" className="mt-1 w-full rounded-md border p-2">{tipi.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}</select></label>
        <label className="text-sm">Categoria<input name="categoria" required className="mt-1 w-full rounded-md border p-2" placeholder="pannelli" /></label>
        <label className="text-sm">Codice<input name="codice" required className="mt-1 w-full rounded-md border p-2" placeholder="MUL-BET-18" /></label>
        <label className="text-sm lg:col-span-2">Nome<input name="nome" required className="mt-1 w-full rounded-md border p-2" placeholder="Multistrato betulla 18 mm" /></label>
        <label className="text-sm">Unità<input name="unita" required className="mt-1 w-full rounded-md border p-2" placeholder="m² / ml / m³ / pz" /></label>
        <label className="text-sm">Prezzo<input name="prezzo" required min="0" step="0.01" type="number" className="mt-1 w-full rounded-md border p-2" /></label>
        <label className="text-sm lg:col-span-2">Materiale / essenza<input name="materiale" className="mt-1 w-full rounded-md border p-2" placeholder="Betulla, MDF, rovere..." /></label>
        <label className="text-sm">Larghezza cm<input name="larghezzaCm" min="0" step="0.01" type="number" className="mt-1 w-full rounded-md border p-2" placeholder="90" /></label>
        <label className="text-sm">Altezza cm<input name="altezzaCm" min="0" step="0.01" type="number" className="mt-1 w-full rounded-md border p-2" placeholder="260" /></label>
        <label className="text-sm">Profondità cm<input name="profonditaCm" min="0" step="0.01" type="number" className="mt-1 w-full rounded-md border p-2" placeholder="60" /></label>
        <label className="text-sm lg:col-span-5">Descrizione<input name="descrizione" className="mt-1 w-full rounded-md border p-2" placeholder="Per una composizione: configurazione, ante, ripiani, schiena, finitura..." /></label>
        <div className="flex items-end"><button className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Aggiungi al listino</button></div>
      </form>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {tipi.map((tipo) => {
          const count = righe.filter((riga) => riga.tipo === tipo.value).length;
          return <div key={tipo.value} className="rounded-lg border p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">{tipo.label}</div><div className="mt-1 text-2xl font-semibold">{count}</div></div>;
        })}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[1300px] text-sm">
          <thead className="bg-secondary/40 text-left text-muted-foreground"><tr><th className="p-3">Voce</th><th className="p-3">Tipo</th><th className="p-3">Materiale</th><th className="p-3">Dimensioni</th><th className="p-3">Unità</th><th className="p-3">Prezzo</th><th className="p-3">Stato</th><th className="p-3">Aggiorna</th></tr></thead>
          <tbody className="divide-y">
            {righe.map((riga, indice) => {
              const storico = storici[indice];
              return <tr key={riga.id}>
                <td className="p-3"><div className="font-medium">{riga.nome}</div><div className="text-xs text-muted-foreground">{riga.codice} · {riga.categoria}</div></td>
                <td className="p-3">{tipi.find((tipo) => tipo.value === riga.tipo)?.label ?? riga.tipo}</td>
                <td className="p-3">{riga.materiale ?? '—'}</td>
                <td className="p-3">{dimensioni(riga) ?? '—'}</td>
                <td className="p-3">{riga.unita}</td>
                <td className="p-3 font-semibold">{euro.format(riga.prezzo)}</td>
                <td className="p-3">{riga.attivo ? 'Attivo' : 'Disattivo'}</td>
                <td className="p-3"><form action={aggiornaPrezzoListinoAzione} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={riga.id} />
                  <input name="prezzo" required min="0" step="0.01" type="number" defaultValue={riga.prezzo} className="w-28 rounded-md border p-2" />
                  <input name="motivo" className="w-44 rounded-md border p-2" placeholder="motivo (opzionale)" />
                  <button className="rounded-md border px-3 py-2">Salva</button>
                  <button formAction={impostaAttivoPrezzoListinoAzione.bind(null, riga.id, !riga.attivo)} className="rounded-md border px-3 py-2">{riga.attivo ? 'Disattiva' : 'Riattiva'}</button>
                  {storico.length > 0 && <span className="text-xs text-muted-foreground">Storico: {storico.length}</span>}
                </form></td>
              </tr>;
            })}
            {righe.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nessun prezzo personale inserito.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
