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
  return (
    typeof modulo.id === 'string' && typeof modulo.tipo === 'string' &&
    typeof modulo.materiale === 'string' && typeof modulo.finitura === 'string' &&
    typeof modulo.configurazione === 'string' &&
    typeof modulo.larghezzaCm === 'number' && typeof modulo.altezzaCm === 'number' &&
    typeof modulo.profonditaCm === 'number' && Number.isFinite(modulo.larghezzaCm) &&
    Number.isFinite(modulo.altezzaCm) && Number.isFinite(modulo.profonditaCm) &&
    (modulo.ripiani === undefined || typeof modulo.ripiani === 'number')
  );
}

function validaInputModuli(moduli: unknown): asserts moduli is ModuloConfigurato[] {
  if (!Array.isArray(moduli) || moduli.length === 0 || !moduli.every(isModuloConfigurato)) {
    throw new Error('Configurazione preventivatore non valida.');
  }
}

async function caricaTipoProgettoPreventivatore(tenantId: string) {
  const tipi = await db.tipoProgetto.findMany({
    where: { tenantId, attivo: true, chiave: { in: CHIAVI_TIPO_PROGETTO_PREVENTIVATORE } },
    orderBy: { ordinamento: 'asc' },
  });
  const tipo = CHIAVI_TIPO_PROGETTO_PREVENTIVATORE.map((chiave) => tipi.find((item) => item.chiave === chiave)).find(Boolean);
  if (!tipo) throw new Error('Il tipo di progetto del preventivatore non è ancora configurato.');
  return tipo;
}

/** Punto unico di calcolo: il browser invia solo la configurazione; listino e ricarico restano server-side. */
export async function calcolaStimaPreventivatore(moduli: unknown) {
  validaInputModuli(moduli);
  const tenantId = await idTenantRamirezAtelier();
  const tariffe = await caricaTariffePreventivatore(tenantId);
  const preventivo = calcolaPreventivoModulare(moduli, tariffe);
  return { successo: true as const, preventivo };
}

export interface DatiRichiestaPreventivatore { nome: string; email: string; telefono?: string; messaggio?: string; }

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
    const richiesta = await tx.richiestaProgetto.create({
      data: {
        tenantId, tipoProgettoId: tipoProgetto.id, clienteNome: nome, clienteEmail: email,
        clienteTelefono: telefono, messaggioLibero: messaggio,
        datiFormJson: { origine: 'preventivatore-modulare-v2' },
        datiEstensione: { preventivatoreModulare: { versione: 2, moduli, stima: { prezzoIndicativo: preventivo.prezzoIndicativo, costoProduzione: preventivo.costoProduzione, calcolataIl: new Date().toISOString() } } },
        stato: 'NUOVA',
      },
    });
    await tx.eventoAttivita.create({
      data: { richiestaId: richiesta.id, tipo: 'RICHIESTA_CREATA', descrizione: 'Richiesta creata dal Preventivatore Modulare V2.', metadatiJson: { origine: 'preventivatore-modulare-v2', tipoProgetto: tipoProgetto.chiave }, attore: 'CLIENTE' },
    });
    return richiesta;
  });
  return { successo: true as const, id: nuova.id, tokenRipresa: nuova.tokenRipresa };
}
