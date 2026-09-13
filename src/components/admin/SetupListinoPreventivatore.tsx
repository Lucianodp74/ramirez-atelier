'use client';

import { useState, useTransition } from 'react';
import { preparaVociTecnichePreventivatore } from '@/app/admin/(protetto)/catalogo/preventivatore/azioni-setup';

export default function SetupListinoPreventivatore() {
  const [pending, startTransition] = useTransition();
  const [messaggio, setMessaggio] = useState<string | null>(null);

  const prepara = () => startTransition(async () => {
    try {
      const risultato = await preparaVociTecnichePreventivatore();
      const base = risultato.create === 0
        ? 'Le voci tecniche esistono già.'
        : `Predisposte ${risultato.create} voci tecniche nel Listino.`;
      const problemi = risultato.errori.length
        ? ` Correggere prima dell’uso: ${risultato.errori.join(' ')}`
        : ' Inserisci i valori Ramirez e attiva le voci prima dell’uso.';
      setMessaggio(base + problemi);
      window.location.reload();
    } catch (e) {
      setMessaggio(e instanceof Error ? e.message : 'Preparazione non riuscita.');
    }
  });

  return (
    <div className="rounded-xl border p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Preparazione Listino Preventivatore</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Crea solo le voci tecniche mancanti, senza inventare prezzi. Le nuove voci restano a 0 finché non vengono valorizzate e attivate manualmente.</p>
        </div>
        <button type="button" onClick={prepara} disabled={pending} className="shrink-0 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50">{pending ? 'Preparazione…' : 'Predisponi voci mancanti'}</button>
      </div>
      {messaggio && <p className="mt-4 rounded-md border p-3 text-sm">{messaggio}</p>}
    </div>
  );
}
