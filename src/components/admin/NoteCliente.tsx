'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { aggiornaNoteClienteAzione } from '@/app/admin/azioni';

export function NoteCliente({
  clienteId,
  noteIniziali,
}: {
  clienteId: string;
  noteIniziali: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState(noteIniziali);
  const [inCorso, iniziaTransizione] = useTransition();

  return (
    <div className="space-y-2">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note su questo cliente — preferenze, contesto, promemoria per la prossima chiamata..."
        rows={3}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={inCorso}
        onClick={() =>
          iniziaTransizione(async () => {
            await aggiornaNoteClienteAzione(clienteId, note);
            router.refresh();
          })
        }
      >
        {inCorso ? 'Salvataggio…' : 'Salva nota'}
      </Button>
    </div>
  );
}
