'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

type BomRow = {
  id: string;
  categoria: string;
  codice: string | null;
  descrizione: string;
  unita: string;
  quantita: number;
  materiale: string | null;
  lavorazione: string | null;
  costoUnitario: number | null;
  note: string | null;
};

type BomCostSummary = {
  righeConCosto: number;
  righeSenzaCosto: number;
  subtotale: number;
  categorie: Array<{ categoria: string; totale: number; righe: number }>;
  completo: boolean;
};

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

export function BOMCard({ richiestaId }: { richiestaId: string }) {
  const [bomId, setBomId] = useState<string | null>(null);
  const [rows, setRows] = useState<BomRow[]>([]);
  const [summary, setSummary] = useState<BomCostSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descrizione, setDescrizione] = useState('');
  const [categoria, setCategoria] = useState('COMPONENTE');
  const [quantita, setQuantita] = useState('1');
  const [unita, setUnita] = useState('pz');
  const [materiale, setMateriale] = useState('');
  const [lavorazione, setLavorazione] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');

  async function caricaBom(id: string) {
    const response = await fetch(`/api/admin/bom?id=${encodeURIComponent(id)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Impossibile leggere la distinta.');
    setBomId(id);
    setRows(data.righe ?? []);

    const costResponse = await fetch(`/api/admin/bom/prezzo?bomId=${encodeURIComponent(id)}`);
    const costData = await costResponse.json();
    if (!costResponse.ok) throw new Error(costData.error ?? 'Impossibile calcolare il riepilogo costi.');
    setSummary(costData);
  }

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
      if (!response.ok) throw new Error(data.error ?? 'Impossibile creare la distinta.');
      await caricaBom(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore BOM');
    } finally {
      setBusy(false);
    }
  }

  async function aggiungi(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!bomId) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/bom/righe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          bomId,
          categoria,
          descrizione,
          quantita: Number(quantita),
          unita,
          materiale: materiale || null,
          lavorazione: lavorazione || null,
          costoUnitario: costoUnitario === '' ? null : Number(costoUnitario),
          ordinamento: rows.length,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Impossibile aggiungere la riga.');
      setDescrizione('');
      setQuantita('1');
      setMateriale('');
      setLavorazione('');
      setCostoUnitario('');
      await caricaBom(bomId);
      void data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore riga BOM');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Distinta di produzione</p>
          <p className="text-sm text-muted-foreground">BOM interna collegata a questa richiesta.</p>
        </div>
        {!bomId && (
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            disabled={busy}
            onClick={crea}
          >
            {busy ? 'Creazione…' : 'Crea BOM'}
          </button>
        )}
      </div>

      {bomId && (
        <>
          <div className="mt-4 rounded-md bg-muted/40 p-3 text-sm">
            <span className="font-medium">BOM {bomId.slice(0, 8)}</span>
            <span className="ml-2 text-muted-foreground">{rows.length} righe</span>
          </div>

          {summary && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Subtotale costi</p>
                <p className="mt-1 text-lg font-semibold">{euro.format(summary.subtotale)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Righe valorizzate</p>
                <p className="mt-1 text-lg font-semibold">{summary.righeConCosto} / {rows.length}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Stato pricing</p>
                <p className="mt-1 text-sm font-semibold">{summary.completo ? 'Completo' : 'Incompleto'}</p>
                {!summary.completo && <p className="mt-1 text-xs text-muted-foreground">Mancano {summary.righeSenzaCosto} costi unitari.</p>}
              </div>
            </div>
          )}

          {summary && summary.categorie.length > 0 && (
            <div className="mt-4 rounded-md border p-3">
              <p className="mb-2 text-sm font-medium">Costi per categoria</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {summary.categorie.map((item) => (
                  <div key={item.categoria} className="flex items-center justify-between text-sm">
                    <span>{item.categoria} <span className="text-muted-foreground">({item.righe})</span></span>
                    <span className="font-medium">{euro.format(item.totale)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 overflow-x-auto rounded-md border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="p-2">Categoria</th>
                  <th className="p-2">Descrizione</th>
                  <th className="p-2">Materiale</th>
                  <th className="p-2">Lavorazione</th>
                  <th className="p-2">Qtà</th>
                  <th className="p-2">Unità</th>
                  <th className="p-2">Costo unit.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-2">{row.categoria}</td>
                    <td className="p-2">{row.descrizione}</td>
                    <td className="p-2">{row.materiale ?? '—'}</td>
                    <td className="p-2">{row.lavorazione ?? '—'}</td>
                    <td className="p-2">{row.quantita}</td>
                    <td className="p-2">{row.unita}</td>
                    <td className="p-2">{row.costoUnitario === null ? '—' : euro.format(row.costoUnitario)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="p-4 text-muted-foreground" colSpan={7}>Nessuna riga ancora inserita.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <form className="mt-5 grid gap-3 rounded-md border p-4" onSubmit={aggiungi}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm">Categoria
                <select className="mt-1 w-full rounded-md border bg-background p-2" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  <option>COMPONENTE</option><option>MATERIALE</option><option>LAVORAZIONE</option><option>FERRAMENTA</option><option>ALTRO</option>
                </select>
              </label>
              <label className="text-sm sm:col-span-1 lg:col-span-2">Descrizione
                <input className="mt-1 w-full rounded-md border bg-background p-2" required value={descrizione} onChange={(e) => setDescrizione(e.target.value)} />
              </label>
              <label className="text-sm">Quantità
                <input className="mt-1 w-full rounded-md border bg-background p-2" min="0.0001" step="any" type="number" required value={quantita} onChange={(e) => setQuantita(e.target.value)} />
              </label>
              <label className="text-sm">Unità
                <input className="mt-1 w-full rounded-md border bg-background p-2" value={unita} onChange={(e) => setUnita(e.target.value)} />
              </label>
              <label className="text-sm">Materiale
                <input className="mt-1 w-full rounded-md border bg-background p-2" value={materiale} onChange={(e) => setMateriale(e.target.value)} />
              </label>
              <label className="text-sm">Lavorazione
                <input className="mt-1 w-full rounded-md border bg-background p-2" value={lavorazione} onChange={(e) => setLavorazione(e.target.value)} />
              </label>
              <label className="text-sm">Costo unitario
                <input className="mt-1 w-full rounded-md border bg-background p-2" min="0" step="0.01" type="number" value={costoUnitario} onChange={(e) => setCostoUnitario(e.target.value)} />
              </label>
            </div>
            <div>
              <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50" disabled={busy} type="submit">
                {busy ? 'Salvataggio…' : 'Aggiungi riga'}
              </button>
            </div>
          </form>
        </>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}
