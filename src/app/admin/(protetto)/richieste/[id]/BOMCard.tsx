'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { BOMCostSummary } from '@/components/admin/BOMCostSummary';

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

type BenchmarkSuggestion = {
  id: string;
  categoria: string;
  codice: string;
  nome: string;
  descrizione: string | null;
  unita: string;
  prezzoMin: number;
  prezzoMax: number;
  costoConsigliato: number;
  fonte: string;
  fonteUrl: string;
  note: string | null;
};

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

function categoriaBom(categoria: string) {
  if (categoria === 'materiale') return 'MATERIALE';
  if (categoria === 'lavorazione') return 'LAVORAZIONE';
  if (categoria === 'ferramenta') return 'FERRAMENTA';
  return 'COMPONENTE';
}

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
  const [suggerimenti, setSuggerimenti] = useState<BenchmarkSuggestion[]>([]);
  const [ricercaBenchmark, setRicercaBenchmark] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingCosto, setEditingCosto] = useState('');

  useEffect(() => {
    const query = descrizione.trim();
    if (query.length < 2) {
      setSuggerimenti([]);
      setRicercaBenchmark(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setRicercaBenchmark(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (unita.trim()) params.set('unita', unita.trim());
        const response = await fetch(`/api/admin/benchmark?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'Impossibile cercare i benchmark.');
        setSuggerimenti(data.suggerimenti ?? []);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          setSuggerimenti([]);
        }
      } finally {
        if (!controller.signal.aborted) setRicercaBenchmark(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [descrizione, unita]);

  function usaBenchmark(suggerimento: BenchmarkSuggestion) {
    setDescrizione(suggerimento.nome);
    setCategoria(categoriaBom(suggerimento.categoria));
    setUnita(suggerimento.unita);
    setCostoUnitario(String(suggerimento.costoConsigliato));
    setSuggerimenti([]);
  }

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

  async function salvaCosto(rowId: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/bom/righe/${encodeURIComponent(rowId)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          costoUnitario: editingCosto === '' ? null : Number(editingCosto),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Impossibile aggiornare il costo.');
      setEditingRowId(null);
      setEditingCosto('');
      if (bomId) await caricaBom(bomId);
      void data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore aggiornamento costo');
    } finally {
      setBusy(false);
    }
  }

  function avviaModificaCosto(row: BomRow) {
    setEditingRowId(row.id);
    setEditingCosto(row.costoUnitario == null ? '' : String(row.costoUnitario));
  }

  const costSummaryRefreshKey = rows
    .map((row) => `${row.id}:${row.quantita}:${row.costoUnitario ?? ''}`)
    .join('|');

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

          <BOMCostSummary bomId={bomId} refreshKey={costSummaryRefreshKey} />

          <div className="mt-4 overflow-x-auto rounded-md border">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="p-2">Categoria</th>
                  <th className="p-2">Descrizione</th>
                  <th className="p-2">Materiale</th>
                  <th className="p-2">Lavorazione</th>
                  <th className="p-2">Qtà</th>
                  <th className="p-2">Unità</th>
                  <th className="p-2">Costo unit.</th>
                  <th className="p-2">Azione</th>
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
                    <td className="p-2">
                      {editingRowId === row.id ? (
                        <input
                          className="w-28 rounded-md border bg-background p-2"
                          min="0"
                          step="0.01"
                          type="number"
                          value={editingCosto}
                          onChange={(e) => setEditingCosto(e.target.value)}
                          aria-label={`Costo unitario ${row.descrizione}`}
                        />
                      ) : row.costoUnitario === null ? '—' : euro.format(row.costoUnitario)}
                    </td>
                    <td className="p-2">
                      {editingRowId === row.id ? (
                        <div className="flex gap-2">
                          <button
                            className="rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground disabled:opacity-50"
                            type="button"
                            disabled={busy}
                            onClick={() => void salvaCosto(row.id)}
                          >
                            Salva
                          </button>
                          <button
                            className="rounded-md border px-3 py-2 text-xs"
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setEditingRowId(null);
                              setEditingCosto('');
                            }}
                          >
                            Annulla
                          </button>
                        </div>
                      ) : (
                        <button
                          className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted"
                          type="button"
                          onClick={() => avviaModificaCosto(row)}
                        >
                          Modifica costo
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="p-4 text-muted-foreground" colSpan={8}>Nessuna riga ancora inserita.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <form className="mt-5 grid gap-3 rounded-md border p-4" onSubmit={aggiungi}>
            <div>
              <p className="text-sm font-medium">Aggiungi riga alla BOM</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Cerca una voce: il suggerimento usa solo benchmark di tipo COSTO. Il valore proposto è il punto medio del range e resta modificabile.
              </p>
            </div>
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

            {(ricercaBenchmark || suggerimenti.length > 0) && (
              <div className="rounded-md border bg-muted/20 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">Suggerimenti dal listino benchmark</p>
                  {ricercaBenchmark && <span className="text-xs text-muted-foreground">Ricerca…</span>}
                </div>
                <div className="space-y-2">
                  {suggerimenti.map((suggerimento) => (
                    <div key={suggerimento.id} className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{suggerimento.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {suggerimento.categoria} · {suggerimento.unita} · {euro.format(suggerimento.prezzoMin)} – {euro.format(suggerimento.prezzoMax)}
                        </p>
                        <p className="text-xs text-muted-foreground">Fonte: {suggerimento.fonte}</p>
                      </div>
                      <button
                        className="shrink-0 rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted"
                        type="button"
                        onClick={() => usaBenchmark(suggerimento)}
                      >
                        Usa {euro.format(suggerimento.costoConsigliato)}
                      </button>
                    </div>
                  ))}
                  {!ricercaBenchmark && suggerimenti.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nessun costo benchmark trovato per questa ricerca.</p>
                  )}
                </div>
              </div>
            )}

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
