/**
 * Interfaccia comune tra l'adattatore console (sviluppo, nessuna dipendenza
 * esterna, verificabile senza credenziali reali) e un futuro adattatore per
 * il provider scelto in produzione (Resend, Postmark, SMTP diretto...).
 *
 * Deliberatamente minimale: non impegna oggi la forma esatta che avrà un
 * provider specifico (template HTML, allegati, tracking apertura...) - quella
 * decisione arriva con un ADR dedicato quando si sceglierà il provider reale
 * (v. DEPLOY-RUNBOOK.md, Fase 0), non indovinata qui (Premature Modeling).
 * Stesso principio già applicato a StorageAdapter.
 */
export interface InvioEmailAdapter {
  invia(params: { destinatario: string; oggetto: string; corpo: string }): Promise<void>;
}
