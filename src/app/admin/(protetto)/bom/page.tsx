import Link from 'next/link';
import { richiediContesto } from '@/server/identity/contesto';
import { listaBomAdmin } from '@/server/services/bom-admin-service';

export default async function BomAdminPage() {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
  const bom = await listaBomAdmin(contesto.tenantId);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Amministrazione</p>
          <h1 className="text-3xl font-semibold">Distinte base</h1>
          <p className="mt-1 text-sm text-slate-600">BOM del tenant corrente, con stato e numero di righe.</p>
        </div>
      </div>

      {bom.length === 0 ? (
        <section className="rounded-lg border border-dashed p-8 text-center text-slate-500">
          Nessuna BOM presente. Crea la prima BOM dalla richiesta di progetto.
        </section>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Richiesta</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3">Versione</th>
                <th className="px-4 py-3">Righe</th>
                <th className="px-4 py-3">Aggiornata</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {bom.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium">{item.richiestaId}</td>
                  <td className="px-4 py-3">{item.stato}</td>
                  <td className="px-4 py-3">v{item.versione}</td>
                  <td className="px-4 py-3">{item.righeCount}</td>
                  <td className="px-4 py-3">{item.updatedAt.toLocaleString('it-IT')}</td>
                  <td className="px-4 py-3 text-right">
                    <Link className="font-medium underline" href={`/admin/bom/${item.id}`}>Apri</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
