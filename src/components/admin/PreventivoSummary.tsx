'use client';

import { useMemo, useState } from 'react';
import { calcolaPrezzoBom } from '@/lib/bom-pricing-calculation';

type Props = { costoProduzione: number };

export function PreventivoSummary({ costoProduzione }: Props) {
  const [ricarico, setRicarico] = useState(20);
  const [costiFissi, setCostiFissi] = useState(0);
  const [lavorazioni, setLavorazioni] = useState(0);
  const [manodopera, setManodopera] = useState(0);
  const [spese, setSpese] = useState(0);
  const [sconto, setSconto] = useState(0);
  const [iva, setIva] = useState(22);

  const risultato = useMemo(
    () =>
      calcolaPrezzoBom(costoProduzione, {
        ricaricoPercentuale: ricarico,
        costiFissi,
        lavorazioni,
        manodopera,
        spese,
        scontoPercentuale: sconto,
        ivaPercentuale: iva,
      }),
    [costoProduzione, ricarico, costiFissi, lavorazioni, manodopera, spese, sconto, iva],
  );

  const money = (value: number) => `${value.toFixed(2)} €`;
  const campo = (label: string, value: number, setValue: (value: number) => void, step = '0.01') => (
    <label className="grid gap-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <input className="rounded border px-3 py-2" type="number" min="0" step={step} value={value} onChange={(e) => setValue(Number(e.target.value))} />
    </label>
  );

  return (
    <section className="mt-6 rounded-lg border bg-white p-5">
      <h2 className="text-xl font-semibold">Preventivo</h2>
      <p className="mt-1 text-sm text-slate-500">Calcolo commerciale basato sul costo della BOM. I valori sono modificabili e non vengono salvati automaticamente.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        {campo('Ricarico %', ricarico, setRicarico, '1')}
        {campo('Costi fissi', costiFissi, setCostiFissi)}
        {campo('Lavorazioni', lavorazioni, setLavorazioni)}
        {campo('Manodopera', manodopera, setManodopera)}
        {campo('Spese', spese, setSpese)}
        {campo('Sconto %', sconto, setSconto, '1')}
        {campo('IVA %', iva, setIva, '1')}
      </div>
      <dl className="mt-6 grid gap-3 border-t pt-5 text-sm md:grid-cols-2">
        <div className="flex justify-between"><dt>Costo produzione</dt><dd>{money(risultato.costoProduzione)}</dd></div>
        <div className="flex justify-between"><dt>Costi aggiuntivi</dt><dd>{money(risultato.costiAggiuntivi)}</dd></div>
        <div className="flex justify-between"><dt>Base con ricarico</dt><dd>{money(risultato.baseConRicarico)}</dd></div>
        <div className="flex justify-between"><dt>Sconto</dt><dd>- {money(risultato.sconto)}</dd></div>
        <div className="flex justify-between"><dt>Imponibile</dt><dd>{money(risultato.imponibile)}</dd></div>
        <div className="flex justify-between"><dt>IVA</dt><dd>{money(risultato.iva)}</dd></div>
        <div className="flex justify-between border-t pt-3 text-base font-semibold md:col-span-2"><dt>Totale preventivo</dt><dd>{money(risultato.totale)}</dd></div>
      </dl>
    </section>
  );
}
