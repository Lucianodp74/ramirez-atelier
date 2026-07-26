import { db } from '@/server/db';

/**
 * Assegna il numero di preventivo, una sola volta per richiesta - se già
 * presente, lo restituisce invariato (mai riassegnato, coerente con
 * docs/principi/livelli-di-verita-del-dato.md: una volta osservato, non si
 * ricalcola). Formato: "{anno}-{progressivo a 3 cifre}", es. "2026-003".
 *
 * Limite noto, dichiarato esplicitamente (V1, non bloccante): il conteggio
 * "quanti preventivi ha già questo tenant" e la scrittura del nuovo numero
 * non sono atomici in una singola transazione di database - con un solo
 * titolare che genera un PDF alla volta, il rischio di due numeri uguali è
 * trascurabile. Da rivedere con una vera sequenza a livello di database se e
 * quando più persone genereranno preventivi in parallelo per lo stesso
 * tenant (oggi non è il caso).
 */
export async function assegnaNumeroPreventivo(
  tenantId: string,
  richiestaId: string,
): Promise<{ numeroPreventivo: string; preventivoGeneratoIl: Date }> {
  const esistente = await db.richiestaProgetto.findUnique({
    where: { id: richiestaId },
    select: { tenantId: true, numeroPreventivo: true, preventivoGeneratoIl: true },
  });
  if (!esistente || esistente.tenantId !== tenantId) {
    throw new Error('Richiesta non trovata.');
  }
  if (esistente.numeroPreventivo && esistente.preventivoGeneratoIl) {
    return {
      numeroPreventivo: esistente.numeroPreventivo,
      preventivoGeneratoIl: esistente.preventivoGeneratoIl,
    };
  }

  const anno = new Date().getFullYear();
  const prefisso = `${anno}-`;
  const conteggio = await db.richiestaProgetto.count({
    where: { tenantId, numeroPreventivo: { startsWith: prefisso } },
  });
  const numeroPreventivo = `${prefisso}${String(conteggio + 1).padStart(3, '0')}`;
  const preventivoGeneratoIl = new Date();

  await db.richiestaProgetto.update({
    where: { id: richiestaId },
    data: { numeroPreventivo, preventivoGeneratoIl },
  });

  return { numeroPreventivo, preventivoGeneratoIl };
}

/** Risolve il valore di un campo a scelta (es. "stile") nell'etichetta
 * leggibile definita nella configurazione del tipo di progetto - per i
 * campi con opzioni incorporate direttamente (non quelli sourced dal
 * catalogo, v. risolviMateriale/risolviFerramenta sotto). */
function risolviEtichettaDaConfigurazione(
  configurazione: unknown,
  chiave: string,
  valore: string | undefined,
): string | null {
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
  atelier: {
    nome: string;
    indirizzo: string | null;
    partitaIva: string | null;
    telefono: string | null;
    emailPubblica: string | null;
  };
  cliente: {
    nome: string;
    email: string | null;
    telefono: string | null;
    azienda: string | null;
  };
  tipoProgettoNome: string;
  materiale: string | null;
  stile: string | null;
  ferramenta: string | null;
  larghezzaCm: string | null;
  profonditaCm: string | null;
  messaggioLibero: string | null;
  fasciaPrezzoMin: number | null;
  fasciaPrezzoMax: number | null;
  giorniValidita: number;
}

const GIORNI_VALIDITA_DEFAULT = 30;

export async function datiPreventivoPdf(
  tenantId: string,
  richiestaId: string,
): Promise<DatiPreventivoPdf> {
  const richiesta = await db.richiestaProgetto.findUnique({
    where: { id: richiestaId },
    include: { tipoProgetto: true, fasciaBudget: true },
  });
  if (!richiesta || richiesta.tenantId !== tenantId) {
    throw new Error('Richiesta non trovata.');
  }

  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('Tenant non trovato.');

  const { numeroPreventivo, preventivoGeneratoIl } = await assegnaNumeroPreventivo(
    tenantId,
    richiestaId,
  );

  const form = (richiesta.datiFormJson ?? {}) as Record<string, string | undefined>;

  const materialeSlug = form.materiale;
  const finitura = materialeSlug
    ? await db.finitura.findFirst({ where: { tenantId, slug: materialeSlug } })
    : null;

  const ferramentaSlug = form.ferramenta;
  const ferramenta = ferramentaSlug
    ? await db.ferramenta.findFirst({ where: { tenantId, slug: ferramentaSlug } })
    : null;

  const stile = risolviEtichettaDaConfigurazione(
    richiesta.tipoProgetto.configurazione,
    'stile',
    form.stile,
  );

  return {
    numeroPreventivo,
    dataEmissione: preventivoGeneratoIl,
    atelier: {
      nome: tenant.nome,
      indirizzo: tenant.indirizzo,
      partitaIva: tenant.partitaIva,
      telefono: tenant.telefono,
      emailPubblica: tenant.emailPubblica,
    },
    cliente: {
      nome: richiesta.clienteNome ?? 'Cliente',
      email: richiesta.clienteEmail,
      telefono: richiesta.clienteTelefono,
      azienda: richiesta.clienteAzienda,
    },
    tipoProgettoNome: richiesta.tipoProgetto.nome,
    materiale: finitura?.nome ?? null,
    stile,
    ferramenta: ferramenta?.nome ?? null,
    larghezzaCm: form.larghezzaCm ?? null,
    profonditaCm: form.profonditaCm ?? null,
    messaggioLibero: richiesta.messaggioLibero,
    fasciaPrezzoMin: richiesta.fasciaPrezzoMin ? Number(richiesta.fasciaPrezzoMin) : null,
    fasciaPrezzoMax: richiesta.fasciaPrezzoMax ? Number(richiesta.fasciaPrezzoMax) : null,
    giorniValidita: GIORNI_VALIDITA_DEFAULT,
  };
}
