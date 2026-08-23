'use client';

import { useState } from 'react';

export function BOMCard({ richiestaId }: { richiestaId: string }) {
  const [bomId, setBomId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crea() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/bom', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ richiestaId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Impossibile creare la distinta.');
      }
      setBomId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore BOM');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">Distinta di produzione</p>
          <p className="text-sm text-muted-foreground">
            BOM collegata a questa richiesta.
          </p>
        </div>
        {bomId ? (
          <span className="text-sm font-medium">
            BOM pronta · {bomId.slice(0, 8)}
          </span>
        ) : (
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            disabled={busy}
            onClick={crea}
          >
            {busy ? 'Creazione…' : 'Crea BOM'}
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
