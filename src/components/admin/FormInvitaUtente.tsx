'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { invitaUtenteAzione } from '@/app/admin/azioni';

export function FormInvitaUtente({ nomiRuoli }: { nomiRuoli: string[] }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [ruolo, setRuolo] = useState(nomiRuoli[0] ?? '');
  const [linkInvito, setLinkInvito] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, iniziaTransizione] = useTransition();

  function invia(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !ruolo) return;
    setErrore(null);
    setLinkInvito(null);
    iniziaTransizione(async () => {
      try {
        const { linkInvito } = await invitaUtenteAzione(email.trim(), ruolo);
        setLinkInvito(linkInvito);
        setEmail('');
        router.refresh();
      } catch (e) {
        setErrore(e instanceof Error ? e.message : 'Errore imprevisto.');
      }
    });
  }

  return (
    <form
      onSubmit={invia}
      className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-4"
    >
      <div className="sm:col-span-2">
        <Label htmlFor="email-invito">Email</Label>
        <Input
          id="email-invito"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@esempio.it"
        />
      </div>
      <div>
        <Label htmlFor="ruolo-invito">Ruolo</Label>
        <select
          id="ruolo-invito"
          value={ruolo}
          onChange={(e) => setRuolo(e.target.value)}
          className="flex h-11 w-full rounded-md border border-input bg-secondary/40 px-3 text-sm"
        >
          {nomiRuoli.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={inCorso} className="w-full">
          {inCorso ? 'Invio…' : 'Invita'}
        </Button>
      </div>
      {errore && <p className="text-sm text-destructive sm:col-span-4">{errore}</p>}
      {linkInvito && (
        <p className="text-sm text-muted-foreground sm:col-span-4">
          Email di invito inviata. In sviluppo (nessun provider email reale configurato) il
          contenuto compare nel log del server — questo è comunque il link diretto:{' '}
          <code className="rounded bg-secondary/40 px-1">{linkInvito}</code>
        </p>
      )}
    </form>
  );
}
