'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight , Plus, Ruler, Trash2 } from 'lucide-react';
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
  { id: 'ARMADIO', title: 'Armadio su misura', text: 'Composizione completa: scegliamo la larghezza totale e la dividiamo in moduli.' },
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
const cardClass = 'rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm sm:p-4';

function catalogoPer(tipo: ModuloTipo) {
  const catalogo = CATALOGO_MODULI.find((item) => item.codice === tipo);
  if (!catalogo) throw new Error(`Modulo ${tipo} non presente nel catalogo.`);
  return catalogo;
}


function costruisciColonneArmadio(larghezzaTotale: number, altezzaCm: number, profonditaCm: number): ModuloConfigurato[] {
  const standard = [120, 90, 60, 45];
  const totale = Math.round(larghezzaTotale);
  if (!Number.isFinite(totale) || totale < 30 || totale > 600) return [];

  // Privilegiamo le larghezze standard. Se il residuo non è producibile come
  // modulo standard, lo trasformiamo in un solo elemento fuori misura.
  let migliore: { standard: number[]; residuo: number } | null = null;
  for (let a = 0; a <= Math.floor(totale / 120); a++) {
    for (let b = 0; b <= Math.floor(totale / 90); b++) {
      for (let c = 0; c <= Math.floor(totale / 60); c++) {
        for (let d = 0; d <= Math.floor(totale / 45); d++) {
          const pezzi = [...Array(a).fill(120), ...Array(b).fill(90), ...Array(c).fill(60), ...Array(d).fill(45)];
          const somma = pezzi.reduce((s, n) => s + n, 0);
          const residuo = totale - somma;
          if (residuo < 0 || (residuo > 0 && (residuo < 30 || residuo > 120))) continue;
          if (!migliore || residuo < migliore.residuo || (residuo === migliore.residuo && pezzi.length < migliore.standard.length)) {
            migliore = { standard: pezzi, residuo };
          }
        }
      }
    }
  }

  const larghezze = migliore ? [...migliore.standard, ...(migliore.residuo > 0 ? [migliore.residuo] : [])] : [totale];
  return larghezze.map((larghezza) => {
    const base = nuovoModulo('COLONNA');
    const anta = larghezza <= 60 ? '1_PORTA' : '2_PORTE';
    return {
      ...base,
      larghezzaCm: larghezza,
      altezzaCm,
      profonditaCm,
      configurazione: anta,
      ripiani: 4,
    };
  });
}

function nuovoModulo(tipo: ModuloTipo): ModuloConfigurato {
  const c = catalogoPer(tipo);
  return { id: crypto.randomUUID(), tipo, larghezzaCm: Math.max(c.min.larghezzaCm, Math.min(80, c.max.larghezzaCm)), altezzaCm: Math.max(c.min.altezzaCm, Math.min(100, c.max.altezzaCm)), profonditaCm: Math.max(c.min.profonditaCm, Math.min(40, c.max.profonditaCm)), materiale: c.materiali[0], finitura: c.finiture[0], configurazione: c.configurazioni[0], ripiani: 1 };
}

interface Props {
  /**
   * COMPOSIZIONI / CATALOGO V1: quando presente, i moduli iniziali del
   * wizard sono questi (copiati per valore nello state locale, il cliente
   * può poi modificarli liberamente) invece del modulo BASE di default.
   * Quando assente, il comportamento è identico a prima di questa modifica.
   */
  moduliIniziali?: ModuloConfigurato[];
}

export function PreventivatoreModulare({ moduliIniziali }: Props = {}) {
  const [moduli, setModuli] = useState<ModuloConfigurato[]>(() =>
    moduliIniziali && moduliIniziali.length > 0 ? moduliIniziali : [nuovoModulo('BASE')],
  );
  const [indice, setIndice] = useState(0);
  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState('ALTRO');
  const [layout, setLayout] = useState('LINEARE');
  const [larghezzaTotaleArmadio, setLarghezzaTotaleArmadio] = useState(250);
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

  function preparaArmadio() {
    setLarghezzaTotaleArmadio(250);
    const moduliArmadio = costruisciColonneArmadio(250, 260, 60);
    setModuli(moduliArmadio);
    setIndice(0);
    setLayout('COMPOSIZIONE');
    resetRisultato();
  }

  function aggiornaLarghezzaTotaleArmadio(valore: number) {
    setLarghezzaTotaleArmadio(valore);
    const colonne = costruisciColonneArmadio(valore, modulo?.altezzaCm ?? 260, modulo?.profonditaCm ?? 60);
    if (colonne.length) {
      setModuli(colonne);
      setIndice(0);
      resetRisultato();
    }
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
      if (projectType === 'ARMADIO') {
        if (!Number.isFinite(larghezzaTotaleArmadio) || larghezzaTotaleArmadio < 30 || larghezzaTotaleArmadio > 600) {
          setMessaggio('Inserisci una larghezza totale tra 30 e 600 cm.');
          return;
        }
        const invalid = moduli.some((m) => m.altezzaCm < catalogo.min.altezzaCm || m.altezzaCm > catalogo.max.altezzaCm || m.profonditaCm < catalogo.min.profonditaCm || m.profonditaCm > catalogo.max.profonditaCm);
        if (invalid) { setMessaggio('Controlla altezza e profondità: devono rientrare nei limiti indicati.'); return; }
      } else {
        const invalid = modulo.larghezzaCm < catalogo.min.larghezzaCm || modulo.larghezzaCm > catalogo.max.larghezzaCm || modulo.altezzaCm < catalogo.min.altezzaCm || modulo.altezzaCm > catalogo.max.altezzaCm || modulo.profonditaCm < catalogo.min.profonditaCm || modulo.profonditaCm > catalogo.max.profonditaCm;
        if (invalid) { setMessaggio('Controlla le misure: devono rientrare nei limiti indicati.'); return; }
      }
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
      <div className="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-7">
        <div className="mb-7 flex items-center justify-between gap-4">
          <Link href="/progetti" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Progetti</Link>
          <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground sm:text-xs">Ramirez Atelier</span>
        </div>
        <header className="mb-5 text-center sm:mb-7">
          <div className="mb-2 flex items-center justify-center gap-2 text-primary"><Ruler className="h-4 w-4" strokeWidth={1.5} /><p className="text-[10px] font-medium uppercase tracking-[0.24em] sm:text-xs">Preventivatore su misura</p></div>
          <h1 className="font-serif text-2xl font-light tracking-tight sm:text-4xl">Configura il tuo arredo.</h1>
          <p className="mx-auto mt-1 max-w-xl text-xs text-muted-foreground">Un passaggio alla volta.</p>
        </header>
        <nav aria-label="Avanzamento configuratore" className="mb-5"><div className="grid grid-cols-5 gap-1.5 sm:gap-2">{steps.map((item) => { const active = item.id === step; const done = item.id < step; return <button key={item.id} type="button" onClick={() => item.id <= step && setStep(item.id)} disabled={item.id > step} className={`border-t-2 pt-2 text-left text-[10px] sm:text-xs ${active || done ? 'border-foreground text-foreground' : 'border-border text-muted-foreground'}`}><span className="font-medium">0{item.id}</span>{' '}<span className="hidden sm:inline">{item.label}</span></button>; })}</div></nav>
        <section className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-6">
          {step === 1 && <div>
            <div className="mb-5 text-center"><p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">01 · Struttura</p><h2 className="mt-1 font-serif text-2xl font-light sm:text-3xl">Cosa vuoi realizzare?</h2></div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{projectTypes.map((item) => { const selected = projectType === item.id; return <button key={item.id} type="button" onClick={() => { setProjectType(item.id); if (item.id === 'ARMADIO') { preparaArmadio(); setStep(2); } else if (item.id === 'LIBRERIA') cambiaTipo('LIBRERIA'); else if (item.id === 'MADIA') cambiaTipo('BASE'); else if (item.id === 'PARETE_ATTREZZATA') cambiaTipo('LIBRERIA'); else if (item.id === 'MOBILE_BAGNO') cambiaTipo('BASE'); }} className={`flex items-center justify-between rounded-xl border px-4 py-4 text-left transition-colors ${selected ? 'border-foreground bg-muted/60' : 'border-border bg-background hover:bg-muted/40'}`}><span className="text-sm font-medium">{item.title}</span>{selected && <Check className="h-4 w-4" />}</button>; })}</div>
            {projectType === 'ARMADIO' && <div className="mt-4 rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground"><strong className="font-medium text-foreground">Armadio completo.</strong> La larghezza inserita sarà quella totale della composizione.</div>}
            {projectType !== 'ARMADIO' && <div className="mt-5"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Forma</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{layouts.map((item) => { const selected = layout === item.id; return <button key={item.id} type="button" onClick={() => setLayout(item.id)} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${selected ? 'border-foreground bg-muted/60' : 'border-border bg-background'}`}><span>{item.title}</span>{selected && <Check className="h-4 w-4" />}</button>; })}</div></div>}
          </div>}
          {step === 2 && <div>
            <div className="mb-5 text-center"><p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">02 · Misure</p><h2 className="mt-1 font-serif text-2xl font-light sm:text-3xl">{projectType === 'ARMADIO' ? 'Misure del modulo' : 'Quanto spazio abbiamo?'}</h2><p className="mx-auto mt-1 max-w-xl text-xs text-muted-foreground">{projectType === 'ARMADIO' ? 'Definiamo una colonna alla volta.' : 'Misure indicative, da verificare prima della produzione.'}</p></div>
            {projectType === 'ARMADIO' ? (
              <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Armadio su misura</p>
                <div className="mt-3">
                  <label className="block text-sm font-medium">Larghezza totale desiderata <span className="font-normal text-muted-foreground">(cm)</span>
                    <input
                      type="number"
                      min="30"
                      max="600"
                      step="1"
                      value={larghezzaTotaleArmadio}
                      onChange={(e) => aggiornaLarghezzaTotaleArmadio(Number(e.target.value))}
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-4 text-2xl font-light outline-none focus:border-foreground"
                    />
                  </label>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Le colonne vengono create automaticamente con larghezze standard da 45, 60, 90 o 120 cm. Se il totale non è divisibile, aggiungiamo un modulo fuori misura.</p>
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {moduli.map((item, i) => (
                    <div key={item.id} className="rounded-xl border border-border bg-background px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">Colonna {i + 1}</span>
                        <span className="text-sm">{item.larghezzaCm} cm</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.larghezzaCm <= 60 ? '1 anta' : '2 ante'}{!([45, 60, 90, 120].includes(item.larghezzaCm)) ? ' · fuori misura' : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4 text-sm"><span className="font-medium">{selectedProject?.title}</span><span className="mx-2 text-muted-foreground">·</span><span>{selectedLayout?.title}</span><span className="mx-2 text-muted-foreground">·</span><span>{labels[modulo.tipo]}</span>{moduli.length > 1 && <><span className="mx-2 text-muted-foreground">·</span><span>Modulo {indice + 1} di {moduli.length} · Totale {moduli.reduce((totale, item) => totale + item.larghezzaCm, 0)} cm</span></>}</div>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              {projectType === 'ARMADIO' ? (
                <>
                  <label className="text-sm font-medium">Altezza <span className="font-normal text-muted-foreground">(cm)</span>
                    <input type="number" min={catalogo.min.altezzaCm} max={catalogo.max.altezzaCm} value={modulo.altezzaCm} onChange={(e) => {
                      const altezza = Number(e.target.value);
                      setModuli((current) => current.map((m) => ({ ...m, altezzaCm: altezza })));
                      resetRisultato();
                    }} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-4 text-lg outline-none focus:border-foreground" />
                    <span className="mt-1.5 block text-xs font-normal text-muted-foreground">da {catalogo.min.altezzaCm} a {catalogo.max.altezzaCm} cm · uguale per tutte le colonne</span>
                  </label>
                  <label className="text-sm font-medium">Profondità <span className="font-normal text-muted-foreground">(cm)</span>
                    <input type="number" min={catalogo.min.profonditaCm} max={catalogo.max.profonditaCm} value={modulo.profonditaCm} onChange={(e) => {
                      const profondita = Number(e.target.value);
                      setModuli((current) => current.map((m) => ({ ...m, profonditaCm: profondita })));
                      resetRisultato();
                    }} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-4 text-lg outline-none focus:border-foreground" />
                    <span className="mt-1.5 block text-xs font-normal text-muted-foreground">da {catalogo.min.profonditaCm} a {catalogo.max.profonditaCm} cm · uguale per tutte le colonne</span>
                  </label>
                </>
              ) : (
                (['larghezzaCm', 'altezzaCm', 'profonditaCm'] as const).map((campo) => {
                  const label = campo === 'larghezzaCm' ? 'Larghezza' : campo === 'altezzaCm' ? 'Altezza' : 'Profondità';
                  return <label key={campo} className="text-sm font-medium">{label} <span className="font-normal text-muted-foreground">(cm)</span><input type="number" min={catalogo.min[campo]} max={catalogo.max[campo]} value={modulo[campo]} onChange={(e) => aggiorna({ [campo]: Number(e.target.value) })} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-4 text-lg outline-none focus:border-foreground" /><span className="mt-1.5 block text-xs font-normal text-muted-foreground">da {catalogo.min[campo]} a {catalogo.max[campo]} cm</span></label>;
                })
              )}
            </div>
          </div>}
          {step === 3 && <div>
            <div className="mb-5 text-center"><p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">03 · Materiali</p><h2 className="mt-1 font-serif text-2xl font-light sm:text-3xl">Materiale e finitura</h2></div>
            <div><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Materiale</p><div className="grid gap-2 sm:grid-cols-3">{catalogo.materiali.map((value) => { const selected = modulo.materiale === value; return <button key={value} type="button" onClick={() => aggiorna({ materiale: value })} className={`flex items-center justify-between rounded-xl border px-4 py-4 text-left text-sm ${selected ? 'border-foreground bg-muted/60' : 'border-border bg-background'}`}><span>{materialLabels[value]}</span>{selected && <Check className="h-4 w-4" />}</button>; })}</div></div>
            <div className="mt-5 border-t border-border pt-5"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Finitura</p><div className="grid gap-2 sm:grid-cols-3">{catalogo.finiture.map((value) => { const selected = modulo.finitura === value; return <button key={value} type="button" onClick={() => aggiorna({ finitura: value })} className={`flex items-center justify-between rounded-xl border px-4 py-4 text-left text-sm ${selected ? 'border-foreground bg-muted/60' : 'border-border bg-background'}`}><span>{finishLabels[value]}</span>{selected && <Check className="h-4 w-4" />}</button>; })}</div></div>
          </div>}
          {step === 4 && <div>
            <div className="mb-5 text-center"><p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">04 · Personalizza</p><h2 className="mt-1 font-serif text-2xl font-light sm:text-3xl">Come vuoi organizzarlo?</h2></div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{catalogo.configurazioni.map((value) => { const selected = modulo.configurazione === value; return <button key={value} type="button" onClick={() => aggiorna({ configurazione: value })} className={`flex items-center justify-between rounded-xl border px-4 py-4 text-left text-sm ${selected ? 'border-foreground bg-muted/60' : 'border-border bg-background'}`}><span>{configLabels[value]}</span>{selected && <Check className="h-4 w-4" />}</button>; })}</div>
            <div className="mt-5 border-t border-border pt-5"><label className="block max-w-sm text-sm font-medium">Ripiani <span className="font-normal text-muted-foreground">(0–20)</span><input type="number" min="0" max="20" value={modulo.ripiani ?? 0} onChange={(e) => aggiorna({ ripiani: Number(e.target.value) })} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-lg" /></label></div>
          </div>}
          {step === 5 && <div>
            <div className="mb-5 text-center"><p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">05 · Stima</p><h2 className="mt-1 font-serif text-2xl font-light sm:text-3xl">La tua configurazione</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">{moduli.map((m, i) => <button key={m.id} type="button" onClick={() => { setIndice(i); setStep(2); }} className={`rounded-xl border p-4 text-left ${i === indice ? 'border-foreground bg-muted/50' : 'border-border bg-background'}`}><div className="flex items-center justify-between gap-3"><span className="font-medium">{i + 1}. {labels[m.tipo]}</span>{i === indice && <Check className="h-4 w-4" />}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{m.larghezzaCm} × {m.altezzaCm} × {m.profonditaCm} cm · {materialLabels[m.materiale]} · {finishLabels[m.finitura]}</p><p className="mt-1 text-xs text-muted-foreground">{configLabels[m.configurazione]} · {m.ripiani ?? 0} ripiani</p></button>)}</div>
            <div className="mt-5 rounded-xl border border-dashed border-border p-4"><p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">Vuoi comporre più elementi?</p><div className="flex flex-wrap gap-2">{CATALOGO_MODULI.map((item) => <button key={item.codice} type="button" onClick={() => aggiungi(item.codice)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"><Plus className="h-3.5 w-3.5" /> {labels[item.codice]}</button>)}{moduli.length > 1 && <button type="button" onClick={elimina} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"><Trash2 className="h-3.5 w-3.5" /> Rimuovi selezionato</button>}</div></div>
            <div className="mt-5 rounded-2xl bg-foreground p-5 text-background sm:p-7"><p className="text-xs uppercase tracking-[0.18em] text-background/60">Stima indicativa</p>{stima !== null ? <><p className="mt-2 font-serif text-5xl font-light">{euro.format(stima)}</p><p className="mt-3 max-w-xl text-xs leading-5 text-background/70">La cifra è una prima indicazione calcolata sul Listino Ramirez attivo. Il prezzo definitivo dipende dalla verifica delle misure, dei dettagli costruttivi e delle lavorazioni.</p>{!inviata && <button type="button" onClick={() => setRichiestaAperta((value) => !value)} className="mt-6 w-full rounded-xl bg-background px-4 py-3 text-sm font-medium text-foreground sm:w-auto sm:min-w-64">{richiestaAperta ? 'Chiudi richiesta' : 'Richiedi il preventivo definitivo'}</button>}</> : <><p className="mt-2 max-w-xl font-serif text-2xl font-light">Pronto per il calcolo</p><p className="mt-2 max-w-xl text-xs leading-5 text-background/70">Premi il pulsante per ottenere la prima stima della composizione.</p><button type="button" onClick={calcola} disabled={isPending} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-background px-5 py-3 text-sm font-medium text-foreground disabled:opacity-60 sm:w-auto">{isPending ? 'Calcolo in corso…' : 'Calcola la mia stima'}<ArrowRight className="h-4 w-4" /></button></>}</div>
            {stima !== null && richiestaAperta && !inviata && <form action={inviaRichiesta} className="mt-5 rounded-xl border border-border p-5 sm:p-6"><p className="text-sm font-medium">Parliamone con Ramirez</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Inviaci la configurazione: verificheremo il progetto e prepareremo il preventivo definitivo.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><input name="nome" required minLength={2} placeholder="Nome e cognome *" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" /><input name="email" type="email" required placeholder="Email *" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" /><input name="telefono" placeholder="Telefono" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" /><input name="messaggio" placeholder="Note o esigenze particolari" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" /></div><button type="submit" disabled={isPending} className="mt-4 w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background disabled:opacity-60">{isPending ? 'Invio in corso…' : 'Invia la mia configurazione'}</button></form>}
            {inviata && <div className="mt-5 rounded-xl border border-border bg-muted/40 p-5"><p className="text-sm font-semibold">Configurazione ricevuta.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Abbiamo salvato la tua richiesta. Ramirez Atelier potrà verificare il progetto e trasformare la stima in un preventivo definitivo.</p><p className="mt-3 text-xs text-muted-foreground">Riferimento: <span className="font-mono font-medium text-foreground">{inviata.id.slice(0, 8).toUpperCase()}</span></p><p className="mt-1 text-sm font-medium">Prima stima: {euro.format(inviata.prezzo)}</p></div>}
          </div>}
          {messaggio && <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{messaggio}</p>}
          {step < 5 && <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5"><button type="button" onClick={vaiIndietro} disabled={step === 1} className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm text-muted-foreground disabled:invisible"><ChevronLeft className="h-4 w-4" /> Indietro</button><button type="button" onClick={vaiAvanti} className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background">Continua <ChevronRight className="h-4 w-4" /></button></div>}
        </section>
        
      </div>
    </main>
  );
}
