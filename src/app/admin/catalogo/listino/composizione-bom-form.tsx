'use client';

import { useState } from 'react';
import { aggiungiComposizioneABomAzione } from '@/app/admin/composizioni-azioni';

type BomOption = {
  id: string;
  richiestaId: string;
  versione: number;
  righeCount: number;
};

export function ComposizioneBomForm({ composizioneId, bomBozza }: { composizioneId: string; bomBozza: BomOption[] }) {
  const [bomId, setBomId] = useState('');

  return (
    <form action={aggiungiComposizioneABomAzione} className="grid gap-3 md:grid-cols-[1fr_auto]">
      <input type="hidden" name="composizioneId" value={composizioneId} />
      <select
        name="bomId"
        value={bomId}
        onChange={(event) => setBomId(event.target.value)}
        required
        className="rounded-md border bg-background p-2"
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
        disabled={!bomId}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        Aggiungi alla BOM
      </button>
    </form>
  );
}
