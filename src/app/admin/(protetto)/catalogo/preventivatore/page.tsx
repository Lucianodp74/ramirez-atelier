import Link from 'next/link';
import { richiediContesto } from '@/server/identity/contesto';
import { elencoPrezziListino } from '@/server/services/listino-prezzi-service';
import { DEFINIZIONI_TARIFFE_PREVENTIVATORE } from '@/lib/preventivatore/tariffe';
import { CATALOGO_MODULI } from '@/lib/preventivatore/moduli';
import PreventivatoreTestBench from '@/components/admin/PreventivatoreTestBench';
import SetupListinoPreventivatore from '@/components/admin/SetupListinoPreventivatore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

export default async function PreventivatoreCatalogoPage() {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });
  const listino = await elencoPrezziListino(contesto.tenantId);
  const perCodice = new Map(listino.map((voce) => [voce.codice, voce]));
  const configurato = DEFINIZIONI_TARIFFE_PREVENTIVATORE.filter((def) => { const voce = perCodice.get(def.codice); return Boolean(voce?.attivo && voce.unita === def.unita && voce.prezzo > 0); }).length;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <Link href="/admin/catalogo" className="text-sm text-muted-foreground hover:underline">← Catalogo Tecnico</Link>
      <div className="mb-8 mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight">Controllo Preventivatore</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Verifica tecnica del catalogo usato dal motore di stima. I prezzi vengono letti dal Listino reale; nessun prezzo demo viene usato come fallback.</p></div><Link href="/preventivatore" className="rounded-md border px-4 py-2 text-sm">Apri preventivatore cliente</Link></div>
      <section className="mb-8"><SetupListinoPreventivatore /></section>
      <div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle>Moduli disponibili</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{CATALOGO_MODULI.length}</p><p className="text-xs text-muted-foreground">Configurazioni tecniche V2</p></CardContent></Card><Card><CardHeader><CardTitle>Tariffe configurate</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{configurato}/{DEFINIZIONI_TARIFFE_PREVENTIVATORE.length}</p><p className="text-xs text-muted-foreground">Codici attivi con unità corretta e valore maggiore di zero</p></CardContent></Card><Card><CardHeader><CardTitle>Stato</CardTitle></CardHeader><CardContent><p className={`text-lg font-semibold ${configurato === DEFINIZIONI_TARIFFE_PREVENTIVATORE.length ? 'text-foreground' : 'text-destructive'}`}>{configurato === DEFINIZIONI_TARIFFE_PREVENTIVATORE.length ? 'Pronto al calcolo' : 'Listino da completare'}</p><p className="text-xs text-muted-foreground">Inserisci i valori Ramirez prima di usare il preventivo commerciale</p></CardContent></Card></div>
      <section className="mt-8"><Card><CardHeader><CardTitle>Banco prova prezzi</CardTitle></CardHeader><CardContent><PreventivatoreTestBench /></CardContent></Card></section>
      <section className="mt-8"><Card><CardHeader><CardTitle>Tariffe richieste dal motore</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="border-b text-left text-muted-foreground"><tr><th className="p-3">Codice</th><th className="p-3">Voce</th><th className="p-3">Tipo</th><th className="p-3">Unità richiesta</th><th className="p-3">Stato</th><th className="p-3 text-right">Valore</th><th className="p-3">Azione</th></tr></thead><tbody className="divide-y">{DEFINIZIONI_TARIFFE_PREVENTIVATORE.map((def) => { const voce = perCodice.get(def.codice); const ok = Boolean(voce?.attivo && voce.unita === def.unita && voce.prezzo > 0); return <tr key={def.codice}><td className="p-3 font-mono text-xs">{def.codice}</td><td className="p-3">{def.nome}</td><td className="p-3">{def.tipo}</td><td className="p-3">{def.unita}</td><td className="p-3">{ok ? '✓ Configurata' : voce ? '⚠ Da completare/verificare' : '⚠ Da predisporre'}</td><td className="p-3 text-right font-semibold">{ok && voce ? euro.format(voce.prezzo) : '—'}</td><td className="p-3"><Link href={`/admin/catalogo/listino?q=${encodeURIComponent(def.codice)}`} className="underline underline-offset-2">Apri Listino</Link></td></tr>; })}</tbody></table></div></CardContent></Card></section>
      <section className="mt-8"><Card><CardHeader><CardTitle>Famiglie di moduli</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{CATALOGO_MODULI.map((m) => <div key={m.codice} className="rounded-lg border p-4"><p className="font-medium">{m.nome}</p><p className="mt-1 text-xs text-muted-foreground">{m.min.larghezzaCm}–{m.max.larghezzaCm} × {m.min.altezzaCm}–{m.max.altezzaCm} × {m.min.profonditaCm}–{m.max.profonditaCm} cm</p><p className="mt-2 text-xs text-muted-foreground">{m.materiali.length} materiali · {m.finiture.length} finiture · {m.configurazioni.length} configurazioni</p></div>)}</div></CardContent></Card></section>
    </main>
  );
}
