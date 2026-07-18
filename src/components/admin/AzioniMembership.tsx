'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  sospendiMembershipAzione,
  riattivaMembershipAzione,
  revocaMembershipAzione,
} from '@/app/admin/azioni';

export function AzioniMembership({ membershipId, stato }: { membershipId: string; stato: string }) {
  const router = useRouter();
  const [inCorso, iniziaTransizione] = useTransition();

  function esegui(azione: (id: string) => Promise<void>) {
    iniziaTransizione(async () => {
      await azione(membershipId);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      {stato === 'ATTIVA' && (
        <Button
          size="sm"
          variant="outline"
          disabled={inCorso}
          onClick={() => esegui(sospendiMembershipAzione)}
        >
          Sospendi
        </Button>
      )}
      {stato === 'SOSPESA' && (
        <Button
          size="sm"
          variant="accent"
          disabled={inCorso}
          onClick={() => esegui(riattivaMembershipAzione)}
        >
          Riattiva
        </Button>
      )}
      {stato !== 'REVOCATA' && (
        <Button
          size="sm"
          variant="outline"
          disabled={inCorso}
          onClick={() => {
            if (
              confirm(
                "Revocare definitivamente questo accesso? L'utente perderà immediatamente ogni sessione su questa azienda.",
              )
            ) {
              esegui(revocaMembershipAzione);
            }
          }}
        >
          Revoca
        </Button>
      )}
    </div>
  );
}
