import { PreventivatoreModulare } from '@/components/preventivatore/PreventivatoreModulare';
import { PreventivatoreInspiration } from '@/components/preventivatore/PreventivatoreInspiration';
import { GalleriaProgettiPreimpostati } from '@/components/preventivatore/GalleriaProgettiPreimpostati';
import { idTenantRamirezAtelier } from '@/server/identity/tenant-corrente';
import { recuperaProgettoPreimpostatoPubblicato } from '@/server/services/progetto-preimpostato-service';

export const metadata = {
  title: 'Preventivatore | Ramirez Atelier',
  description: 'Configura il tuo arredo su misura e ottieni una stima indicativa.',
};

export default async function PreventivatorePage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>;
}) {
  const { preset } = await searchParams;

  // COMPOSIZIONI / CATALOGO V1: il preset, se presente, viene caricato e
  // rivalidato interamente lato server (tenant-scoped, solo se pubblicato)
  // prima di essere passato al componente - stesse funzioni di validazione
  // già usate dal Preventivatore, nessuna regola nuova. Un id assente,
  // inesistente o non pubblicato non è un errore: il Preventivatore si apre
  // semplicemente col comportamento di sempre.
  let moduliIniziali;
  if (preset) {
    const tenantId = await idTenantRamirezAtelier();
    const progetto = await recuperaProgettoPreimpostatoPubblicato(tenantId, preset);
    moduliIniziali = progetto?.moduli;
  }

  return (
    <>
      <PreventivatoreInspiration />
      <GalleriaProgettiPreimpostati />
      <PreventivatoreModulare moduliIniziali={moduliIniziali} />
    </>
  );
}
