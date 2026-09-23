'use server';

import { idTenantRamirezAtelier } from '@/server/identity/tenant-corrente';
import { db } from '@/server/db';
import { caricaTariffePreventivatore } from '@/server/services/preventivatore-listino-service';
import { calcolaPreventivoModulare } from '@/lib/preventivatore/prezzo-modulare';
import { validaInputModuli } from '@/lib/preventivatore/validazione-moduli';

const CHIAVI_TIPO_PROGETTO_PREVENTIVATORE = ['falegnameria', 'falegnameria-su-misura', 'living', 'zona-giorno'] as const;

async function caricaTipoProgettoPreventivatore(tenantId: string) {
  const tipi = await db.tipoProgetto.findMany({
    where: { tenantId, attivo: true, chiave: { in: [...CHIAVI_TIPO_PROGETTO_PREVENTIVATORE] } },
    orderBy: { ordinamento: 'asc' },
  });
  const tipo = CHIAVI_TIPO_PROGETTO_PREVENTIVATORE.map((chiave) => tipi.find((item: { chiave: string }) => item.chiave === chiave)).find(Boolean);
  if (!tipo) throw new Error('Il tipo di progetto del preventivatore non è ancora configurato.');
  return tipo;
}

/** DTO pubblico: il browser riceve solo la stima commerciale, mai costi, ore o ricarico interni. */
export async function calcolaStimaPreventivatore(moduli: unknown) {
  validaInputModuli(moduli);
  const tenantId = await idTenantRamirezAtelier();
  const tariffe = await caricaTariffePreventivatore(tenantId);
  const preventivo = calcolaPreventivoModulare(moduli, tariffe);
  if (preventivo.errori.length) throw new Error(preventivo.errori.join(' '));
  return { successo: true as const, prezzoIndicativo: preventivo.prezzoIndicativo };
}

export interface DatiRichiestaPreventivatore { nome: string; email: string; telefono?: string; messaggio?: string; }

/** Salva richiesta, snapshot della configurazione e BOM tecnica/economica iniziale in un'unica transazione. */
export async function salvaRichiestaPreventivatore(moduli: unknown, dati: DatiRichiestaPreventivatore) {
  validaInputModuli(moduli);
  const nome = dati.nome?.trim();
  const email = dati.email?.trim().toLowerCase();
  const telefono = dati.telefono?.trim() || null;
  const messaggio = dati.messaggio?.trim() || null;
  if (!nome || nome.length < 2 || nome.length > 120) throw new Error('Inserisci nome e cognome.');
  if (!email || email.length > 180 || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Inserisci un indirizzo email valido.');
  if (telefono && telefono.length > 40) throw new Error('Numero di telefono non valido.');
  if (messaggio && messaggio.length > 2000) throw new Error('Messaggio troppo lungo.');

  const tenantId = await idTenantRamirezAtelier();
  const tipoProgetto = await caricaTipoProgettoPreventivatore(tenantId);
  const tariffe = await caricaTariffePreventivatore(tenantId);
  const preventivo = calcolaPreventivoModulare(moduli, tariffe);
  if (preventivo.errori.length) throw new Error(preventivo.errori.join(' '));

  const nuova = await db.$transaction(async (tx) => {
    const richiesta = await tx.richiestaProgetto.create({ data: {
      tenantId, tipoProgettoId: tipoProgetto.id, clienteNome: nome, clienteEmail: email, clienteTelefono: telefono, messaggioLibero: messaggio,
      datiFormJson: { origine: 'preventivatore-modulare-v2' },
      datiEstensione: { preventivatoreModulare: { versione: 2, moduli, stima: { prezzoIndicativo: preventivo.prezzoIndicativo, costoProduzione: preventivo.costoProduzione, calcolataIl: new Date().toISOString() } } },
      fasciaPrezzoMin: preventivo.prezzoIndicativo, fasciaPrezzoMax: preventivo.prezzoIndicativo, indiceCompletezza: 100, stato: 'NUOVA',
    } });

    const bomId = crypto.randomUUID();
    await tx.$executeRaw`INSERT INTO "bom" ("id", "tenantId", "richiestaId", "stato", "versione", "noteProduzione", "createdAt", "updatedAt") VALUES (${bomId}, ${tenantId}, ${richiesta.id}, 'BOZZA', 1, 'Generata dal Preventivatore Modulare V2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;

    for (const [indice, riga] of preventivo.righe.entries()) {
      const modulo = moduli.find((m) => m.id === riga.id);
      if (!modulo) continue;
      const w = modulo.larghezzaCm / 100;
      const h = modulo.altezzaCm / 100;
      const d = modulo.profonditaCm / 100;
      const areaFianchi = 2 * h * d;
      const areaBaseCielo = 2 * w * d;
      const areaFronte = w * h;
      const areaRipiani = riga.distinta.ripiani * w * d;
      const areaRetro = w * h;
      const areaMateriale = areaFianchi + areaBaseCielo + areaFronte + areaRipiani + areaRetro;
      const areaFinitura = areaFianchi + areaBaseCielo + areaFronte + areaRipiani;
      const quotaMateriale = (area: number) => riga.materiale * (area / Math.max(areaMateriale, 0.0001));
      const quotaFinitura = (area: number) => riga.finitura * (area / Math.max(areaFinitura, 0.0001));
      const descrizione = `${modulo.tipo} ${modulo.larghezzaCm}×${modulo.altezzaCm}×${modulo.profonditaCm} cm · ${modulo.materiale} · ${modulo.finitura}`;
      const componentiFrontali = riga.distinta.componenti.filter((item) => item.categoria === 'FRONTALE');
      const quantitaFrontali = componentiFrontali.reduce((somma, item) => somma + item.quantita, 0);

      const righe = riga.distinta.componenti.map((item) => {
        let costo = 0;
        if (item.codice === 'PANNELLO-FIANCO') costo = quotaMateriale(areaFianchi) + quotaFinitura(areaFianchi);
        else if (item.codice === 'PANNELLO-BASE' || item.codice === 'PANNELLO-CIELO') costo = quotaMateriale(w * d) + quotaFinitura(w * d);
        else if (item.codice === 'RIPIANO') costo = quotaMateriale(areaRipiani) + quotaFinitura(areaRipiani);
        else if (item.categoria === 'FRONTALE') {
          const areaQuota = areaFronte * (item.quantita / Math.max(quantitaFrontali, 1));
          costo = quotaMateriale(areaQuota) + quotaFinitura(areaQuota);
        } else if (item.codice === 'SCHIENALE') costo = quotaMateriale(areaRetro);
        else if (item.codice === 'BORDO-ML') costo = riga.bordo;
        else if (item.codice === 'FER-HARDWARE') costo = riga.ferramenta;
        else if (item.codice === 'MAN-ORE') costo = riga.manodopera;
        const dimensioni = item.larghezzaCm !== undefined && item.altezzaCm !== undefined
          ? ` · ${item.larghezzaCm}×${item.altezzaCm}${item.profonditaCm ? `×${item.profonditaCm}` : ''} cm`
          : '';
        const note = item.note ? `${item.note} ` : '';
        return {
          categoria: item.categoria, codice: item.codice, voce: item.voce, unita: item.unita, quantita: item.quantita, costo,
          descrizione: `${item.voce}${dimensioni} · ${descrizione}`,
          note: `${note}Snapshot parametrico: verificare dimensioni esecutive prima della produzione`.trim(),
        };
      });

      for (const [posizione, item] of righe.entries()) {
        if (item.quantita <= 0 || item.costo <= 0) continue;
        await tx.$executeRaw`INSERT INTO "bom_riga" ("id", "bomId", "ordinamento", "categoria", "codice", "descrizione", "unita", "quantita", "materiale", "lavorazione", "costoUnitario", "note", "createdAt", "updatedAt") VALUES (${crypto.randomUUID()}, ${bomId}, ${indice * 100 + posizione}, ${item.categoria}, ${item.codice}, ${item.descrizione}, ${item.unita}, ${item.quantita}, ${modulo.materiale}, ${modulo.finitura}, ${item.costo / item.quantita}, ${item.note}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
      }
    }

    await tx.eventoAttivita.create({ data: { richiestaId: richiesta.id, tipo: 'RICHIESTA_CREATA', descrizione: 'Richiesta creata dal Preventivatore Modulare V2 con BOM tecnica/economica iniziale.', metadatiJson: { origine: 'preventivatore-modulare-v2', tipoProgetto: tipoProgetto.chiave, bomId, prezzoIndicativo: preventivo.prezzoIndicativo }, attore: 'CLIENTE' } });
    return { richiesta, bomId };
  });

  return { successo: true as const, id: nuova.richiesta.id, tokenRipresa: nuova.richiesta.tokenRipresa, bomId: nuova.bomId, prezzoIndicativo: preventivo.prezzoIndicativo };
}
