'use server';

import { idTenantRamirezAtelier } from '@/server/identity/tenant-corrente';
import { db } from '@/server/db';
import { caricaTariffePreventivatore } from '@/server/services/preventivatore-listino-service';
import { calcolaPreventivoModulare } from '@/lib/preventivatore/prezzo-modulare';
import { validaModulo, type ModuloConfigurato } from '@/lib/preventivatore/moduli';

const CHIAVI_TIPO_PROGETTO_PREVENTIVATORE = ['falegnameria', 'falegnameria-su-misura', 'living', 'zona-giorno'] as const;
const MAX_MODULI = 30;
const MAX_INPUT_BYTES = 50_000;
const MAX_ID_LENGTH = 80;

function isModuloConfigurato(value: unknown): value is ModuloConfigurato {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  return typeof m.id === 'string' && m.id.length > 0 && m.id.length <= MAX_ID_LENGTH
    && typeof m.tipo === 'string'
    && typeof m.larghezzaCm === 'number' && Number.isFinite(m.larghezzaCm)
    && typeof m.altezzaCm === 'number' && Number.isFinite(m.altezzaCm)
    && typeof m.profonditaCm === 'number' && Number.isFinite(m.profonditaCm)
    && typeof m.materiale === 'string'
    && typeof m.finitura === 'string'
    && typeof m.configurazione === 'string'
    && (m.ripiani === undefined || (typeof m.ripiani === 'number' && Number.isInteger(m.ripiani)));
}

function validaInputModuli(input: unknown): asserts input is ModuloConfigurato[] {
  if (!Array.isArray(input) || input.length === 0) throw new Error('Aggiungi almeno un modulo.');
  if (input.length > MAX_MODULI) throw new Error(`Il preventivo può contenere al massimo ${MAX_MODULI} moduli.`);
  const serialized = JSON.stringify(input);
  if (serialized.length > MAX_INPUT_BYTES) throw new Error('Configurazione troppo grande. Riduci il numero di moduli o le opzioni.');
  for (const [index, value] of input.entries()) {
    if (!isModuloConfigurato(value)) throw new Error(`Modulo ${index + 1} non valido.`);
    const errors = validaModulo(value);
    if (errors.length) throw new Error(`Modulo ${index + 1}: ${errors.join(' ')}`);
  }
}

async function caricaTipoProgettoPreventivatore(tenantId: string) {
  const tipi = await db.tipoProgetto.findMany({
    where: { tenantId, attivo: true, chiave: { in: [...CHIAVI_TIPO_PROGETTO_PREVENTIVATORE] } },
    orderBy: { ordinamento: 'asc' },
  });
  const tipo = CHIAVI_TIPO_PROGETTO_PREVENTIVATORE.map((chiave) => tipi.find((item) => item.chiave === chiave)).find(Boolean);
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
      const areaTotale = areaFianchi + areaBaseCielo + areaFronte + areaRipiani;
      const quota = (area: number) => riga.materiale * (area / Math.max(areaTotale, 0.0001));
      const descrizione = `${modulo.tipo} ${modulo.larghezzaCm}×${modulo.altezzaCm}×${modulo.profonditaCm} cm · ${modulo.materiale} · ${modulo.finitura}`;
      const componentiFrontali = riga.distinta.componenti.filter((item) => item.categoria === 'FRONTALE');
      const quantitaFrontali = componentiFrontali.reduce((somma, item) => somma + item.quantita, 0);

      const righe = riga.distinta.componenti.map((item) => {
        let costo = 0;
        if (item.codice === 'PANNELLO-FIANCO') costo = quota(areaFianchi);
        else if (item.codice === 'PANNELLO-BASE' || item.codice === 'PANNELLO-CIELO') costo = quota(w * d);
        else if (item.codice === 'RIPIANO') costo = quota(areaRipiani);
        else if (item.categoria === 'FRONTALE') costo = quota(areaFronte * (item.quantita / Math.max(quantitaFrontali, 1)));
        else if (item.codice === 'SCHIENALE') costo = riga.retro;
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
