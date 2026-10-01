'use client';

import { useState } from 'react';

export function GeneraPropostaBom({ richiestaId }: { richiestaId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function genera() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/admin/bom/proposta', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ richiestaId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Impossibile generare la BOM proposta.');

      const avvertenze = Array.isArray(data.avvertenze) ? data.avvertenze : [];
      setMessage(
        data.righeAggiunte > 0
          ? `BOM proposta generata: ${data.righeAggiunte} righe aggiunte.${avvertenze.length ? ` ${avvertenze[0]}` : ''}`
          : 'La BOM esistente non è stata modificata.',
      );
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore generazione BOM.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">BOM proposta automatica</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Crea una prima distinta usando le dimensioni e le scelte del cliente e i costi del Listino Ramirez. Resta sempre modificabile prima della conferma.
          </p>
        </div>
        <button
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          disabled={busy}
          type="button"
          onClick={() => void genera()}
        >
          {busy ? 'Generazione…' : 'Genera BOM proposta'}
        </button>
      </div>
      {message && <p className="mt-3 text-xs text-muted-foreground">{message}</p>}
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </div>
  );
}
