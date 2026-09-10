import Link from 'next/link';
import { richiediContesto } from '@/server/identity/contesto';
import { elencoPrezziListino } from '@/server/services/listino-prezzi-service';
import { CATALOGO_MODULI } from '@/lib/preventivatore/moduli';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

const requisiti = [
  ['MAT-TRUCIOLARE', 'Truciolare', 'M2'], ['MAT-MDF', 'MDF', 'M2'], ['MAT-MULTISTRATO', 'Multistrato', 'M2'],
  ['FIN-MELAMINICO', 'Melaminico', 'M2'], ['FIN-LAMINATO', 'Laminato', 'M2'], ['FIN-LACCATO', 'Laccato', 'M2'],
  ['SERV-BORDO-ML', 'Bordatura', 'ML'], ['MAT-RETRO-M2', 'Retro', 'M2'], ['FER-PORTA', 'Ferramenta porta', 'PZ'],
  ['FER-CASSETTO', 'Ferramenta cassetto', 'PZ'], ['MAN-ORE-BASE', 'Ore base', 'H'], ['MAN-ORE-M2', 'Ore per m²', 'H/M2'],
  ['MAN-ORE-PORTA', 'Ore per porta', 'H/PZ'], ['MAN-ORE-CASSETTO', 'Ore per cassetto', 'H/PZ'], ['MAN-ORE-RIPIANO', 'Ore per ripiano', 'H/PZ'],
  ['MAN-COSTO-ORA', 'Costo orario', 'EUR/H'], ['COMM-RICARICO', 'Ricarico commerciale', '%'],
] as const;

export default async function PreventivatoreCatalogoPage() {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });
  const listino = await elencoPrezziListino(contesto.tenantId);
  const perCodice = new Map(listino.map((voce) => [voce.codice, voce]));
  const configurato = requisiti.filter(([codice, , unita]) => {
    const voce = perCodice.get(codice);
    return Boolean(voce?.attivo && voce.unita === unita);
  }).length;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <Link href="/admin/catalogo" className="text-sm text-muted-foreground hover:underline">← Catalogo Tecnico</Link>
      <div className="mb-8 mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Controllo Preventivatore</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Verifica tecnica del catalogo usato dal motore di stima. I prezzi vengono letti dal Listino reale; questa pagina non contiene prezzi di fallback.</p>
        </div>
        <Link href="/preventivatore" className="rounded-md border px-4 py-2 text-sm">Apri preventivatore cliente</Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Moduli disponibili</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{CATALOGO_MODULI.length}</p><p className="text-xs text-muted-foreground">Configurazioni tecniche V2</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Tariffe configurate</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{configurato}/{requisiti.length}</p><p className="text-xs text-muted-foreground">Codici attivi con unità corretta</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Stato</CardTitle></CardHeader><CardContent><p className={`text-lg font-semibold ${configurato === requisiti.length ? 'text-foreground' : 'text-destructive'}`}>{configurato === requisiti.length ? 'Pronto al calcolo' : 'Listino incompleto'}</p><p className="text-xs text-muted-foreground">Completa le voci mancanti dal Listino</p></CardContent></Card>
      </div>

      <section className="mt-8"><Card><CardHeader><CardTitle>Tariffe richieste dal motore</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="border-b text-left text-muted-foreground"><tr><th className="p-3">Codice</th><th className="p-3">Voce</th><th className="p-3">Unità richiesta</th><th className="p-3">Stato</th><th className="p-3 text-right">Valore</th><th className="p-3">Azione</th></tr></thead><tbody className="divide-y">{requisiti.map(([codice, nome, unita]) => { const voce = perCodice.get(codice); const ok = Boolean(voce?.attivo && voce.unita === unita); return <tr key={codice}><td className="p-3 font-mono text-xs">{codice}</td><td className="p-3">{nome}</td><td className="p-3">{unita}</td><td className="p-3">{ok ? '✓ Configurata' : '⚠ Da configurare'}</td><td className="p-3 text-right font-semibold">{ok && voce ? euro.format(voce.prezzo) : '—'}</td><td className="p-3"><Link href={`/admin/catalogo/listino?q=${encodeURIComponent(codice)}`} className="underline underline-offset-2">Apri Listino</Link></td></tr>; })}</tbody></table></div></CardContent></Card></section>

      <section className="mt-8"><Card><CardHeader><CardTitle>Famiglie di moduli</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{CATALOGO_MODULI.map((m) => <div key={m.codice} className="rounded-lg border p-4"><p className="font-medium">{m.nome}</p><p className="mt-1 text-xs text-muted-foreground">{m.min.larghezzaCm}–{m.max.larghezzaCm} × {m.min.altezzaCm}–{m.max.altezzaCm} × {m.min.profonditaCm}–{m.max.profonditaCm} cm</p><p className="mt-2 text-xs text-muted-foreground">{m.materiali.length} materiali · {m.finiture.length} finiture · {m.configurazioni.length} configurazioni</p></div>)}</div></CardContent></Card></section>
    </main>
  );
}
