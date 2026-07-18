'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, iniziaTransizione] = useTransition();

  function invia(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    iniziaTransizione(async () => {
      const risposta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const dati = await risposta.json();
      if (!risposta.ok) {
        setErrore(dati.errore ?? 'Accesso non riuscito.');
        return;
      }
      router.push('/admin');
      router.refresh();
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Ramirez Atelier — Accesso</CardTitle>
        </CardHeader>
        <CardContent>
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
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {errore && <p className="text-sm text-destructive">{errore}</p>}
            <Button type="submit" className="w-full" disabled={inCorso}>
              {inCorso ? 'Accesso in corso…' : 'Accedi'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
