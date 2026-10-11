import { PreventivatoreModulare } from '@/components/preventivatore/PreventivatoreModulare';
import { idTenantRamirezAtelier } from '@/server/identity/tenant-corrente';
import { recuperaProgettoPreimpostatoPubblicato } from '@/server/services/progetto-preimpostato-service';
import { moduliPerPreventivatore } from '@/lib/catalogo-librerie/catalogo';
import { anteprimaInternaConsentita } from '@/server/services/catalogo-librerie-accesso';

export const metadata = {
  title: 'Preventivatore | Ramirez Atelier',
  description: 'Configura il tuo arredo su misura e ottieni una stima indicativa.',
};

export default async function PreventivatorePage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; modello?: string }>;
}) {
  const { preset, modello } = await searchParams;

  // COMPOSIZIONI / CATALOGO V1: il preset, se presente, viene caricato e
  // rivalidato interamente lato server (tenant-scoped, solo se pubblicato)
  // prima di essere passato al componente - stesse funzioni di validazione
  // già usate dal Preventivatore, nessuna regola nuova. Un id assente,
  // inesistente o non pubblicato non è un errore: il Preventivatore si apre
  // semplicemente col comportamento di sempre.
  let moduliIniziali;
  let codiceModelloOrigine: string | undefined;
  if (preset) {
    const tenantId = await idTenantRamirezAtelier();
    const progetto = await recuperaProgettoPreimpostatoPubblicato(tenantId, preset);
    moduliIniziali = progetto?.moduli;
  } else if (modello) {
    // CATALOGO LIBRERIE V1: stesso principio del preset. Il codice modello
    // viene risolto lato server: solo un modello approvato (o una bozza, per
    // chi è autenticato nell'area operativa) apre il Preventivatore con la
    // sua composizione; in ogni altro caso si apre col comportamento di sempre.
    const anteprimaInterna = await anteprimaInternaConsentita();
    moduliIniziali = moduliPerPreventivatore(modello, { anteprimaInterna }) ?? undefined;
    // Il codice accompagna la richiesta solo se il modello ha davvero aperto
    // il Preventivatore; al salvataggio il server lo convalida di nuovo.
    if (moduliIniziali) codiceModelloOrigine = modello;
  }

  return (
    <PreventivatoreModulare
      key={preset ?? modello ?? 'default'}
      moduliIniziali={moduliIniziali}
      codiceModelloOrigine={codiceModelloOrigine}
    />
  );
}
