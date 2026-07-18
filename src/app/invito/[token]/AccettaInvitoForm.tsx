'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { dettaglioInvitoPubblico, accettaInvitoAzione } from './azioni';

interface DettaglioInvito {
  email: string;
  tenantNome: string;
  stato: string;
  scaduto: boolean;
  richiedeNuovoAccount: boolean;
}

export function AccettaInvitoForm({ token }: { token: string }) {
  const router = useRouter();
  const [dettaglio, setDettaglio] = useState<DettaglioInvito | null | 'caricamento'>('caricamento');
  const [nome, setNome] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState<string | null>(null);
  const [completato, setCompletato] = useState(false);
  const [inCorso, iniziaTransizione] = useTransition();

  useEffect(() => {
    dettaglioInvitoPubblico(token).then(setDettaglio);
  }, [token]);

  function invia(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    iniziaTransizione(async () => {
      const esito = await accettaInvitoAzione(
        token,
        dettaglio !== 'caricamento' && dettaglio?.richiedeNuovoAccount
          ? { nome, password }
          : undefined,
      );
      if (!esito.successo) {
        setErrore(esito.errore ?? 'Errore imprevisto.');
        return;
      }
      setCompletato(true);
      setTimeout(() => router.push('/admin/login'), 2000);
    });
  }

  if (dettaglio === 'caricamento') {
    return (
      <p className="p-12 text-center text-muted-foreground">Verifica dell&apos;invito in corso…</p>
    );
  }

  if (!dettaglio || dettaglio.stato !== 'CREATO' || dettaglio.scaduto) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center text-muted-foreground">
            Questo invito non è più valido (scaduto, già usato o revocato).
          </CardContent>
        </Card>
      </main>
    );
  }

  if (completato) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-accent">Invito accettato.</p>
            <p className="mt-2 text-sm text-muted-foreground">Ti reindirizziamo al login…</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Invito a {dettaglio.tenantNome}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Sei stato invitato con l&apos;indirizzo <strong>{dettaglio.email}</strong>.
          </p>
          <form onSubmit={invia} className="space-y-4">
            {dettaglio.richiedeNuovoAccount ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome e cognome</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Scegli una password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Almeno 10 caratteri, una maiuscola, un numero.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Hai già un account: accettando, questa azienda si aggiungerà ai tuoi accessi
                esistenti, senza bisogno di una nuova password.
              </p>
            )}
            {errore && <p className="text-sm text-destructive">{errore}</p>}
            <Button type="submit" className="w-full" disabled={inCorso}>
              {inCorso ? 'Attendi…' : 'Accetta invito'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
