'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ConfigurazioneModulo, Finitura, Materiale, ModuloConfigurato, ModuloTipo } from '@/lib/preventivatore/moduli';
import { CATALOGO_MODULI } from '@/lib/preventivatore/moduli';
import { calcolaStimaPreventivatore } from '@/app/preventivatore/azioni';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const labels: Record<ModuloTipo, string> = { BASE: 'Base', PENSILE: 'Pensile', COLONNA: 'Colonna', CASSETTIERA: 'Cassettiera', LIBRERIA: 'Libreria / contenitore' };
const materialLabels: Record<Materiale, string> = { TRUCIOLARE: 'Truciolare', MDF: 'MDF', MULTISTRATO: 'Multistrato' };
const finishLabels: Record<Finitura, string> = { MELAMINICO: 'Melaminico', LAMINATO: 'Laminato', LACCATO: 'Laccato' };
const configLabels: Record<ConfigurazioneModulo, string> = { APERTO: 'Aperto', '1_PORTA': '1 porta', '2_PORTE': '2 porte', '3_CASSETTI': '3 cassetti', '4_CASSETTI': '4 cassetti', PORTE_CASSETTI: 'Porte + cassetti' };

function nuovoModulo(tipo: ModuloTipo): ModuloConfigurato {
  const c = CATALOGO_MODULI[tipo];
  return { id: crypto.randomUUID(), tipo, larghezzaCm: c.min.larghezzaCm, altezzaCm: c.min.altezzaCm, profonditaCm: c.min.profonditaCm, materiale: c.materiali[0], finitura: c.finiture[0], configurazione: c.configurazioni[0], ripiani: 1 };
}

export function PreventivatoreModulare() {
  const [moduli, setModuli] = useState<ModuloConfigurato[]>([nuovoModulo('BASE')]);
  const [indice, setIndice] = useState(0);
  const [stima, setStima] = useState<number | null>(null);
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const modulo = moduli[indice];
  const catalogo = CATALOGO_MODULI[modulo.tipo];

  const totaleModuli = useMemo(() => moduli.length, [moduli.length]);

  function aggiorna(patch: Partial<ModuloConfigurato>) {
    setModuli((current) => current.map((m, i) => i === indice ? { ...m, ...patch } : m));
    setStima(null);
  }

  function aggiungi(tipo: ModuloTipo) {
    const nuovo = nuovoModulo(tipo);
    setModuli((current) => [...current, nuovo]);
    setIndice(moduli.length);
    setStima(null);
  }

  function duplica() {
    const nuovo = { ...modulo, id: crypto.randomUUID() };
    setModuli((current) => [...current, nuovo]);
    setIndice(moduli.length);
    setStima(null);
  }

  function elimina() {
    if (moduli.length === 1) return;
    const next = moduli.filter((_, i) => i !== indice);
    setModuli(next);
    setIndice(Math.min(indice, next.length - 1));
    setStima(null);
  }

  function calcola() {
    setMessaggio(null);
    startTransition(async () => {
      try {
        const result = await calcolaStimaPreventivatore(moduli);
        if (!result.successo || result.preventivo.errori.length) {
          setMessaggio(result.preventivo.errori.join(' ') || 'Controlla le dimensioni inserite.');
          setStima(null);
          return;
        }
        setStima(result.preventivo.prezzoIndicativo);
      } catch (error) {
        setMessaggio(error instanceof Error ? error.message : 'Impossibile calcolare la stima.');
        setStima(null);
      }
    });
  }

  return (
    <main className="min-h-screen bg-background px-5 py-12 text-foreground sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Preventivatore Ramirez Atelier</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Costruisci il tuo arredo su misura.</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">Componi i moduli, inserisci le misure e scegli materiale e finitura. La stima viene calcolata sul listino Ramirez in modo sicuro.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Modulo {indice + 1} di {totaleModuli}</p>
                <p className="text-xs text-muted-foreground">{labels[modulo.tipo]}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={duplica} className="rounded-lg border px-3 py-2 text-sm">Duplica</button>
                <button type="button" onClick={elimina} disabled={moduli.length === 1} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Rimuovi</button>
              </div>
            </div>

            <div className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {(Object.keys(CATALOGO_MODULI) as ModuloTipo[]).map((tipo) => (
                <button key={tipo} type="button" onClick={() => aggiorna({ ...nuovoModulo(tipo), id: modulo.id })} className={`rounded-xl border px-3 py-3 text-sm ${modulo.tipo === tipo ? 'border-foreground bg-foreground text-background' : 'bg-background'}`}>
                  {labels[tipo]}
                </button>
              ))}
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {(['larghezzaCm', 'altezzaCm', 'profonditaCm'] as const).map((campo) => (
                <label key={campo} className="text-sm font-medium">
                  {campo === 'larghezzaCm' ? 'Larghezza' : campo === 'altezzaCm' ? 'Altezza' : 'Profondità'} (cm)
                  <input type="number" min={catalogo.min[campo]} max={catalogo.max[campo]} value={modulo[campo]} onChange={(e) => aggiorna({ [campo]: Number(e.target.value) })} className="mt-2 w-full rounded-xl border bg-background px-3 py-3" />
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">{catalogo.min[campo]}–{catalogo.max[campo]} cm</span>
                </label>
              ))}
            </div>

            <div className="mt-7 grid gap-6 sm:grid-cols-3">
              <label className="text-sm font-medium">Materiale<select value={modulo.materiale} onChange={(e) => aggiorna({ materiale: e.target.value as Materiale })} className="mt-2 w-full rounded-xl border bg-background px-3 py-3">{catalogo.materiali.map((v) => <option key={v} value={v}>{materialLabels[v]}</option>)}</select></label>
              <label className="text-sm font-medium">Finitura<select value={modulo.finitura} onChange={(e) => aggiorna({ finitura: e.target.value as Finitura })} className="mt-2 w-full rounded-xl border bg-background px-3 py-3">{catalogo.finiture.map((v) => <option key={v} value={v}>{finishLabels[v]}</option>)}</select></label>
              <label className="text-sm font-medium">Configurazione<select value={modulo.configurazione} onChange={(e) => aggiorna({ configurazione: e.target.value as ConfigurazioneModulo })} className="mt-2 w-full rounded-xl border bg-background px-3 py-3">{catalogo.configurazioni.map((v) => <option key={v} value={v}>{configLabels[v]}</option>)}</select></label>
            </div>

            <label className="mt-7 block max-w-xs text-sm font-medium">Ripiani<input type="number" min="0" max="20" value={modulo.ripiani ?? 0} onChange={(e) => aggiorna({ ripiani: Number(e.target.value) })} className="mt-2 w-full rounded-xl border bg-background px-3 py-3" /></label>

            <div className="mt-8 border-t pt-6">
              <p className="mb-3 text-sm font-medium">Aggiungi un altro modulo</p>
              <div className="flex flex-wrap gap-2">{(Object.keys(CATALOGO_MODULI) as ModuloTipo[]).map((tipo) => <button key={tipo} type="button" onClick={() => aggiungi(tipo)} className="rounded-lg border px-3 py-2 text-sm">+ {labels[tipo]}</button>)}</div>
            </div>
          </section>

          <aside className="h-fit rounded-2xl border bg-card p-6 shadow-sm lg:sticky lg:top-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Riepilogo</p>
            <div className="mt-5 space-y-3">{moduli.map((m, i) => <button key={m.id} type="button" onClick={() => setIndice(i)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${i === indice ? 'border-foreground' : ''}`}><span><span className="block text-sm font-medium">{i + 1}. {labels[m.tipo]}</span><span className="text-xs text-muted-foreground">{m.larghezzaCm} × {m.altezzaCm} × {m.profonditaCm} cm</span></span><span className="text-xs">{materialLabels[m.materiale]}</span></button>)}</div>
            <button type="button" onClick={calcola} disabled={isPending} className="mt-6 w-full rounded-xl bg-foreground px-4 py-3 font-medium text-background disabled:opacity-50">{isPending ? 'Calcolo in corso…' : 'Calcola stima'}</button>
            {stima !== null && <div className="mt-6 rounded-xl border p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Stima indicativa</p><p className="mt-1 text-3xl font-semibold">{euro.format(stima)}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Valore indicativo basato sul listino attivo. Il preventivo definitivo viene verificato da Ramirez Atelier.</p></div>}
            {messaggio && <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{messaggio}</p>}
          </aside>
        </div>
      </div>
    </main>
  );
}
