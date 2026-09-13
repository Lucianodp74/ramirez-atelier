'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Ruler, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import type { ConfigurazioneModulo, Finitura, Materiale, ModuloConfigurato, ModuloTipo } from '@/lib/preventivatore/moduli';
import { CATALOGO_MODULI } from '@/lib/preventivatore/moduli';
import { calcolaStimaPreventivatore, salvaRichiestaPreventivatore } from '@/app/preventivatore/azioni';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const labels: Record<ModuloTipo, string> = { BASE: 'Base', PENSILE: 'Pensile', COLONNA: 'Colonna', CASSETTIERA: 'Cassettiera', LIBRERIA: 'Libreria / contenitore' };
const descriptions: Record<ModuloTipo, string> = { BASE: 'Un elemento basso per cucina, living o bagno.', PENSILE: 'Un elemento sospeso da parete.', COLONNA: 'Un elemento verticale a tutta altezza.', CASSETTIERA: 'Un elemento con cassetti per contenere e organizzare.', LIBRERIA: 'Un elemento aperto o chiuso per libri e oggetti.' };
const materialLabels: Record<Materiale, string> = { TRUCIOLARE: 'Truciolare', MDF: 'MDF', MULTISTRATO: 'Multistrato' };
const finishLabels: Record<Finitura, string> = { MELAMINICO: 'Melaminico', LAMINATO: 'Laminato', LACCATO: 'Laccato' };
const configLabels: Record<ConfigurazioneModulo, string> = { APERTO: 'Aperto', '1_PORTA': '1 anta', '2_PORTE': '2 ante', '3_CASSETTI': '3 cassetti', '4_CASSETTI': '4 cassetti', PORTE_CASSETTI: 'Ante + cassetti' };

function catalogoPer(tipo: ModuloTipo) {
  const catalogo = CATALOGO_MODULI.find((item) => item.codice === tipo);
  if (!catalogo) throw new Error(`Modulo ${tipo} non presente nel catalogo.`);
  return catalogo;
}

function nuovoModulo(tipo: ModuloTipo): ModuloConfigurato {
  const c = catalogoPer(tipo);
  return { id: crypto.randomUUID(), tipo, larghezzaCm: c.min.larghezzaCm, altezzaCm: c.min.altezzaCm, profonditaCm: c.min.profonditaCm, materiale: c.materiali[0], finitura: c.finiture[0], configurazione: c.configurazioni[0], ripiani: 1 };
}

export function PreventivatoreModulare() {
  const [moduli, setModuli] = useState<ModuloConfigurato[]>([nuovoModulo('BASE')]);
  const [indice, setIndice] = useState(0);
  const [stima, setStima] = useState<number | null>(null);
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const [richiestaAperta, setRichiestaAperta] = useState(false);
  const [inviata, setInviata] = useState<{ id: string; prezzo: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const modulo = moduli[indice];
  const catalogo = catalogoPer(modulo.tipo);

  function resetRisultato() { setStima(null); setInviata(null); setMessaggio(null); }
  function aggiorna(patch: Partial<ModuloConfigurato>) { setModuli((current) => current.map((m, i) => i === indice ? { ...m, ...patch } : m)); resetRisultato(); }
  function cambiaTipo(tipo: ModuloTipo) {
    const base = nuovoModulo(tipo);
    aggiorna({ tipo: base.tipo, larghezzaCm: base.larghezzaCm, altezzaCm: base.altezzaCm, profonditaCm: base.profonditaCm, materiale: base.materiale, finitura: base.finitura, configurazione: base.configurazione, ripiani: base.ripiani });
  }
  function aggiungi(tipo: ModuloTipo) { const nuovo = nuovoModulo(tipo); setModuli((current) => { setIndice(current.length); return [...current, nuovo]; }); resetRisultato(); }
  function duplica() { const nuovo = { ...modulo, id: crypto.randomUUID() }; setModuli((current) => { setIndice(current.length); return [...current, nuovo]; }); resetRisultato(); }
  function elimina() { if (moduli.length === 1) return; const next = moduli.filter((_, i) => i !== indice); setModuli(next); setIndice(Math.min(indice, next.length - 1)); resetRisultato(); }
  function sposta(delta: number) { const target = indice + delta; if (target < 0 || target >= moduli.length) return; const next = [...moduli]; [next[indice], next[target]] = [next[target], next[indice]]; setModuli(next); setIndice(target); resetRisultato(); }
  function calcola() { setMessaggio(null); startTransition(async () => { try { const result = await calcolaStimaPreventivatore(moduli); setStima(result.prezzoIndicativo); } catch (error) { setMessaggio(error instanceof Error ? error.message : 'Impossibile calcolare la stima.'); setStima(null); } }); }
  function inviaRichiesta(formData: FormData) { setMessaggio(null); startTransition(async () => { try { const result = await salvaRichiestaPreventivatore(moduli, { nome: String(formData.get('nome') ?? ''), email: String(formData.get('email') ?? ''), telefono: String(formData.get('telefono') ?? ''), messaggio: String(formData.get('messaggio') ?? '') }); if (result.successo) setInviata({ id: result.id, prezzo: result.prezzoIndicativo }); } catch (error) { setMessaggio(error instanceof Error ? error.message : 'Impossibile inviare la richiesta.'); } }); }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link href="/progetti" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Progetti</Link>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ramirez Atelier</span>
        </div>

        <header className="mb-10 max-w-3xl">
          <div className="mb-4 flex items-center gap-3 text-primary"><Ruler className="h-5 w-5" strokeWidth={1.5} /><p className="text-xs font-medium uppercase tracking-[0.25em]">Preventivatore su misura</p></div>
          <h1 className="font-serif text-4xl font-light tracking-tight sm:text-6xl">Progetta il tuo arredo,<br /><span className="italic text-primary">un modulo alla volta.</span></h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Scegli il tipo di elemento, inserisci le misure e definisci materiali e finiture. In pochi passaggi ottieni una prima stima, calcolata sul listino Ramirez attivo.</p>
        </header>

        <div className="mb-6 grid grid-cols-3 gap-2 text-xs sm:text-sm">
          {['1. Struttura', '2. Materiali', '3. Stima'].map((step, i) => <div key={step} className={`border-t-2 pt-2 ${i === 0 ? 'border-foreground text-foreground' : 'border-border text-muted-foreground'}`}>{step}</div>)}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.6fr_0.85fr]">
          <section className="rounded-sm border border-border bg-card p-5 sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-4 border-b border-border pb-5">
              <div><p className="text-sm font-medium">Elemento {indice + 1} <span className="text-muted-foreground">di {moduli.length}</span></p><p className="mt-1 font-serif text-2xl font-light">{labels[modulo.tipo]}</p><p className="mt-1 text-sm text-muted-foreground">{descriptions[modulo.tipo]}</p></div>
              <div className="flex shrink-0 gap-2"><button type="button" onClick={() => sposta(-1)} disabled={indice === 0} className="rounded-sm border px-3 py-2 text-sm disabled:opacity-30" aria-label="Sposta prima">↑</button><button type="button" onClick={() => sposta(1)} disabled={indice === moduli.length - 1} className="rounded-sm border px-3 py-2 text-sm disabled:opacity-30" aria-label="Sposta dopo">↓</button><button type="button" onClick={duplica} className="rounded-sm border px-3 py-2 text-sm">Duplica</button><button type="button" onClick={elimina} disabled={moduli.length === 1} className="rounded-sm border px-3 py-2 text-sm disabled:opacity-30" aria-label="Elimina elemento"><Trash2 className="h-4 w-4" /></button></div>
            </div>

            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Che elemento vuoi?</p>
            <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {CATALOGO_MODULI.map((item) => { const tipo = item.codice; return <button key={tipo} type="button" onClick={() => cambiaTipo(tipo)} className={`rounded-sm border px-3 py-4 text-sm transition-colors ${modulo.tipo === tipo ? 'border-foreground bg-foreground text-background' : 'border-border hover:bg-muted'}`}><span className="block font-medium">{labels[tipo]}</span><span className={`mt-1 block text-xs ${modulo.tipo === tipo ? 'text-background/70' : 'text-muted-foreground'}`}>{descriptions[tipo]}</span></button>; })}
            </div>

            <div className="border-t border-border pt-7">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Misure</p>
              <div className="grid gap-6 sm:grid-cols-3">{(['larghezzaCm', 'altezzaCm', 'profonditaCm'] as const).map((campo) => <label key={campo} className="text-sm font-medium">{campo === 'larghezzaCm' ? 'Larghezza' : campo === 'altezzaCm' ? 'Altezza' : 'Profondità'} <span className="text-muted-foreground">(cm)</span><input type="number" min={catalogo.min[campo]} max={catalogo.max[campo]} value={modulo[campo]} onChange={(e) => aggiorna({ [campo]: Number(e.target.value) })} className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-3 outline-none focus:border-foreground" /><span className="mt-1 block text-xs font-normal text-muted-foreground">da {catalogo.min[campo]} a {catalogo.max[campo]} cm</span></label>)}</div>
            </div>

            <div className="mt-8 border-t border-border pt-7">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Materiali e configurazione</p>
              <div className="grid gap-6 sm:grid-cols-3"><label className="text-sm font-medium">Materiale<select value={modulo.materiale} onChange={(e) => aggiorna({ materiale: e.target.value as Materiale })} className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-3">{catalogo.materiali.map((v) => <option key={v} value={v}>{materialLabels[v]}</option>)}</select></label><label className="text-sm font-medium">Finitura<select value={modulo.finitura} onChange={(e) => aggiorna({ finitura: e.target.value as Finitura })} className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-3">{catalogo.finiture.map((v) => <option key={v} value={v}>{finishLabels[v]}</option>)}</select></label><label className="text-sm font-medium">Apertura / cassetti<select value={modulo.configurazione} onChange={(e) => aggiorna({ configurazione: e.target.value as ConfigurazioneModulo })} className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-3">{catalogo.configurazioni.map((v) => <option key={v} value={v}>{configLabels[v]}</option>)}</select></label></div>
              <label className="mt-7 block max-w-xs text-sm font-medium">Ripiani<span className="ml-2 text-xs font-normal text-muted-foreground">(numero)</span><input type="number" min="0" max="20" value={modulo.ripiani ?? 0} onChange={(e) => aggiorna({ ripiani: Number(e.target.value) })} className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-3" /></label>
            </div>

            <div className="mt-9 border-t border-border pt-6"><p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Aggiungi un altro elemento</p><div className="flex flex-wrap gap-2">{CATALOGO_MODULI.map((item) => <button key={item.codice} type="button" onClick={() => aggiungi(item.codice)} className="rounded-sm border border-border px-3 py-2 text-sm hover:bg-muted">+ {labels[item.codice]}</button>)}</div></div>
          </section>

          <aside className="h-fit rounded-sm border border-border bg-card p-6 lg:sticky lg:top-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Il tuo progetto</p>
            <div className="mt-5 space-y-2">{moduli.map((m, i) => <button key={m.id} type="button" onClick={() => setIndice(i)} className={`w-full border-l-2 px-4 py-3 text-left ${i === indice ? 'border-primary bg-muted/50' : 'border-border hover:bg-muted/40'}`}><span className="flex items-center justify-between gap-3"><span className="text-sm font-medium">{i + 1}. {labels[m.tipo]}</span>{i === indice && <Check className="h-4 w-4 text-primary" />}</span><span className="mt-1 block text-xs text-muted-foreground">{m.larghezzaCm} × {m.altezzaCm} × {m.profonditaCm} cm · {materialLabels[m.materiale]} · {finishLabels[m.finitura]}</span></button>)}</div>
            <button type="button" onClick={calcola} disabled={isPending} className="mt-6 flex w-full items-center justify-center gap-2 rounded-sm bg-foreground px-4 py-3 text-sm font-medium text-background disabled:opacity-50">{isPending ? 'Calcolo in corso…' : 'Calcola la mia stima'}<ArrowRight className="h-4 w-4" /></button>
            <p className="mt-3 text-center text-xs text-muted-foreground">La stima è indicativa e viene verificata da Ramirez Atelier.</p>

            {stima !== null && !inviata && <div className="mt-6 border-t border-border pt-6"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Prima stima</p><p className="mt-2 font-serif text-4xl font-light">{euro.format(stima)}</p><p className="mt-3 text-xs leading-5 text-muted-foreground">Il valore deriva dal listino Ramirez attivo. Misure esecutive, dettagli costruttivi e lavorazioni speciali vengono verificati prima del prezzo definitivo.</p><button type="button" onClick={() => setRichiestaAperta((v) => !v)} className="mt-5 w-full rounded-sm border border-foreground px-4 py-3 text-sm font-medium">{richiestaAperta ? 'Chiudi richiesta' : 'Parliamone con Ramirez'}</button>{richiestaAperta && <form action={inviaRichiesta} className="mt-4 space-y-3"><input name="nome" required minLength={2} placeholder="Nome e cognome" className="w-full rounded-sm border border-border bg-background px-3 py-3 text-sm" /><input name="email" type="email" required placeholder="Email" className="w-full rounded-sm border border-border bg-background px-3 py-3 text-sm" /><input name="telefono" placeholder="Telefono (facoltativo)" className="w-full rounded-sm border border-border bg-background px-3 py-3 text-sm" /><textarea name="messaggio" rows={3} placeholder="Note o esigenze particolari (facoltativo)" className="w-full rounded-sm border border-border bg-background px-3 py-3 text-sm" /><button type="submit" disabled={isPending} className="w-full rounded-sm bg-foreground px-4 py-3 text-sm font-medium text-background disabled:opacity-50">{isPending ? 'Invio in corso…' : 'Invia la configurazione'}</button></form>}</div>}
            {inviata && <div className="mt-6 border-t border-border pt-6"><p className="text-sm font-semibold">Configurazione ricevuta.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Abbiamo salvato la tua richiesta. Ramirez Atelier potrà verificare il progetto e trasformare la stima in un preventivo definitivo.</p><p className="mt-3 text-xs text-muted-foreground">Riferimento: <span className="font-mono font-medium text-foreground">{inviata.id.slice(0, 8).toUpperCase()}</span></p><p className="mt-1 text-sm font-medium">Prima stima: {euro.format(inviata.prezzo)}</p></div>}
            {messaggio && <p className="mt-4 rounded-sm border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{messaggio}</p>}
          </aside>
        </div>
      </div>
    </main>
  );
}
