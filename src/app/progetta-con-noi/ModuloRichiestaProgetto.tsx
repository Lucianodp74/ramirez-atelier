'use client';

import { useActionState, useRef } from 'react';
import { ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react';
import { inviaRichiestaProgettoPubblica } from './azioni';

const iniziale = null;

const campo = 'mt-2 w-full rounded-lg border border-[#D8D0C5] bg-white px-4 py-3 text-sm text-[#1E1B18] outline-none transition focus:border-[#8F4525] focus:ring-2 focus:ring-[#8F4525]/15';
const etichetta = 'block text-sm font-medium text-[#38322C]';

export function ModuloRichiestaProgetto() {
  const [esito, action, pending] = useActionState(inviaRichiestaProgettoPubblica, iniziale);
  const formRef = useRef<HTMLFormElement>(null);

  if (esito?.successo) {
    return (
      <div role="status" className="rounded-xl border border-[#6B8B68]/30 bg-[#F0F5EE] p-6">
        <CheckCircle2 className="h-8 w-8 text-[#477044]" />
        <h3 className="mt-4 font-serif text-2xl">Grazie, abbiamo ricevuto la richiesta.</h3>
        <p className="mt-2 text-sm leading-6 text-[#4D604A]">Esamineremo le informazioni inviate e ti ricontatteremo. Se hai indicato un numero di telefono, potremo utilizzarlo per approfondire il progetto.</p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={etichetta}>Nome e cognome *
          <input className={campo} name="nome" autoComplete="name" required minLength={2} maxLength={120} />
        </label>
        <label className={etichetta}>Email *
          <input className={campo} name="email" type="email" autoComplete="email" required maxLength={180} />
        </label>
      </div>
      <label className={etichetta}>Telefono (facoltativo)
        <input className={campo} name="telefono" type="tel" autoComplete="tel" maxLength={40} />
      </label>
      <label className={etichetta}>Che cosa vuoi realizzare? *
        <select className={campo} name="tipoProgetto" defaultValue="" required>
          <option value="" disabled>Seleziona una tipologia</option>
          <option value="parete-attrezzata">Parete attrezzata</option>
          <option value="libreria">Libreria</option>
          <option value="boiserie">Boiserie</option>
          <option value="madia">Madia o mobile contenitore</option>
          <option value="altro">Altro arredo su misura</option>
        </select>
      </label>
      <label className={etichetta}>Descrivi il progetto *
        <textarea className={campo + ' min-h-36 resize-y'} name="messaggio" required minLength={10} maxLength={4000} placeholder="Raccontaci l’ambiente, le dimensioni se le conosci, i materiali o lo stile che immagini…" />
      </label>
      <label className={etichetta}>Allega planimetrie, disegni o fotografie
        <input className={campo + ' file:mr-4 file:rounded-full file:border-0 file:bg-[#EEE7DC] file:px-3 file:py-2 file:text-xs file:font-medium'} type="file" name="documenti" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.zip" />
        <span className="mt-2 block text-xs font-normal leading-5 text-[#71685E]">Massimo 5 file da 8 MB ciascuno. Formati: PDF, JPG, PNG, WEBP, DWG, DXF, DOCX, XLSX e ZIP.</span>
      </label>

      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label>Lascia vuoto questo campo<input name="aziendaSito" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className="flex items-start gap-3 text-xs leading-5 text-[#5C554D]">
        <input className="mt-1 h-4 w-4 shrink-0 accent-[#8F4525]" type="checkbox" name="privacy" required />
        <span>Ho letto l’informativa privacy e chiedo di essere ricontattato in merito al progetto. *</span>
      </label>

      {esito && !esito.successo && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{esito.errore}</p>}
      <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1E1B18] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#8F4525] disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Invio in corso…</> : <>Invia il progetto <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}
