'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { impostaStatoRegolaAzione } from '@/app/admin/azioni';
import type { StatoRegola } from '@prisma/client';

export function ToggleRegola({ id, stato }: { id: string; stato: StatoRegola }) {
  const router = useRouter();
  const [inCorso, iniziaTransizione] = useTransition();
  const attiva = stato === 'ATTIVA';

  return (
    <Button
      type="button"
      variant={attiva ? 'outline' : 'accent'}
      size="sm"
      disabled={inCorso}
      onClick={() =>
        iniziaTransizione(async () => {
          await impostaStatoRegolaAzione(id, attiva ? 'DISATTIVA' : 'ATTIVA');
          router.refresh();
        })
      }
    >
      {attiva ? 'Disattiva' : 'Attiva'}
    </Button>
  );
}
