'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function RecuperaPasswordPage() {
  const [email, setEmail] = useState('');
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const [inCorso, iniziaTransizione] = useTransition();

  function invia(e: React.FormEvent) {
    e.preventDefault();
    iniziaTransizione(async () => {
      const risposta = await fetch('/api/auth/recupero-password/richiedi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const dati = await risposta.json();
      setMessaggio(dati.messaggio);
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Recupera password</CardTitle>
        </CardHeader>
        <CardContent>
          {messaggio ? (
            <p className="text-sm text-muted-foreground">{messaggio}</p>
          ) : (
            <form onSubmit={invia} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={inCorso}>
                {inCorso ? 'Invio…' : 'Invia le istruzioni'}
              </Button>
            </form>
          )}
          <Link
            href="/admin/login"
            className="mt-4 block text-center text-sm text-muted-foreground hover:underline"
          >
            Torna al login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
