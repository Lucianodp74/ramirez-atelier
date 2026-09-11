'use client';

import type { RigaCostoModulo } from '@/lib/preventivatore/prezzo-modulare';

function fmt(value: number | undefined) {
  if (value === undefined) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function PreventivatoreBOMParametrica({ righe }: { righe: RigaCostoModulo[] }) {
  return (
    <div className="space-y-4">
      {righe.map((riga) => (
        <section key={riga.id} className="rounded-xl border p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">{riga.tipo}</h3>
              <p className="text-sm text-muted-foreground">Modulo {riga.id}</p>
            </div>
            <div className="text-right text-sm">
              <div>Costo produzione: <strong>€ {riga.costoProduzione.toFixed(2)}</strong></div>
              <div className="text-muted-foreground">Stima commerciale: € {riga.prezzoIndicativo.toFixed(2)}</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left"><th className="py-2 pr-3">Componente</th><th className="py-2 pr-3">Qtà</th><th className="py-2 pr-3">Dimensioni</th><th className="py-2">Note</th></tr></thead>
              <tbody>
                {riga.distinta.componenti.map((c) => (
                  <tr key={c.codice} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{c.voce}</td>
                    <td className="py-2 pr-3">{fmt(c.quantita)} {c.unita}</td>
                    <td className="py-2 pr-3">{c.larghezzaCm !== undefined ? `${fmt(c.larghezzaCm)} × ${fmt(c.altezzaCm)} cm` : '—'}</td>
                    <td className="py-2 text-muted-foreground">{c.note ?? 'Dimensione parametrica'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Distinta parametrica preliminare: non sostituisce il disegno esecutivo e va verificata prima della produzione.</p>
        </section>
      ))}
    </div>
  );
}
