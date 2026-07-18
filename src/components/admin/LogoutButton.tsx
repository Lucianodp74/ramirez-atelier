'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();
  const [inCorso, iniziaTransizione] = useTransition();

  function esegui() {
    iniziaTransizione(async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={esegui} disabled={inCorso}>
      {inCorso ? 'Uscita…' : 'Esci'}
    </Button>
  );
}
