'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Layers3, Plus, Ruler, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import type { ConfigurazioneModulo, Finitura, Materiale, ModuloConfigurato, ModuloTipo } from '@/lib/preventivatore/moduli';
import { CATALOGO_MODULI } from '@/lib/preventivatore/moduli';
import { calcolaStimaPreventivatore, salvaRichiestaPreventivatore } from '@/app/preventivatore/azioni';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const labels: Record<ModuloTipo, string> = { BASE: 'Mobile basso', PENSILE: 'Pensile', COLONNA: 'Colonna / armadio', CASSETTIERA: 'Cassettiera', LIBRERIA: 'Libreria / contenitore' };
const materialLabels: Record<Materiale, string> = { TRUCIOLARE: 'Truciolare', MDF: 'MDF', MULTISTRATO: 'Multistrato' };
const materialDescriptions: Record<Materiale, string> = { TRUCIOLARE: 'Pratico e versatile, ottimo rapporto qualità/prezzo.', MDF: 'Superficie liscia, ideale per finiture uniformi.', MULTISTRATO: 'Struttura resistente per una scelta più tecnica e premium.' };
const finishLabels: Record<Finitura, string> = { MELAMINICO: 'Melaminico', LAMINATO: 'Laminato', LACCATO: 'Laccato' };
const finishDescriptions: Record<Finitura, string> = { MELAMINICO: 'Ampia scelta di decorativi e colori.', LAMINATO: 'Superficie resistente e adatta all’uso quotidiano.', LACCATO: 'Aspetto raffinato e possibilità di colore personalizzato.' };
const configLabels: Record<ConfigurazioneModulo, string> = { APERTO: 'Aperto', '1_PORTA': '1 anta', '2_PORTE': '2 ante', '3_CASSETTI': '3 cassetti', '4_CASSETTI': '4 cassetti', PORTE_CASSETTI: 'Ante + cassetti' };
const projectTypes = [
  { id: 'ARMADIO', title: 'Armadio', text: 'Guardaroba, contenitore o cabina.' },
  { id: 'PARETE_ATTREZZATA', title: 'Parete attrezzata', text: 'TV, contenitori e libreria.' },
  { id: 'MADIA', title: 'Madia / credenza', text: 'Un mobile elegante e funzionale.' },
  { id: 'LIBRERIA', title: 'Libreria', text: 'Vani aperti per libri e oggetti.' },
  { id: 'MOBILE_BAGNO', title: 'Mobile bagno', text: 'Una soluzione progettata per il tuo spazio.' },
  { id: 'ALTRO', title: 'Mobile su misura', text: 'Hai un’idea diversa? Partiamo da qui.' },
] as const;
const layouts = [
  { id: 'LINEARE', title: 'Lineare', text: 'Un unico fronte' },
  { id: 'ANGOLARE', title: 'Angolare', text: 'Due pareti collegate' },
  { id: 'A_PARETE', title: 'A parete', text: 'Progettato sul muro' },
  { id: 'COMPOSIZIONE', title: 'Più moduli', text: 'Una composizione personalizzata' },
] as const;
const steps = [{ id: 1, label: 'Struttura' }, { id: 2, label: 'Misure' }, { id: 3, label: 'Materiali' }, { id: 4, label: 'Personalizza' }, { id: 5, label: 'Stima' }];
const cardClass = 'rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm';

function catalogoPer(tipo: ModuloTipo) {
  const catalogo = CATALOGO_MODULI.find((item) => item.codice === tipo);
  if (!catalogo) throw new Error(`Modulo ${tipo} non presente nel catalogo.`);
  return catalogo;
}

function nuovoModulo(tipo: ModuloTipo): ModuloConfigurato {
  const c = catalogoPer(tipo);
  return { id: crypto.randomUUID(), tipo, larghezzaCm: Math.max(c.min.larghezzaCm, Math.min(80, c.max.larghezzaCm)), altezzaCm: Math.max(c.min.altezzaCm, Math.min(100, c.max.altezzaCm)), profonditaCm: Math.max(c.min.profonditaCm, Math.min(40, c.max.profonditaCm)), materiale: c.materiali[0], finitura: c.finiture[0], configurazione: c.configurazioni[0], ripiani: 1 };
}

export function PreventivatoreModulare() {
  const [moduli, setModuli] = useState<ModuloConfigurato[]>([nuovoModulo('BASE')]);
  const [indice, setIndice] = useState(0);
  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState('ALTRO');
  const [layout, setLayout] = useState('LINEARE');
  const [stima, setStima] = useState<number | null>(null);
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const [richiestaAperta, setRichiestaAperta] = useState(false);
  const [inviata, setInviata] = useState<{ id: string; prezzo: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const modulo = moduli[indice];
  const catalogo = catalogoPer(modulo.tipo);
  const selectedProject = projectTypes.find((item) => item.id === projectType);
  const selectedLayout = layouts.find((item) => item.id === layout);

  function resetRisultato() { setStima(null); setInviata(null); setMessaggio(null); }
  function aggiorna(patch: Partial<ModuloConfigurato>) {
    setModuli((current) => current.map((m, i) => (i === indice ? { ...m, ...patch } : m)));
    resetRisultato();
  }
  function cambiaTipo(tipo: ModuloTipo) {
    const base = nuovoModulo(tipo);
    aggiorna({ tipo: base.tipo, larghezzaCm: base.larghezzaCm, altezzaCm: base.altezzaCm, profonditaCm: base.profonditaCm, materiale: base.materiale, finitura: base.finitura, configurazione: base.configurazione, ripiani: base.ripiani });
  }
  function aggiungi(tipo: ModuloTipo) {
    if (moduli.length >= 30) return;
    const nuovo = nuovoModulo(tipo);
    setModuli((current) => [...current, nuovo]);
    setIndice(moduli.length);
    setStep(2);
    resetRisultato();
  }
  function elimina() {
    if (moduli.length === 1) return;
    const next = moduli.filter((_, i) => i !== indice);
    setModuli(next);
    setIndice(Math.min(indice, next.length - 1));
    resetRisultato();
  }
  function vaiAvanti() {
    if (step === 2) {
      const invalid = modulo.larghezzaCm < catalogo.min.larghezzaCm || modulo.larghezzaCm > catalogo.max.larghezzaCm || modulo.altezzaCm < catalogo.min.altezzaCm || modulo.altezzaCm > catalogo.max.altezzaCm || modulo.profonditaCm < catalogo.min.profonditaCm || modulo.profonditaCm > catalogo.max.profonditaCm;
      if (invalid) { setMessaggio('Controlla le misure: devono rientrare nei limiti indicati.'); return; }
    }
    setMessaggio(null); setStep((current) => Math.min(5, current + 1));
  }
  function vaiIndietro() { setMessaggio(null); setStep((current) => Math.max(1, current - 1)); }
  function calcola() {
    setMessaggio(null);
    startTransition(async () => {
      try { const result = await calcolaStimaPreventivatore(moduli); setStima(result.prezzoIndicativo); setStep(5); }
      catch (error) { setMessaggio(error instanceof Error ? error.message : 'Impossibile calcolare la stima.'); setStima(null); }
    });
  }
  function inviaRichiesta(formData: FormData) {
    setMessaggio(null);
    const progetto = `${selectedProject?.title ?? 'Mobile su misura'} · ${selectedLayout?.title ?? 'Lineare'}`;
    const note = String(formData.get('messaggio') ?? '').trim();
    const messaggioCompleto = [progetto, note].filter(Boolean).join('\n\n');
    startTransition(async () => {
      try {
        const result = await salvaRichiestaPreventivatore(moduli, { nome: String(formData.get('nome') ?? ''), email: String(formData.get('email') ?? ''), telefono: String(formData.get('telefono') ?? ''), messaggio: messaggioCompleto });
        if (result.successo) setInviata({ id: result.id, prezzo: result.prezzoIndicativo });
      } catch (error) { setMessaggio(error instanceof Error ? error.message : 'Impossibile inviare la richiesta.'); }
    });
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="mb-7 flex items-center justify-between gap-4">
          <Link href="/progetti" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Progetti</Link>
          <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground sm:text-xs">Ramirez Atelier</span>
        </div>
        <header className="mb-7 text-center sm:mb-10">
          <div className="mb-3 flex items-center justify-center gap-2 text-primary"><Ruler className="h-4 w-4" strokeWidth={1.5} /><p className="text-[10px] font-medium uppercase tracking-[0.24em] sm:text-xs">Preventivatore su misura</p></div>
          <h1 className="font-serif text-3xl font-light tracking-tight sm:text-5xl">Progettiamo insieme il tuo arredo.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Ti guidiamo in pochi passaggi. Non serve conoscere termini tecnici: scegli ciò che ti piace, inserisci le misure e ricevi una prima stima.</p>
        </header>
        <nav aria-label="Avanzamento configuratore" className="mb-8"><div className="grid grid-cols-5 gap-1.5 sm:gap-2">{steps.map((item) => { const active = item.id === step; const done = item.id < step; return <button key={item.id} type="button" onClick={() => item.id <= step && setStep(item.id)} disabled={item.id > step} className={`border-t-2 pt-2 text-left text-[10px] sm:text-xs ${active || done ? 'border-foreground text-foreground' : 'border-border text-muted-foreground'}`}><span className="font-medium">0{item.id}</span>{' '}<span className="hidden sm:inline">{item.label}</span></button>; })}</div></nav>
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-8">
          {step === 1 && <div>
            <div className="mb-7 text-center"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">01 · Struttura</p><h2 className="mt-2 font-serif text-3xl font-light sm:text-4xl">Cosa vuoi realizzare?</h2><p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Partiamo dall&apos;idea generale. La struttura verrà poi definita nei dettagli.</p></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{projectTypes.map((item) => { const selected = projectType === item.id; return <button key={item.id} type="button" onClick={() => { setProjectType(item.id); if (item.id === 'ARMADIO') cambiaTipo('COLONNA'); if (item.id === 'LIBRERIA') cambiaTipo('LIBRERIA'); if (item.id === 'MADIA') cambiaTipo('BASE'); if (item.id === 'PARETE_ATTREZZATA') cambiaTipo('LIBRERIA'); if (item.id === 'MOBILE_BAGNO') cambiaTipo('BASE'); }} className={`${cardClass} ${selected ? 'border-foreground bg-muted/60' : 'border-border bg-background'}`}><div className="mb-7 flex h-20 items-end justify-between"><div className="flex items-end gap-1 opacity-80"><span className="h-10 w-8 rounded-sm border-2 border-current" /><span className="h-16 w-8 rounded-sm border-2 border-current" /><span className="h-12 w-8 rounded-sm border-2 border-current" /></div>{selected && <Check className="h-5 w-5" />}</div><p className="text-base font-medium">{item.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</p></button>; })}</div>
            <div className="mt-8 border-t border-border pt-7"><p className="mb-4 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">Come deve essere?</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{layouts.map((item) => { const selected = layout === item.id; return <button key={item.id} type="button" onClick={() => setLayout(item.id)} className={`${cardClass} ${selected ? 'border-foreground bg-muted/60' : 'border-border bg-background'}`}><div className="mb-5 flex h-14 items-center justify-center"><Layers3 className="h-10 w-10" strokeWidth={1} /></div><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{item.title}</span>{selected && <Check className="h-4 w-4" />}</div><span className="mt-1 block text-xs text-muted-foreground">{item.text}</span></button>; })}</div></div>
          </div>}
          {step === 2 && <div>
            <div className="mb-7 text-center"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">02 · Misure</p><h2 className="mt-2 font-serif text-3xl font-light sm:text-4xl">Quanto spazio abbiamo?</h2><p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Inserisci misure indicative. Prima della produzione Ramirez verificherà sempre le dimensioni definitive.</p></div>
            <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4 text-sm"><span className="font-medium">{selectedProject?.title}</span><span className="mx-2 text-muted-foreground">·</span><span>{selectedLayout?.title}</span><span className="mx-2 text-muted-foreground">·</span><span>{labels[modulo.tipo]}</span></div>
            <div className="grid gap-5 sm:grid-cols-3">{(['larghezzaCm', 'altezzaCm', 'profonditaCm'] as const).map((campo) => { const label = campo === 'larghezzaCm' ? 'Larghezza' : campo === 'altezzaCm' ? 'Altezza' : 'Profondità'; return <label key={campo} className="text-sm font-medium">{label} <span className="font-normal text-muted-foreground">(cm)</span><input type="number" min={catalogo.min[campo]} max={catalogo.max[campo]} value={modulo[campo]} onChange={(e) => aggiorna({ [campo]: Number(e.target.value) })} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-4 text-lg outline-none focus:border-foreground" /><span className="mt-1.5 block text-xs font-normal text-muted-foreground">da {catalogo.min[campo]} a {catalogo.max[campo]} cm</span></label>; })}</div>
          </div>}
          {step === 3 && <div>
            <div className="mb-7 text-center"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">03 · Materiali</p><h2 className="mt-2 font-serif text-3xl font-light sm:text-4xl">Scegli come realizzarlo.</h2><p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Prima scegli il materiale della struttura, poi la finitura della superficie.</p></div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Materiale</p><div className="grid gap-3 sm:grid-cols-3">{catalogo.materiali.map((value) => { const selected = modulo.materiale === value; return <button key={value} type="button" onClick={() => aggiorna({ materiale: value })} className={`${cardClass} ${selected ? 'border-foreground bg-muted/60' : 'border-border bg-background'}`}><div className="mb-6 h-20 overflow-hidden rounded-lg border border-border bg-muted"><div className="h-full w-full opacity-70 [background-image:repeating-linear-gradient(90deg,transparent,transparent_7px,currentColor_8px,currentColor_9px)]" /></div><div className="flex items-center justify-between gap-2"><span className="font-medium">{materialLabels[value]}</span>{selected && <Check className="h-4 w-4" />}</div><span className="mt-1 block text-xs leading-5 text-muted-foreground">{materialDescriptions[value]}</span></button>; })}</div>
            <div className="mt-8 border-t border-border pt-7"><p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Finitura</p><div className="grid gap-3 sm:grid-cols-3">{catalogo.finiture.map((value) => { const selected = modulo.finitura === value; return <button key={value} type="button" onClick={() => aggiorna({ finitura: value })} className={`${cardClass} ${selected ? 'border-foreground bg-muted/60' : 'border-border bg-background'}`}><div className="mb-6 h-20 rounded-lg border border-border bg-gradient-to-br from-muted via-background to-muted" /><div className="flex items-center justify-between gap-2"><span className="font-medium">{finishLabels[value]}</span>{selected && <Check className="h-4 w-4" />}</div><span className="mt-1 block text-xs leading-5 text-muted-foreground">{finishDescriptions[value]}</span></button>; })}</div></div>
          </div>}
          {step === 4 && <div>
            <div className="mb-7 text-center"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">04 · Personalizza</p><h2 className="mt-2 font-serif text-3xl font-light sm:text-4xl">Come vuoi organizzarlo?</h2><p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Scegli la configurazione più vicina alla tua idea. La soluzione definitiva verrà poi progettata insieme.</p></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{catalogo.configurazioni.map((value) => { const selected = modulo.configurazione === value; return <button key={value} type="button" onClick={() => aggiorna({ configurazione: value })} className={`${cardClass} min-h-28 ${selected ? 'border-foreground bg-muted/60' : 'border-border bg-background'}`}><div className="mb-5 flex h-10 items-center gap-1 opacity-70">{value === 'APERTO' && <><span className="h-8 w-10 border" /><span className="h-8 w-10 border" /></>}{value.includes('PORTA') && <><span className="h-8 w-10 rounded-sm border" /><span className="h-8 w-10 rounded-sm border" /></>}{value.includes('CASSETTI') && <><span className="h-8 w-10 rounded-sm border" /><span className="flex h-8 w-10 flex-col"><i className="flex-1 border" /><i className="flex-1 border" /><i className="flex-1 border" /></span></>} </div><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{configLabels[value]}</span>{selected && <Check className="h-4 w-4" />}</div></button>; })}</div>
            <div className="mt-8 border-t border-border pt-7"><label className="block max-w-sm text-sm font-medium">Quanti ripiani vuoi?<span className="ml-2 text-xs font-normal text-muted-foreground">(0–20)</span><input type="number" min="0" max="20" value={modulo.ripiani ?? 0} onChange={(e) => aggiorna({ ripiani: Number(e.target.value) })} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-4 text-lg" /></label></div>
          </div>}
          {step === 5 && <div>
            <div className="mb-7 text-center"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">05 · Stima</p><h2 className="mt-2 font-serif text-3xl font-light sm:text-4xl">Ecco la tua configurazione.</h2><p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Puoi modificare qualsiasi scelta prima di richiedere il preventivo.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">{moduli.map((m, i) => <button key={m.id} type="button" onClick={() => { setIndice(i); setStep(2); }} className={`rounded-xl border p-4 text-left ${i === indice ? 'border-foreground bg-muted/50' : 'border-border bg-background'}`}><div className="flex items-center justify-between gap-3"><span className="font-medium">{i + 1}. {labels[m.tipo]}</span>{i === indice && <Check className="h-4 w-4" />}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{m.larghezzaCm} × {m.altezzaCm} × {m.profonditaCm} cm · {materialLabels[m.materiale]} · {finishLabels[m.finitura]}</p><p className="mt-1 text-xs text-muted-foreground">{configLabels[m.configurazione]} · {m.ripiani ?? 0} ripiani</p></button>)}</div>
            <div className="mt-5 rounded-xl border border-dashed border-border p-4"><p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">Vuoi comporre più elementi?</p><div className="flex flex-wrap gap-2">{CATALOGO_MODULI.map((item) => <button key={item.codice} type="button" onClick={() => aggiungi(item.codice)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"><Plus className="h-3.5 w-3.5" /> {labels[item.codice]}</button>)}{moduli.length > 1 && <button type="button" onClick={elimina} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"><Trash2 className="h-3.5 w-3.5" /> Rimuovi selezionato</button>}</div></div>
            <div className="mt-7 rounded-2xl bg-foreground p-6 text-background sm:p-8"><p className="text-xs uppercase tracking-[0.18em] text-background/60">Stima indicativa</p>{stima !== null ? <><p className="mt-2 font-serif text-5xl font-light">{euro.format(stima)}</p><p className="mt-3 max-w-xl text-xs leading-5 text-background/70">La cifra è una prima indicazione calcolata sul Listino Ramirez attivo. Il prezzo definitivo dipende dalla verifica delle misure, dei dettagli costruttivi e delle lavorazioni.</p>{!inviata && <button type="button" onClick={() => setRichiestaAperta((value) => !value)} className="mt-6 w-full rounded-xl bg-background px-4 py-3 text-sm font-medium text-foreground sm:w-auto sm:min-w-64">{richiestaAperta ? 'Chiudi richiesta' : 'Richiedi il preventivo definitivo'}</button>}</> : <><p className="mt-2 max-w-xl font-serif text-2xl font-light">Pronto per il calcolo</p><p className="mt-2 max-w-xl text-xs leading-5 text-background/70">Premi il pulsante per ottenere la prima stima della composizione.</p><button type="button" onClick={calcola} disabled={isPending} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-background px-5 py-3 text-sm font-medium text-foreground disabled:opacity-60 sm:w-auto">{isPending ? 'Calcolo in corso…' : 'Calcola la mia stima'}<ArrowRight className="h-4 w-4" /></button></>}</div>
            {stima !== null && richiestaAperta && !inviata && <form action={inviaRichiesta} className="mt-5 rounded-xl border border-border p-5 sm:p-6"><p className="text-sm font-medium">Parliamone con Ramirez</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Inviaci la configurazione: verificheremo il progetto e prepareremo il preventivo definitivo.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><input name="nome" required minLength={2} placeholder="Nome e cognome *" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" /><input name="email" type="email" required placeholder="Email *" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" /><input name="telefono" placeholder="Telefono" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" /><input name="messaggio" placeholder="Note o esigenze particolari" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" /></div><button type="submit" disabled={isPending} className="mt-4 w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background disabled:opacity-60">{isPending ? 'Invio in corso…' : 'Invia la mia configurazione'}</button></form>}
            {inviata && <div className="mt-5 rounded-xl border border-border bg-muted/40 p-5"><p className="text-sm font-semibold">Configurazione ricevuta.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Abbiamo salvato la tua richiesta. Ramirez Atelier potrà verificare il progetto e trasformare la stima in un preventivo definitivo.</p><p className="mt-3 text-xs text-muted-foreground">Riferimento: <span className="font-mono font-medium text-foreground">{inviata.id.slice(0, 8).toUpperCase()}</span></p><p className="mt-1 text-sm font-medium">Prima stima: {euro.format(inviata.prezzo)}</p></div>}
          </div>}
          {messaggio && <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{messaggio}</p>}
          {step < 5 && <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5"><button type="button" onClick={vaiIndietro} disabled={step === 1} className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm text-muted-foreground disabled:invisible"><ChevronLeft className="h-4 w-4" /> Indietro</button><button type="button" onClick={vaiAvanti} className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background">Continua <ChevronRight className="h-4 w-4" /></button></div>}
        </section>
        <p className="mx-auto mt-5 max-w-2xl text-center text-[11px] leading-5 text-muted-foreground">Le misure inserite nel configuratore sono preliminari. Prima della produzione verificheremo rilievo, dettagli costruttivi, materiali e lavorazioni con te.</p>
      </div>
    </main>
  );
}
