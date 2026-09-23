'use client';

import { useState, useTransition } from 'react';
import { CATALOGO_MODULI, type ConfigurazioneModulo, type Finitura, type Materiale, type ModuloConfigurato, type ModuloTipo } from '@/lib/preventivatore/moduli';
import { calcolaTestPreventivatore } from '@/app/admin/(protetto)/catalogo/preventivatore/azioni';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

const materiali: Materiale[] = ['TRUCIOLARE', 'MDF', 'MULTISTRATO'];
const finiture: Finitura[] = ['MELAMINICO', 'LAMINATO', 'LACCATO'];

const label: Record<string, string> = {
  BASE: 'Base', PENSILE: 'Pensile', COLONNA: 'Colonna', CASSETTIERA: 'Cassettiera', LIBRERIA: 'Libreria',
  TRUCIOLARE: 'Truciolare', MDF: 'MDF', MULTISTRATO: 'Multistrato', MELAMINICO: 'Melaminico', LAMINATO: 'Laminato', LACCATO: 'Laccato',
  APERTO: 'Aperto', '1_PORTA': '1 porta', '2_PORTE': '2 porte', '3_CASSETTI': '3 cassetti', '4_CASSETTI': '4 cassetti', PORTE_CASSETTI: 'Porte + cassetti',
};

function primoModulo(tipo: ModuloTipo): ModuloConfigurato {
  const catalogo = CATALOGO_MODULI.find((m) => m.codice === tipo)!;
  return { id: 'test-1', tipo, larghezzaCm: Math.round((catalogo.min.larghezzaCm + catalogo.max.larghezzaCm) / 2), altezzaCm: Math.round((catalogo.min.altezzaCm + catalogo.max.altezzaCm) / 2), profonditaCm: Math.round((catalogo.min.profonditaCm + catalogo.max.profonditaCm) / 2), materiale: catalogo.materiali[0], finitura: catalogo.finiture[0], configurazione: catalogo.configurazioni[0], ripiani: 2 };
}

export default function PreventivatoreTestBench() {
  const [modulo, setModulo] = useState<ModuloConfigurato>(() => primoModulo('BASE'));
  const [risultato, setRisultato] = useState<Awaited<ReturnType<typeof calcolaTestPreventivatore>> | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const catalogo = CATALOGO_MODULI.find((m) => m.codice === modulo.tipo)!;

  const aggiornaTipo = (tipo: ModuloTipo) => setModulo(primoModulo(tipo));
  const aggiorna = <K extends keyof ModuloConfigurato>(chiave: K, valore: ModuloConfigurato[K]) => setModulo((m) => ({ ...m, [chiave]: valore }));

  const calcola = () => {
    setErrore(null);
    startTransition(async () => {
      try { setRisultato(await calcolaTestPreventivatore(modulo)); }
      catch (e) { setRisultato(null); setErrore(e instanceof Error ? e.message : 'Calcolo non riuscito.'); }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
      <section className="rounded-xl border p-5">
        <div className="mb-5"><h2 className="font-semibold">Banco prova del motore</h2><p className="mt-1 text-sm text-muted-foreground">Il calcolo usa esclusivamente le tariffe attive del Listino del tenant.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Modulo<select value={modulo.tipo} onChange={(e) => aggiornaTipo(e.target.value as ModuloTipo)} className="mt-1 w-full rounded-md border bg-background p-2">{CATALOGO_MODULI.map((m) => <option key={m.codice} value={m.codice}>{m.nome}</option>)}</select></label>
          <label className="text-sm">Materiale<select value={modulo.materiale} onChange={(e) => aggiorna('materiale', e.target.value as Materiale)} className="mt-1 w-full rounded-md border bg-background p-2">{materiali.filter((m) => catalogo.materiali.includes(m)).map((m) => <option key={m} value={m}>{label[m]}</option>)}</select></label>
          <label className="text-sm">Finitura<select value={modulo.finitura} onChange={(e) => aggiorna('finitura', e.target.value as Finitura)} className="mt-1 w-full rounded-md border bg-background p-2">{finiture.filter((f) => catalogo.finiture.includes(f)).map((f) => <option key={f} value={f}>{label[f]}</option>)}</select></label>
          <label className="text-sm">Configurazione<select value={modulo.configurazione} onChange={(e) => aggiorna('configurazione', e.target.value as ConfigurazioneModulo)} className="mt-1 w-full rounded-md border bg-background p-2">{catalogo.configurazioni.map((c) => <option key={c} value={c}>{label[c]}</option>)}</select></label>
          {(['larghezzaCm', 'altezzaCm', 'profonditaCm'] as const).map((campo) => <label key={campo} className="text-sm">{campo === 'larghezzaCm' ? 'Larghezza' : campo === 'altezzaCm' ? 'Altezza' : 'Profondità'} (cm)<input type="number" min={catalogo.min[campo]} max={catalogo.max[campo]} value={modulo[campo]} onChange={(e) => aggiorna(campo, Number(e.target.value))} className="mt-1 w-full rounded-md border bg-background p-2" /></label>)}
          <label className="text-sm">Ripiani<input type="number" min={0} max={20} value={modulo.ripiani ?? 0} onChange={(e) => aggiorna('ripiani', Number(e.target.value))} className="mt-1 w-full rounded-md border bg-background p-2" /></label>
        </div>
        <button type="button" onClick={calcola} disabled={pending} className="mt-5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50">{pending ? 'Calcolo…' : 'Calcola con Listino reale'}</button>
        {errore && <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{errore}</p>}
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="font-semibold">Risultato interno</h2>
        {!risultato ? <p className="mt-2 text-sm text-muted-foreground">Imposta un modulo e avvia il calcolo.</p> : <div className="mt-4 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            {([['Materiale', risultato.riga.materiale], ['Finitura', risultato.riga.finitura], ['Bordatura', risultato.riga.bordo], ['Retro', risultato.riga.retro], ['Ferramenta', risultato.riga.ferramenta], ['Manodopera', risultato.riga.manodopera]] as const).map(([nome, valore]) => <div key={nome} className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{nome}</p><p className="mt-1 font-semibold">{euro.format(valore)}</p></div>)}
          </div>
          <div className="rounded-lg border p-4"><div className="flex justify-between"><span>Costo produzione</span><strong>{euro.format(risultato.costoProduzione)}</strong></div><div className="mt-2 flex justify-between"><span>Ricarico commerciale</span><strong>{risultato.ricaricoPercentuale}%</strong></div><div className="mt-3 border-t pt-3 flex justify-between text-base"><span>Prezzo indicativo</span><strong>{euro.format(risultato.prezzoIndicativo)}</strong></div></div>
          <div className="rounded-lg border p-4"><p className="font-medium">Distinta parametrica</p><div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span>Fianchi: {risultato.riga.distinta.fianchi}</span><span>Base: {risultato.riga.distinta.base}</span><span>Cielo: {risultato.riga.distinta.cielo}</span><span>Ripiani: {risultato.riga.distinta.ripiani}</span><span>Ante: {risultato.riga.distinta.ante}</span><span>Cassetti: {risultato.riga.distinta.cassetti}</span><span>Bordatura: {risultato.riga.distinta.bordaturaMl} ml</span><span>Ferramenta: {risultato.riga.distinta.ferramentaPz} pz</span><span>Ore: {risultato.riga.distinta.ore}</span></div></div>
        </div>}
      </section>
    </div>
  );
}
