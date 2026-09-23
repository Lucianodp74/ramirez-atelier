'use server';

import { richiediContesto } from '@/server/identity/contesto';
import { creaPrezzoListino, elencoPrezziListino } from '@/server/services/listino-prezzi-service';
import { DEFINIZIONI_TARIFFE_PREVENTIVATORE } from '@/lib/preventivatore/tariffe';

export async function preparaVociTecnichePreventivatore() {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'scrivi' });
  const esistenti = await elencoPrezziListino(contesto.tenantId);
  const codici = new Set(esistenti.map((voce) => voce.codice));
  const unitaPerCodice = new Map(esistenti.map((voce) => [voce.codice, voce.unita]));
  let create = 0;
  const errori: string[] = [];

  for (const voce of DEFINIZIONI_TARIFFE_PREVENTIVATORE) {
    if (codici.has(voce.codice)) {
      const unitaEsistente = unitaPerCodice.get(voce.codice);
      if (unitaEsistente !== voce.unita) {
        errori.push(`${voce.codice}: unità richiesta ${voce.unita}, trovata ${unitaEsistente ?? 'assente'}.`);
      }
      continue;
    }

    await creaPrezzoListino(contesto.tenantId, {
      tipo: voce.tipo,
      categoria: 'PREVENTIVATORE',
      codice: voce.codice,
      nome: voce.nome,
      descrizione: 'Voce tecnica predisposta per il Preventivatore Modulare V2. Inserire il valore Ramirez prima dell’attivazione.',
      unita: voce.unita,
      prezzo: 0,
      attivo: false,
    });
    create += 1;
  }

  return { create, errori };
}
