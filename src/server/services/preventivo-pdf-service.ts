import { db } from '@/server/db';
import { ultimoPreventivoBom } from '@/server/services/bom-preventivo-service';

/** Assegna il numero di preventivo una sola volta per richiesta. */
export async function assegnaNumeroPreventivo(
  tenantId: string,
  richiestaId: string,
): Promise<{ numeroPreventivo: string; preventivoGeneratoIl: Date }> {
  const esistente = await db.richiestaProgetto.findUnique({
    where: { id: richiestaId },
    select: { tenantId: true, numeroPreventivo: true, preventivoGeneratoIl: true },
  });
  if (!esistente || esistente.tenantId !== tenantId) throw new Error('Richiesta non trovata.');
  if (esistente.numeroPreventivo && esistente.preventivoGeneratoIl) {
    return { numeroPreventivo: esistente.numeroPreventivo, preventivoGeneratoIl: esistente.preventivoGeneratoIl };
  }
  const anno = new Date().getFullYear();
  const prefisso = `${anno}-`;
  const conteggio = await db.richiestaProgetto.count({ where: { tenantId, numeroPreventivo: { startsWith: prefisso } } });
  const numeroPreventivo = `${prefisso}${String(conteggio + 1).padStart(3, '0')}`;
  const preventivoGeneratoIl = new Date();
  await db.richiestaProgetto.update({ where: { id: richiestaId }, data: { numeroPreventivo, preventivoGeneratoIl } });
  return { numeroPreventivo, preventivoGeneratoIl };
}

function risolviEtichettaDaConfigurazione(configurazione: unknown, chiave: string, valore: string | undefined): string | null {
  if (!valore) return null;
  if (!configurazione || typeof configurazione !== 'object') return valore;
  const step = (configurazione as { step?: unknown[] }).step;
  if (!Array.isArray(step)) return valore;
  for (const s of step) {
    const campi = (s as { campi?: unknown[] })?.campi;
    if (!Array.isArray(campi)) continue;
    for (const campo of campi) {
      const c = campo as { chiave?: string; opzioni?: { valore: string; etichetta: string }[] };
      if (c.chiave === chiave && Array.isArray(c.opzioni)) {
        const trovata = c.opzioni.find((o) => o.valore === valore);
        if (trovata) return trovata.etichetta;
      }
    }
  }
  return valore;
}

export interface DatiPreventivoPdf {
  numeroPreventivo: string;
  dataEmissione: Date;
  atelier: { nome: string; indirizzo: string | null; partitaIva: string | null; telefono: string | null; emailPubblica: string | null };
  cliente: { nome: string; email: string | null; telefono: string | null; azienda: string | null };
  tipoProgettoNome: string;
  materiale: string | null;
  stile: string | null;
  ferramenta: string | null;
  larghezzaCm: string | null;
  profonditaCm: string | null;
  messaggioLibero: string | null;
  fasciaPrezzoMin: number | null;
  fasciaPrezzoMax: number | null;
  /** Ultimo snapshot commerciale salvato dalla BOM, mai ricalcolato durante la stampa. */
  preventivoCommerciale: {
    costoProduzione: number;
    costiAggiuntivi: number;
    ricaricoPercentuale: number;
    sconto: number;
    imponibile: number;
    iva: number;
    ivaPercentuale: number;
    totale: number;
  } | null;
  giorniValidita: number;
}

const GIORNI_VALIDITA_DEFAULT = 30;

export async function datiPreventivoPdf(tenantId: string, richiestaId: string): Promise<DatiPreventivoPdf> {
  const richiesta = await db.richiestaProgetto.findUnique({ where: { id: richiestaId }, include: { tipoProgetto: true, fasciaBudget: true } });
  if (!richiesta || richiesta.tenantId !== tenantId) throw new Error('Richiesta non trovata.');
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('Tenant non trovato.');

  const { numeroPreventivo, preventivoGeneratoIl } = await assegnaNumeroPreventivo(tenantId, richiestaId);
  const form = (richiesta.datiFormJson ?? {}) as Record<string, string | undefined>;
  const finitura = form.materiale ? await db.finitura.findFirst({ where: { tenantId, slug: form.materiale } }) : null;
  const ferramenta = form.ferramenta ? await db.ferramenta.findFirst({ where: { tenantId, slug: form.ferramenta } }) : null;
  const stile = risolviEtichettaDaConfigurazione(richiesta.tipoProgetto.configurazione, 'stile', form.stile);

  // Il PDF mostra il fatto economico già salvato: nessun ricalcolo alla stampa.
  const preventivoSalvato = await recuperaPreventivoCommerciale(tenantId, richiestaId);
  const prezzo = preventivoSalvato?.prezzo ?? null;

  return {
    numeroPreventivo,
    dataEmissione: preventivoGeneratoIl,
    atelier: { nome: tenant.nome, indirizzo: tenant.indirizzo, partitaIva: tenant.partitaIva, telefono: tenant.telefono, emailPubblica: tenant.emailPubblica },
    cliente: { nome: richiesta.clienteNome ?? 'Cliente', email: richiesta.clienteEmail, telefono: richiesta.clienteTelefono, azienda: richiesta.clienteAzienda },
    tipoProgettoNome: richiesta.tipoProgetto.nome,
    materiale: finitura?.nome ?? null,
    stile,
    ferramenta: ferramenta?.nome ?? null,
    larghezzaCm: form.larghezzaCm ?? null,
    profonditaCm: form.profonditaCm ?? null,
    messaggioLibero: richiesta.messaggioLibero,
    fasciaPrezzoMin: richiesta.fasciaPrezzoMin ? Number(richiesta.fasciaPrezzoMin) : null,
    fasciaPrezzoMax: richiesta.fasciaPrezzoMax ? Number(richiesta.fasciaPrezzoMax) : null,
    preventivoCommerciale: prezzo ? {
      costoProduzione: prezzo.costoProduzione,
      costiAggiuntivi: prezzo.costiAggiuntivi,
      ricaricoPercentuale: prezzo.ricaricoPercentuale,
      sconto: prezzo.sconto,
      imponibile: prezzo.imponibile,
      iva: prezzo.iva,
      ivaPercentuale: prezzo.ivaPercentuale,
      totale: prezzo.totale,
    } : null,
    giorniValidita: GIORNI_VALIDITA_DEFAULT,
  };
}

async function recuperaPreventivoCommerciale(tenantId: string, richiestaId: string) {
  const bom = await db.bom.findFirst({ where: { tenantId, richiestaId }, orderBy: { versione: 'desc' }, select: { id: true } });
  if (!bom) return null;
  return ultimoPreventivoBom(tenantId, bom.id);
}
