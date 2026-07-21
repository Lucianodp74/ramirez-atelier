import { elencoUtentiTenant } from '@/app/admin/azioni';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormInvitaUtente } from '@/components/admin/FormInvitaUtente';
import { AzioniMembership } from '@/components/admin/AzioniMembership';
import { AzioneRevocaInvito } from '@/components/admin/AzioneRevocaInvito';

export const dynamic = 'force-dynamic';

const ETICHETTA_STATO_INVITO: Record<string, string> = {
  CREATO: 'In attesa',
  ACCETTATO: 'Accettato',
  SCADUTO: 'Scaduto',
  REVOCATO: 'Revocato',
};

export default async function UtentiPage() {
  const { membership, inviti, ruoli } = await elencoUtentiTenant();
  const nomiRuoli = ruoli.map((r) => r.nome);
  const invitiPendenti = inviti.filter((i) => i.stato === 'CREATO');

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Utenti e accessi</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Ogni persona è un&apos;identità unica (login, password) che può collaborare con più aziende
        — qui vedi solo la relazione (Membership) con questa azienda. Invitare qualcuno che ha già
        un account su un&apos;altra azienda gli aggiunge semplicemente l&apos;accesso qui, senza
        duplicare le credenziali.
      </p>

      <div className="mb-10">
        <h2 className="mb-3 text-lg font-medium">Invita una nuova persona</h2>
        <FormInvitaUtente nomiRuoli={nomiRuoli} />
      </div>

      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Persone con accesso</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-normal">Nome</th>
                <th className="px-4 py-3 font-normal">Email</th>
                <th className="px-4 py-3 font-normal">Ruolo</th>
                <th className="px-4 py-3 font-normal">Stato</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {membership.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-4 py-3">{m.utente?.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.utente?.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.ruoli?.map((r) => r.ruolo?.nome).join(', ')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={m.stato === 'ATTIVA' ? 'accent' : 'outline'}>{m.stato}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <AzioniMembership membershipId={m.id} stato={m.stato} />
                  </td>
                </tr>
              ))}
              {membership.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nessun utente ancora.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {invitiPendenti.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inviti in attesa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitiPendenti.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{i.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Ruolo: {i.ruoloIniziale} · {ETICHETTA_STATO_INVITO[i.stato] ?? i.stato} · scade
                    il {new Date(i.scadeIl).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <AzioneRevocaInvito invitoId={i.id} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
