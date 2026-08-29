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
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="rounded-md border border-slate-200 bg-white px-3 py-2.5 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
    </label>
  );

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Preventivo</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Calcolo commerciale basato sul costo della BOM. Modifica i valori per simulare il prezzo di vendita: nulla viene salvato automaticamente.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Costo produzione</div>
          <div className="mt-0.5 text-lg font-semibold text-slate-900">{money(risultato.costoProduzione)}</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 text-sm font-semibold text-slate-800">Parametri commerciali</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {campo('Ricarico %', ricarico, setRicarico, '1')}
          {campo('Costi fissi', costiFissi, setCostiFissi)}
          {campo('Lavorazioni', lavorazioni, setLavorazioni)}
          {campo('Manodopera', manodopera, setManodopera)}
          {campo('Spese', spese, setSpese)}
          {campo('Sconto %', sconto, setSconto, '1')}
          {campo('IVA %', iva, setIva, '1')}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-800">Composizione del prezzo</div>
          <dl className="divide-y divide-slate-200 text-sm">
            <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-600">Costo produzione</dt><dd className="font-medium text-slate-900">{money(risultato.costoProduzione)}</dd></div>
            <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-600">Costi aggiuntivi</dt><dd className="font-medium text-slate-900">{money(risultato.costiAggiuntivi)}</dd></div>
            <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-600">Base con ricarico</dt><dd className="font-medium text-slate-900">{money(risultato.baseConRicarico)}</dd></div>
            <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-600">Sconto ({risultato.scontoPercentuale}%)</dt><dd className="font-medium text-slate-900">- {money(risultato.sconto)}</dd></div>
            <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-600">Imponibile</dt><dd className="font-medium text-slate-900">{money(risultato.imponibile)}</dd></div>
            <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-600">IVA ({risultato.ivaPercentuale}%)</dt><dd className="font-medium text-slate-900">{money(risultato.iva)}</dd></div>
          </dl>
        </div>

        <div className="flex flex-col justify-between rounded-lg border-2 border-slate-300 bg-slate-900 p-5 text-white shadow-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">Prezzo di vendita</div>
            <div className="mt-2 text-4xl font-bold tracking-tight">{money(risultato.totale)}</div>
            <div className="mt-2 text-sm text-slate-300">IVA inclusa · sconto applicato prima dell&apos;IVA</div>
          </div>
          <div className="mt-6 border-t border-slate-700 pt-4 text-xs text-slate-400">
            Il prezzo resta una simulazione finché non viene salvato nel preventivo cliente.
          </div>
        </div>
      </div>
    </section>
  );
}
