'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { aggiungiCommentoRichiesta } from '@/app/admin/azioni';
import type { CommentoInterno } from '@prisma/client';

interface Props {
  richiestaId: string;
  commenti: CommentoInterno[];
}

export function NoteInterne({ richiestaId, commenti }: Props) {
  const router = useRouter();
  const [testo, setTesto] = useState('');
  const [inCorso, iniziaTransizione] = useTransition();

  function invia() {
    if (!testo.trim()) return;
    iniziaTransizione(async () => {
      await aggiungiCommentoRichiesta(richiestaId, testo);
      setTesto('');
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Queste note sono visibili solo al personale interno — il cliente non le vedrà mai.
      </p>
      <div className="space-y-2">
        <Textarea
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          placeholder="Aggiungi una nota interna…"
          rows={3}
        />
        <Button size="sm" onClick={invia} disabled={inCorso || !testo.trim()}>
          {inCorso ? 'Salvataggio…' : 'Aggiungi nota'}
        </Button>
      </div>

      {commenti.length > 0 && (
        <ul className="space-y-3">
          {commenti.map((c) => (
            <li key={c.id} className="rounded-md border border-border bg-secondary/30 p-3">
              <p className="text-sm">{c.testo}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.autore} · {new Date(c.createdAt).toLocaleString('it-IT')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
