'use server';

import { idTenantRamirezAtelier } from '@/server/identity/tenant-corrente';
import { db } from '@/server/db';
import { caricaTariffePreventivatore } from '@/server/services/preventivatore-listino-service';
import { calcolaPreventivoModulare } from '@/lib/preventivatore/prezzo-modulare';
import type { ModuloConfigurato } from '@/lib/preventivatore/moduli';

const CHIAVI_TIPO_PROGETTO_PREVENTIVATORE = ['falegnameria', 'falegnameria-su-misura', 'living', 'zona-giorno'];

function isModuloConfigurato(value: unknown): value is ModuloConfigurato {
  if (!value || typeof value !== 'object') return false;
  const modulo = value as Record<string, unknown>;
  return typeof modulo.id === 'string' && typeof modulo.tipo === 'string' && typeof modulo.materiale === 'string' && typeof modulo.finitura === 'string' && typeof modulo.configurazione === 'string' && typeof modulo.larghezzaCm === 'number' && typeof modulo.altezzaCm === 'number' && typeof modulo.profonditaCm === 'number' && Number.isFinite(modulo.larghezzaCm) && Number.isFinite(modulo.altezzaCm) && Number.isFinite(modulo.profonditaCm) && (modulo.ripiani === undefined || typeof modulo.ripiani === 'number');
}

function validaInputModuli(moduli: unknown): asserts moduli is ModuloConfigurato[] {
  if (!Array.isArray(moduli) || moduli.length === 0 || !moduli.every(isModuloConfigurato)) throw new Error('Configurazione preventivatore non valida.');
}

async function caricaTipoProgettoPreventivatore(tenantId: string) {
  const tipi = await db.tipoProgetto.findMany({ where: { tenantId, attivo: true, chiave: { in: CHIAVI_TIPO_PROGETTO_PREVENTIVATORE } }, orderBy: { ordinamento: 'asc' } });
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
  if (!nome || nome.length < 2) throw new Error('Inserisci nome e cognome.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Inserisci un indirizzo email valido.');

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
      const descrizione = `${modulo.tipo} ${modulo.larghezzaCm}×${modulo.altezzaCm}×${modulo.profonditaCm} cm · ${modulo.materiale} · ${modulo.finitura}`;
      const righe = [
        ['STRUTTURA', 'PANNELLO-FIANCO', 'Fianchi struttura', 'PZ', riga.distinta.fianchi, riga.materiale / Math.max(riga.superficieM2, 0.0001) * (riga.superficieM2 * 0.45)],
        ['STRUTTURA', 'PANNELLO-BASE', 'Base', 'PZ', riga.distinta.base, riga.materiale / Math.max(riga.distinta.fianchi + riga.distinta.base + riga.distinta.cielo, 1)],
        ['STRUTTURA', 'PANNELLO-CIELO', 'Cielo', 'PZ', riga.distinta.cielo, riga.materiale / Math.max(riga.distinta.fianchi + riga.distinta.base + riga.distinta.cielo, 1)],
        ['STRUTTURA', 'SCHIENALE', 'Schienale', 'M2', riga.distinta.schienale, riga.retro],
        ['STRUTTURA', 'RIPIANO', 'Ripiani', 'PZ', riga.distinta.ripiani, riga.materiale * 0.10],
        ['FRONTALE', 'ANTA', 'Ante', 'PZ', riga.distinta.ante, riga.finitura * 0.15],
        ['FRONTALE', 'CASSETTO', 'Cassetti', 'PZ', riga.distinta.cassetti, riga.ferramenta * 0.25],
        ['BORDO', 'BORDO-ML', 'Bordatura', 'ML', riga.distinta.bordaturaMl, riga.bordo],
        ['FERRAMENTA', 'FER-HARDWARE', 'Ferramenta', 'PZ', riga.distinta.ferramentaPz, riga.ferramenta / Math.max(riga.distinta.ferramentaPz, 1)],
        ['MANODOPERA', 'MAN-ORE', 'Lavorazione e assemblaggio', 'H', riga.distinta.ore, riga.manodopera / Math.max(riga.distinta.ore, 0.0001)],
      ] as const;
      for (const [categoria, codice, voce, unita, quantita, costoTotale] of righe) {
        if (quantita <= 0 || costoTotale <= 0) continue;
        const costoUnitario = costoTotale / quantita;
        await tx.$executeRaw`INSERT INTO "bom_riga" ("id", "bomId", "ordinamento", "categoria", "codice", "descrizione", "unita", "quantita", "materiale", "lavorazione", "costoUnitario", "note", "createdAt", "updatedAt") VALUES (${crypto.randomUUID()}, ${bomId}, ${indice * 100 + righe.indexOf(righe.find((x) => x[1] === codice)!)}, ${categoria}, ${codice}, ${`${voce} · ${descrizione}`}, ${unita}, ${quantita}, ${modulo.materiale}, ${modulo.finitura}, ${costoUnitario}, 'Snapshot generato dal Preventivatore Modulare', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
      }
    }

    await tx.eventoAttivita.create({ data: { richiestaId: richiesta.id, tipo: 'RICHIESTA_CREATA', descrizione: 'Richiesta creata dal Preventivatore Modulare V2 con BOM tecnica/economica iniziale.', metadatiJson: { origine: 'preventivatore-modulare-v2', tipoProgetto: tipoProgetto.chiave, bomId, prezzoIndicativo: preventivo.prezzoIndicativo }, attore: 'CLIENTE' } });
    return { richiesta, bomId };
  });

  return { successo: true as const, id: nuova.richiesta.id, tokenRipresa: nuova.richiesta.tokenRipresa, bomId: nuova.bomId, prezzoIndicativo: preventivo.prezzoIndicativo };
}
