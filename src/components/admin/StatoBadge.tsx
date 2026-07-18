import { Badge } from '@/components/ui/badge';
import { ETICHETTA_STATO } from '@/lib/workflow';
import type { StatoRichiesta } from '@prisma/client';

const VARIANTE_PER_STATO: Record<StatoRichiesta, 'default' | 'accent' | 'outline'> = {
  BOZZA: 'outline',
  NUOVA: 'accent',
  IN_REVISIONE: 'default',
  PREVENTIVO_INVIATO: 'default',
  CONVERTITA: 'accent',
  CHIUSA: 'outline',
};

export function StatoBadge({ stato }: { stato: StatoRichiesta }) {
  return <Badge variant={VARIANTE_PER_STATO[stato]}>{ETICHETTA_STATO[stato]}</Badge>;
}
