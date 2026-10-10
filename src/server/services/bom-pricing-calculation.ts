/**
 * Compatibilità con il vecchio percorso d'importazione.
 * Il calcolo commerciale deve avere una sola implementazione: quella in src/lib,
 * con default Ramirez al 40% e regole condivise da UI e servizi server.
 */
export { calcolaPrezzoBom } from '@/lib/bom-pricing-calculation';
export type { BomPrezzoInput, BomPrezzoSummary } from '@/lib/bom-pricing-calculation';
