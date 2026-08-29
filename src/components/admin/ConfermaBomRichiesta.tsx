'use client';

import { useCallback, useEffect, useState } from 'react';

type Bom = { id: string; richiestaId: string; stato: string; righe: Array<{ costoUnitario: number | null }> };

export function ConfermaBomRichiesta({ richiestaId }: { richiestaId: string }) {
  const [bom, setBom] = useState<Bom | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const carica = useCallback(async () => {
    const response = await fetch(`/api/admin/bom?richiestaId=${encodeURIComponent(richiestaId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Impossibile leggere la BOM.');
    const candidata = Array.isArray(data.data) ? data.data[0] : null;
    if (!candidata?.id) { setBom(null); return; }
    const dettaglioResponse = await fetch(`/api/admin/bom?id=${encodeURIComponent(candidata.id)}`);
    const dettaglio = await dettaglioResponse.json();
    if (!dettaglioResponse.ok) throw new Error(dettaglio.error ?? 'Impossibile leggere il dettaglio della BOM.');
    setBom({ id: dettaglio.id, richiestaId: dettaglio.richiestaId, stato: dettaglio.stato, righe: Array.isArray(dettaglio.righe) ? dettaglio.righe : [] });
  }, [richiestaId]);

  useEffect(() => { void carica().catch((e) => setError(e instanceof Error ? e.message : 'Impossibile leggere la BOM.')); }, [carica]);

  async function conferma() {
    if (!bom) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch('/api/admin/bom/conferma', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ bomId: bom.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Impossibile confermare la BOM.');
      setMessage('BOM confermata. Ora puoi salvare il preventivo.'); await carica();
    } catch (e) { setError(e instanceof Error ? e.message : 'Errore conferma BOM'); }
    finally { setBusy(false); }
  }

  if (!bom || bom.stato !== 'BOZZA') return null;
  const completa = bom.righe.length > 0 && bom.righe.every((riga) => riga.costoUnitario != null);

  return <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-medium text-emerald-900">BOM in bozza</p><p className="text-sm text-emerald-800">{completa ? 'Tutte le righe hanno un costo: la BOM è pronta per essere confermata.' : 'Completa tutti i costi delle righe prima di confermare.'}</p></div>
      <button type="button" onClick={() => void conferma()} disabled={busy || !completa} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Conferma…' : 'Conferma BOM'}</button>
    </div>
    {message && <p className="mt-2 text-sm font-medium text-emerald-800">{message}</p>}
    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
  </div>;
}
