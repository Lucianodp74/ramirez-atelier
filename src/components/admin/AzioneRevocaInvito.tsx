'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { revocaInvitoAzione } from '@/app/admin/azioni';

export function AzioneRevocaInvito({ invitoId }: { invitoId: string }) {
  const router = useRouter();
  const [inCorso, iniziaTransizione] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={inCorso}
      onClick={() =>
        iniziaTransizione(async () => {
          await revocaInvitoAzione(invitoId);
          router.refresh();
        })
      }
    >
      {inCorso ? 'Revoca…' : 'Revoca invito'}
    </Button>
  );
}
