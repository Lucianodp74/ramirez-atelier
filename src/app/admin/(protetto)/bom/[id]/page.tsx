import Link from 'next/link';
import { notFound } from 'next/navigation';
import { richiediContesto } from '@/server/identity/contesto';
import { dettaglioBomAdmin } from '@/server/services/bom-admin-service';
import { ultimoPreventivoBom } from '@/server/services/bom-preventivo-service';
import { PreventivoSummary } from './preventivo-summary';

export default async function BomAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
  const bom = await dettaglioBomAdmin(contesto.tenantId, id);
  if (!bom) notFound();
  const costoProduzione = bom.righe.reduce((totale, riga) => totale + (riga.costoUnitario ?? 0) * riga.quantita, 0);
  const preventivoSalvato = await ultimoPreventivoBom(contesto.tenantId, id);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <Link href="/admin/bom" className="text-sm underline">← Distinte base</Link>
      <div className="mt-4 mb-6 flex items-start justify-between gap-4"><div><p className="text-sm text-slate-500">Richiesta {bom.richiestaId}</p><h1 className="text-3xl font-semibold">BOM v{bom.versione}</h1></div><span className="rounded-full border px-3 py-1 text-sm">{bom.stato}</span></div>
      <section className="overflow-hidden rounded-lg border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Codice</th><th className="px-4 py-3">Descrizione</th><th className="px-4 py-3">Unità</th><th className="px-4 py-3 text-right">Quantità</th><th className="px-4 py-3 text-right">Costo unitario</th></tr></thead><tbody className="divide-y">{bom.righe.map(riga=><tr key={riga.id}><td className="px-4 py-3">{riga.categoria}</td><td className="px-4 py-3">{riga.codice??'—'}</td><td className="px-4 py-3">{riga.descrizione}</td><td className="px-4 py-3">{riga.unita}</td><td className="px-4 py-3 text-right">{riga.quantita}</td><td className="px-4 py-3 text-right">{riga.costoUnitario??'—'}</td></tr>)}</tbody></table></section>
      <PreventivoSummary costoProduzione={costoProduzione} bomId={bom.id} bomStato={bom.stato} preventivoSalvato={preventivoSalvato} />
    </main>
  );
}
