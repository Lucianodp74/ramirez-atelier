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
      const w = modulo.larghezzaCm / 100;
      const h = modulo.altezzaCm / 100;
      const d = modulo.profonditaCm / 100;
      const areaFianchi = 2 * h * d;
      const areaBaseCielo = 2 * w * d;
      const areaFronte = w * h;
      const areaRipiani = (riga.distinta.ripiani * w * d);
      const areaTotale = areaFianchi + areaBaseCielo + areaFronte + areaRipiani;
      const quota = (area: number) => riga.materiale * (area / Math.max(areaTotale, 0.0001));
      const descrizione = `${modulo.tipo} ${modulo.larghezzaCm}×${modulo.altezzaCm}×${modulo.profonditaCm} cm · ${modulo.materiale} · ${modulo.finitura}`;
      const righe = [
        { categoria: 'STRUTTURA', codice: 'PANNELLO-FIANCO', voce: 'Fianchi struttura', unita: 'PZ', quantita: 2, costo: quota(areaFianchi) },
        { categoria: 'STRUTTURA', codice: 'PANNELLO-BASE', voce: 'Base', unita: 'PZ', quantita: 1, costo: quota(w * d) },
        { categoria: 'STRUTTURA', codice: 'PANNELLO-CIELO', voce: 'Cielo', unita: 'PZ', quantita: 1, costo: quota(w * d) },
        { categoria: 'STRUTTURA', codice: 'RIPIANO', voce: 'Ripiani', unita: 'PZ', quantita: riga.distinta.ripiani, costo: quota(areaRipiani) },
        { categoria: 'FRONTALE', codice: 'ANTA', voce: 'Ante / frontale', unita: 'PZ', quantita: Math.max(riga.distinta.ante, 1), costo: quota(areaFronte) },
        { categoria: 'STRUTTURA', codice: 'SCHIENALE', voce: 'Schienale', unita: 'M2', quantita: 1, costo: riga.retro },
        { categoria: 'BORDO', codice: 'BORDO-ML', voce: 'Bordatura', unita: 'ML', quantita: riga.distinta.bordaturaMl, costo: riga.bordo },
        { categoria: 'FERRAMENTA', codice: 'FER-HARDWARE', voce: 'Ferramenta', unita: 'PZ', quantita: riga.distinta.ferramentaPz, costo: riga.ferramenta },
        { categoria: 'MANODOPERA', codice: 'MAN-ORE', voce: 'Lavorazione e assemblaggio', unita: 'H', quantita: riga.distinta.ore, costo: riga.manodopera },
      ];
      for (const [posizione, item] of righe.entries()) {
        if (item.quantita <= 0 || item.costo <= 0) continue;
        await tx.$executeRaw`INSERT INTO "bom_riga" ("id", "bomId", "ordinamento", "categoria", "codice", "descrizione", "unita", "quantita", "materiale", "lavorazione", "costoUnitario", "note", "createdAt", "updatedAt") VALUES (${crypto.randomUUID()}, ${bomId}, ${indice * 100 + posizione}, ${item.categoria}, ${item.codice}, ${`${item.voce} · ${descrizione}`}, ${item.unita}, ${item.quantita}, ${modulo.materiale}, ${modulo.finitura}, ${item.costo / item.quantita}, 'Snapshot parametrico: verificare dimensioni esecutive prima della produzione', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
      }
    }

    await tx.eventoAttivita.create({ data: { richiestaId: richiesta.id, tipo: 'RICHIESTA_CREATA', descrizione: 'Richiesta creata dal Preventivatore Modulare V2 con BOM tecnica/economica iniziale.', metadatiJson: { origine: 'preventivatore-modulare-v2', tipoProgetto: tipoProgetto.chiave, bomId, prezzoIndicativo: preventivo.prezzoIndicativo }, attore: 'CLIENTE' } });
    return { richiesta, bomId };
  });

  return { successo: true as const, id: nuova.richiesta.id, tokenRipresa: nuova.richiesta.tokenRipresa, bomId: nuova.bomId, prezzoIndicativo: preventivo.prezzoIndicativo };
}
