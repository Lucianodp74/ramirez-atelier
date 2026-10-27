'use server';

import { costiRigheBomIniziale } from '@/lib/preventivatore/bom-iniziale';
import { unstable_rethrow } from 'next/navigation';
import { idTenantRamirezAtelier } from '@/server/identity/tenant-corrente';
import { db } from '@/server/db';
import { generaTokenRipresa } from '@/lib/identity/token';
import { caricaTariffePreventivatore } from '@/server/services/preventivatore-listino-service';
import { calcolaPreventivoModulare } from '@/lib/preventivatore/prezzo-modulare';
import { validaInputModuli } from '@/lib/preventivatore/validazione-moduli';
import { risolviModelloOrigine } from '@/lib/catalogo-librerie/modello-origine';
import { anteprimaInternaConsentita } from '@/server/services/catalogo-librerie-accesso';

const CHIAVI_TIPO_PROGETTO_PREVENTIVATORE = [
  'falegnameria',
  'falegnameria-su-misura',
  'living',
  'zona-giorno',
] as const;

async function caricaTipoProgettoPreventivatore(tenantId: string) {
  const tipi = await db.tipoProgetto.findMany({
    where: { tenantId, attivo: true, chiave: { in: [...CHIAVI_TIPO_PROGETTO_PREVENTIVATORE] } },
    orderBy: { ordinamento: 'asc' },
  });
  const tipo = CHIAVI_TIPO_PROGETTO_PREVENTIVATORE.map((chiave) =>
    tipi.find((item: { chiave: string }) => item.chiave === chiave),
  ).find(Boolean);
  if (!tipo) throw new Error('Il tipo di progetto del preventivatore non è ancora configurato.');
  return tipo;
}

/**
 * Anteprima interna per la sola convalida del modello d'origine. Un errore
 * tecnico nella verifica della sessione non deve impedire la richiesta del
 * cliente: in quel caso valgono i privilegi pubblici (solo modelli approvati),
 * mai privilegi aggiuntivi. I segnali di controllo di Next.js vengono
 * comunque rilanciati.
 */
async function anteprimaInternaPerModelloOrigine(): Promise<boolean> {
  try {
    return await anteprimaInternaConsentita();
  } catch (errore) {
    unstable_rethrow(errore);
    return false;
  }
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

export interface DatiRichiestaPreventivatore {
  nome: string;
  email: string;
  telefono?: string;
  messaggio?: string;
}

export interface OpzioniRichiestaPreventivatore {
  /** Codice del modello di catalogo da cui il cliente è partito, se c'è. */
  codiceModelloOrigine?: string;
}

/** Salva richiesta, snapshot della configurazione e BOM tecnica/economica iniziale in un'unica transazione. */
export async function salvaRichiestaPreventivatore(
  moduli: unknown,
  dati: DatiRichiestaPreventivatore,
  opzioni: OpzioniRichiestaPreventivatore = {},
) {
  validaInputModuli(moduli);
  const nome = dati.nome?.trim();
  const email = dati.email?.trim().toLowerCase();
  const telefono = dati.telefono?.trim() || null;
  const messaggio = dati.messaggio?.trim() || null;
  if (!nome || nome.length < 2 || nome.length > 120) throw new Error('Inserisci nome e cognome.');
  if (!email || email.length > 180 || !/^\S+@\S+\.\S+$/.test(email))
    throw new Error('Inserisci un indirizzo email valido.');
  if (telefono && telefono.length > 40) throw new Error('Numero di telefono non valido.');
  if (messaggio && messaggio.length > 2000) throw new Error('Messaggio troppo lungo.');

  const tenantId = await idTenantRamirezAtelier();
  const tipoProgetto = await caricaTipoProgettoPreventivatore(tenantId);
  const tariffe = await caricaTariffePreventivatore(tenantId);
  const preventivo = calcolaPreventivoModulare(moduli, tariffe);
  if (preventivo.errori.length) throw new Error(preventivo.errori.join(' '));

  // Solo dato descrittivo, convalidato qui e mai letto dal calcolo: un codice
  // non valido non blocca la richiesta, viene semplicemente ignorato.
  const codiceModelloOrigine = opzioni?.codiceModelloOrigine;
  const modelloOrigine = codiceModelloOrigine
    ? risolviModelloOrigine(codiceModelloOrigine, moduli, {
        anteprimaInterna: await anteprimaInternaPerModelloOrigine(),
      })
    : null;

  // BOM iniziale calcolata prima di scrivere qualunque dato: se non può essere
  // coerente con il costo di produzione, la richiesta non viene salvata affatto.
  const costiBom = preventivo.righe.map((riga) => costiRigheBomIniziale(riga));

  const nuova = await db.$transaction(async (tx) => {
    const richiesta = await tx.richiestaProgetto.create({
      data: {
        tenantId,
        tipoProgettoId: tipoProgetto.id,
        tokenRipresa: generaTokenRipresa(),
        clienteNome: nome,
        clienteEmail: email,
        clienteTelefono: telefono,
        messaggioLibero: messaggio,
        datiFormJson: { origine: 'preventivatore-modulare-v2' },
        datiEstensione: {
          preventivatoreModulare: {
            versione: 2,
            moduli,
            ...(modelloOrigine ? { modelloOrigine: { ...modelloOrigine } } : {}),
            stima: {
              prezzoIndicativo: preventivo.prezzoIndicativo,
              prezzoFalegname: preventivo.prezzoFalegname,
              costoProduzione: preventivo.costoProduzione,
              calcolataIl: new Date().toISOString(),
            },
          },
        },
        fasciaPrezzoMin: preventivo.prezzoIndicativo,
        fasciaPrezzoMax: preventivo.prezzoIndicativo,
        indiceCompletezza: 100,
        stato: 'NUOVA',
      },
    });

    const bomId = crypto.randomUUID();
    await tx.$executeRaw`INSERT INTO "bom" ("id", "tenantId", "richiestaId", "stato", "versione", "noteProduzione", "createdAt", "updatedAt") VALUES (${bomId}, ${tenantId}, ${richiesta.id}, 'BOZZA', 1, 'Generata dal Preventivatore Modulare V2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;

    for (const [indice, riga] of preventivo.righe.entries()) {
      const modulo = moduli.find((m) => m.id === riga.id);
      if (!modulo) continue;
      const descrizione = `${modulo.tipo} ${modulo.larghezzaCm}×${modulo.altezzaCm}×${modulo.profonditaCm} cm · ${modulo.materiale} · ${modulo.finitura}`;
      // Importi del motore ripartiti sui componenti: nessun prezzo ricalcolato qui.
      const costi = new Map(costiBom[indice].map((costo) => [costo.codice, costo]));

      const righe = riga.distinta.componenti.map((item) => {
        const costo = costi.get(item.codice);
        const dimensioni =
          item.larghezzaCm !== undefined && item.altezzaCm !== undefined
            ? ` · ${item.larghezzaCm}×${item.altezzaCm}${item.profonditaCm ? `×${item.profonditaCm}` : ''} cm`
            : '';
        const note = item.note ? `${item.note} ` : '';
        const sistemaScorrevoleArmadio =
          item.codice === 'FER-HARDWARE' && modulo.configurazione === 'ANTE_SCORREVOLI';
        const voceBom = sistemaScorrevoleArmadio
          ? 'Sistema ante scorrevoli (totale armadio)'
          : item.voce;
        const notaScorrevole =
          sistemaScorrevoleArmadio && costo !== undefined
            ? 'Importo complessivo del sistema scorrevole applicato una sola volta all’intero armadio; non moltiplicare per modulo o anta. '
            : '';
        return {
          categoria: item.categoria,
          codice: item.codice,
          voce: voceBom,
          unita: item.unita,
          quantita: costo?.quantita ?? 0,
          costoUnitario: costo?.costoUnitario ?? 0,
          descrizione: `${voceBom}${dimensioni} · ${descrizione}`,
          note: `${notaScorrevole}${note}Snapshot parametrico: verificare dimensioni esecutive prima della produzione`.trim(),
        };
      });

      for (const [posizione, item] of righe.entries()) {
        if (item.quantita <= 0 || item.costoUnitario <= 0) continue;
        const materialeRiga =
          item.codice === 'SCHIENALE'
            ? 'MDF'
            : item.categoria === 'FRONTALE'
              ? (modulo.materialeAnte ?? modulo.materiale)
              : modulo.materiale;
        const finituraRiga =
          item.categoria === 'FRONTALE'
            ? (modulo.finituraAnte ?? modulo.finitura)
            : item.categoria === 'STRUTTURA'
              ? (modulo.finituraStruttura ?? modulo.finitura)
              : modulo.finitura;
        await tx.$executeRaw`INSERT INTO "bom_riga" ("id", "bomId", "ordinamento", "categoria", "codice", "descrizione", "unita", "quantita", "materiale", "lavorazione", "costoUnitario", "note", "createdAt", "updatedAt") VALUES (${crypto.randomUUID()}, ${bomId}, ${indice * 100 + posizione}, ${item.categoria}, ${item.codice}, ${item.descrizione}, ${item.unita}, ${item.quantita}, ${materialeRiga}, ${finituraRiga}, ${item.costoUnitario}, ${item.note}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
      }
    }

    await tx.eventoAttivita.create({
      data: {
        richiestaId: richiesta.id,
        tipo: 'RICHIESTA_CREATA',
        descrizione:
          'Richiesta creata dal Preventivatore Modulare V2 con BOM tecnica/economica iniziale.',
        metadatiJson: {
          origine: 'preventivatore-modulare-v2',
          tipoProgetto: tipoProgetto.chiave,
          bomId,
          prezzoIndicativo: preventivo.prezzoIndicativo,
        },
        attore: 'CLIENTE',
      },
    });
    return { richiesta, bomId };
  });

  return {
    successo: true as const,
    id: nuova.richiesta.id,
    bomId: nuova.bomId,
    prezzoIndicativo: preventivo.prezzoIndicativo,
  };
}
