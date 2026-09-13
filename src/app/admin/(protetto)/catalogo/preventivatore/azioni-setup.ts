'use server';

import { richiediContesto } from '@/server/identity/contesto';
import { creaPrezzoListino, elencoPrezziListino } from '@/server/services/listino-prezzi-service';

const REQUISITI = [
  ['MAT-TRUCIOLARE', 'Truciolare', 'MATERIALE', 'M2'],
  ['MAT-MDF', 'MDF', 'MATERIALE', 'M2'],
  ['MAT-MULTISTRATO', 'Multistrato', 'MATERIALE', 'M2'],
  ['FIN-MELAMINICO', 'Melaminico', 'COMPONENTE', 'M2'],
  ['FIN-LAMINATO', 'Laminato', 'COMPONENTE', 'M2'],
  ['FIN-LACCATO', 'Laccato', 'COMPONENTE', 'M2'],
  ['SERV-BORDO-ML', 'Bordatura', 'COMPONENTE', 'ML'],
  ['MAT-RETRO-M2', 'Retro', 'MATERIALE', 'M2'],
  ['FER-PORTA', 'Ferramenta porta', 'COMPONENTE', 'PZ'],
  ['FER-CASSETTO', 'Ferramenta cassetto', 'COMPONENTE', 'PZ'],
  ['MAN-ORE-BASE', 'Ore base', 'COMPONENTE', 'H'],
  ['MAN-ORE-M2', 'Ore per m²', 'COMPONENTE', 'H/M2'],
  ['MAN-ORE-PORTA', 'Ore per porta', 'COMPONENTE', 'H/PZ'],
  ['MAN-ORE-CASSETTO', 'Ore per cassetto', 'COMPONENTE', 'H/PZ'],
  ['MAN-ORE-RIPIANO', 'Ore per ripiano', 'COMPONENTE', 'H/PZ'],
  ['MAN-COSTO-ORA', 'Costo orario', 'COMPONENTE', 'EUR/H'],
  ['COMM-RICARICO', 'Ricarico commerciale', 'COMPONENTE', '%'],
] as const;

export async function preparaVociTecnichePreventivatore() {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'scrivi' });
  const esistenti = await elencoPrezziListino(contesto.tenantId);
  const codici = new Set(esistenti.map((voce) => voce.codice));
  let create = 0;

  for (const [codice, nome, tipo, unita] of REQUISITI) {
    if (codici.has(codice)) continue;
    await creaPrezzoListino(contesto.tenantId, {
      tipo,
      categoria: 'PREVENTIVATORE',
      codice,
      nome,
      descrizione: 'Voce tecnica predisposta per il Preventivatore Modulare V2. Inserire il valore Ramirez prima dell’attivazione.',
      unita,
      prezzo: 0,
    });
    create += 1;
  }

  return { create };
}
