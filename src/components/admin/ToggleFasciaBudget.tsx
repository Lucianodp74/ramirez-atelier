'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { impostaAttivaFasciaBudgetAzione } from '@/app/admin/azioni';

export function ToggleFasciaBudget({ id, attiva }: { id: string; attiva: boolean }) {
  const router = useRouter();
  const [inCorso, iniziaTransizione] = useTransition();

  return (
    <Button
      type="button"
      variant={attiva ? 'outline' : 'accent'}
      size="sm"
      disabled={inCorso}
      onClick={() =>
        iniziaTransizione(async () => {
          await impostaAttivaFasciaBudgetAzione(id, !attiva);
          router.refresh();
        })
      }
    >
      {attiva ? 'Disattiva' : 'Attiva'}
    </Button>
  );
}
