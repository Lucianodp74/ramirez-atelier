import { renderToBuffer } from '@react-pdf/renderer';
import { datiPreventivoPdf } from '@/server/services/preventivo-pdf-service';
import { PreventivoDocument } from './PreventivoDocument';

/**
 * Unico punto di ingresso per ottenere il PDF del preventivo come Buffer,
 * indipendentemente da chi lo consuma - la route HTTP (`preventivo-pdf/
 * route.tsx`), un futuro invio email, un futuro salvataggio come snapshot,
 * o una rigenerazione da una Commessa. Nessuno di questi canali deve mai
 * richiamare `renderToBuffer` direttamente: passano tutti da qui, così un
 * domani cambio nella libreria di rendering o nella risoluzione dei dati
 * si applica a ogni canale in un solo posto.
 */
export async function generaPreventivoPdfBuffer(
  tenantId: string,
  richiestaId: string,
): Promise<{ buffer: Buffer; numeroPreventivo: string }> {
  const dati = await datiPreventivoPdf(tenantId, richiestaId);
  const buffer = await renderToBuffer(<PreventivoDocument dati={dati} />);
  return { buffer, numeroPreventivo: dati.numeroPreventivo };
}
