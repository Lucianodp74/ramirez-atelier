'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { aggiungiComposizioneABomAzione } from '@/app/admin/composizioni-azioni';

type BomOption = {
  id: string;
  richiestaId: string;
  versione: number;
  righeCount: number;
};

type ActionState = {
  ok: boolean;
  message: string;
  bomId?: string;
};

const initialState: ActionState = { ok: false, message: '' };

export function ComposizioneBomForm({ composizioneId, bomBozza }: { composizioneId: string; bomBozza: BomOption[] }) {
  const [state, formAction, pending] = useActionState(aggiungiComposizioneABomAzione, initialState);

  return (
    <div className="space-y-3">
      <form action={formAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input type="hidden" name="composizioneId" value={composizioneId} />
        <select
          name="bomId"
          required
          defaultValue=""
          className="rounded-md border bg-background p-2"
          disabled={pending}
        >
          <option value="">Seleziona BOM in bozza…</option>
          {bomBozza.map((item) => (
            <option key={item.id} value={item.id}>
              {item.richiestaId} · v{item.versione} · {item.righeCount} righe
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Trasferimento in corso…' : 'Aggiungi alla BOM'}
        </button>
      </form>

      {state.message && (
        <div className={state.ok ? 'rounded-md border p-3 text-sm' : 'rounded-md border p-3 text-sm text-destructive'}>
          <span>{state.message}</span>
          {state.ok && state.bomId ? (
            <Link href={`/admin/bom/${state.bomId}`} className="ml-2 font-medium underline">
              Apri BOM
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
