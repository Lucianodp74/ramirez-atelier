'use client';

import { useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function CompletaRecuperoPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [nuovaPassword, setNuovaPassword] = useState('');
  const [errore, setErrore] = useState<string | null>(null);
  const [completato, setCompletato] = useState(false);
  const [inCorso, iniziaTransizione] = useTransition();

  function invia(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    iniziaTransizione(async () => {
      const risposta = await fetch('/api/auth/recupero-password/completa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token, nuovaPassword }),
      });
      const dati = await risposta.json();
      if (!risposta.ok) {
        setErrore(dati.errore ?? 'Impossibile completare il recupero.');
        return;
      }
      setCompletato(true);
      setTimeout(() => router.push('/admin/login'), 2000);
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Imposta una nuova password</CardTitle>
        </CardHeader>
        <CardContent>
          {completato ? (
            <p className="text-sm text-muted-foreground">
              Password aggiornata. Verrai reindirizzato al login…
            </p>
          ) : (
            <form onSubmit={invia} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nuova-password">Nuova password</Label>
                <Input
                  id="nuova-password"
                  type="password"
                  value={nuovaPassword}
                  onChange={(e) => setNuovaPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              {errore && <p className="text-sm text-destructive">{errore}</p>}
              <Button type="submit" className="w-full" disabled={inCorso}>
                {inCorso ? 'Salvataggio…' : 'Imposta nuova password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
