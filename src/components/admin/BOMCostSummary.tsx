'use client';

import { useEffect, useState } from 'react';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

type Summary = {
  righeConCosto: number;
  righeSenzaCosto: number;
  subtotale: number;
  categorie: Array<{ categoria: string; totale: number; righe: number }>;
  completo: boolean;
};

export function BOMCostSummary({ bomId }: { bomId: string | null }) {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    if (!bomId) {
      setSummary(null);
      return;
    }
    let active = true;
    fetch(`/api/admin/bom/prezzo?bomId=${encodeURIComponent(bomId)}`)
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as Summary;
      })
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) setSummary(null);
      });
    return () => {
      active = false;
    };
  }, [bomId]);

  if (!summary) return null;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">Costo di produzione BOM</p>
          <p className="text-xs text-muted-foreground">
            Il costo resta separato dal prezzo di vendita del preventivo.
          </p>
        </div>
        <p className="text-xl font-semibold">{euro.format(summary.subtotale)}</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Righe con costo</p>
          <p className="mt-1 font-semibold">{summary.righeConCosto}</p>
        </div>
        <div className="rounded-md bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Righe senza costo</p>
          <p className="mt-1 font-semibold">{summary.righeSenzaCosto}</p>
        </div>
        <div className="rounded-md bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Stato</p>
          <p className="mt-1 font-semibold">{summary.completo ? 'Completo' : 'Da valorizzare'}</p>
        </div>
      </div>

      {summary.categorie.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Ripartizione costi</p>
          {summary.categorie.map((item) => (
            <div key={item.categoria} className="flex items-center justify-between text-sm">
              <span>{item.categoria} · {item.righe} righe</span>
              <span className="font-medium">{euro.format(item.totale)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
