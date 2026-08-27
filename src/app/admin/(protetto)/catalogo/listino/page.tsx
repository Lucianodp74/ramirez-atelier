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

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function primoValore(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default async function ListinoPage({ searchParams }: { searchParams: SearchParams }) {
  const c = await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });
  const [righe, params] = await Promise.all([elencoPrezziListino(c.tenantId), searchParams]);
  const cerca = primoValore(params.q).trim();
  const tipoFiltro = primoValore(params.tipo).trim();
  const categoriaFiltro = primoValore(params.categoria).trim();
  const categorie = [...new Set(righe.map((riga) => riga.categoria))].sort((a, b) => a.localeCompare(b, 'it'));
  const termine = cerca.toLocaleLowerCase('it-IT');
  const righeVisibili = righe.filter((riga) => {
    const testo = [riga.nome, riga.codice, riga.categoria, riga.materiale ?? '', riga.descrizione ?? ''].join(' ').toLocaleLowerCase('it-IT');
    return (!termine || testo.includes(termine)) && (!tipoFiltro || riga.tipo === tipoFiltro) && (!categoriaFiltro || riga.categoria === categoriaFiltro);
  });
  const storici = await Promise.all(righeVisibili.map((riga) => storicoPrezzoListino(c.tenantId, riga.id)));

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <Link href="/admin/catalogo" className="text-sm text-muted-foreground hover:underline">← Catalogo Tecnico</Link>
      <div className="mb-8 mt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Listino del falegname</h1>
        <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
          Un unico listino Atelier per materiali, componenti e composizioni. I prezzi interni hanno priorità sui benchmark; le modifiche vengono storicizzate e non cambiano i costi già salvati nelle BOM.
        </p>
      </div>

      <form action={creaPrezzoListinoAzione} className="mb-6 grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-6">
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

      <form method="get" className="mb-6 grid gap-3 rounded-lg border bg-secondary/20 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm lg:col-span-2">Cerca nel listino<input name="q" defaultValue={cerca} className="mt-1 w-full rounded-md border bg-background p-2" placeholder="es. multistrato, betulla, colonna 90..." /></label>
        <label className="text-sm">Tipo<select name="tipo" defaultValue={tipoFiltro} className="mt-1 w-full rounded-md border bg-background p-2"><option value="">Tutti</option>{tipi.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}</select></label>
        <label className="text-sm">Categoria<select name="categoria" defaultValue={categoriaFiltro} className="mt-1 w-full rounded-md border bg-background p-2"><option value="">Tutte</option>{categorie.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}</select></label>
        <div className="flex items-end gap-2"><button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Filtra</button><Link href="/admin/catalogo/listino" className="rounded-md border px-4 py-2 text-sm">Azzera</Link></div>
      </form>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          {tipi.map((tipo) => {
            const count = righe.filter((riga) => riga.tipo === tipo.value).length;
            return <div key={tipo.value} className="rounded-lg border p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">{tipo.label}</div><div className="mt-1 text-2xl font-semibold">{count}</div></div>;
          })}
        </div>
        <div className="text-sm text-muted-foreground">Visualizzate {righeVisibili.length} di {righe.length} voci</div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[1420px] text-sm">
          <thead className="bg-secondary/40 text-left text-muted-foreground"><tr><th className="p-3">Voce</th><th className="p-3">Tipo</th><th className="p-3">Materiale</th><th className="p-3">Dimensioni</th><th className="p-3">Unità</th><th className="p-3">Prezzo</th><th className="p-3">Stato</th><th className="p-3">Distinta</th><th className="p-3">Aggiorna</th></tr></thead>
          <tbody className="divide-y">
            {righeVisibili.map((riga, indice) => {
              const storico = storici[indice];
              return <tr key={riga.id}>
                <td className="p-3"><div className="font-medium">{riga.tipo === 'COMPOSIZIONE' ? <Link href={`/admin/catalogo/listino/${riga.id}`} className="underline decoration-muted-foreground/40 underline-offset-2 hover:decoration-foreground">{riga.nome}</Link> : riga.nome}</div><div className="text-xs text-muted-foreground">{riga.codice} · {riga.categoria}</div></td>
                <td className="p-3">{tipi.find((tipo) => tipo.value === riga.tipo)?.label ?? riga.tipo}</td>
                <td className="p-3">{riga.materiale ?? '—'}</td>
                <td className="p-3">{dimensioni(riga) ?? '—'}</td>
                <td className="p-3">{riga.unita}</td>
                <td className="p-3 font-semibold">{euro.format(riga.prezzo)}</td>
                <td className="p-3">{riga.attivo ? 'Attivo' : 'Disattivo'}</td>
                <td className="p-3">{riga.tipo === 'COMPOSIZIONE' ? <Link href={`/admin/catalogo/listino/${riga.id}`} className="inline-flex rounded-md border px-3 py-2 font-medium hover:bg-secondary">Apri distinta</Link> : '—'}</td>
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
            {righeVisibili.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Nessuna voce corrisponde ai filtri.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
