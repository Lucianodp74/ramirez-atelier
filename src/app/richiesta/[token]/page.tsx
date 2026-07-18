import { notFound } from 'next/navigation';
import { recuperaStatoPerCliente } from '@/server/services/portale-cliente-service';

export const dynamic = 'force-dynamic';

export default async function StatoRichiestaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const stato = await recuperaStatoPerCliente(token);

  if (!stato) notFound();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {stato.tipoProgettoNome}
        </p>
        <h1 className="mt-1 text-xl font-semibold">
          {stato.clienteNome ? `Ciao ${stato.clienteNome}` : 'Il tuo progetto'}
        </h1>

        {!stato.inviata ? (
          <p className="mt-4 text-muted-foreground">{stato.messaggio}</p>
        ) : (
          <>
            <p className="mt-4 text-muted-foreground">{stato.messaggio}</p>

            {stato.fasciaPrezzoMin !== null && stato.fasciaPrezzoMax !== null && (
              <div className="mt-6 rounded-md bg-secondary/40 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Stima indicativa
                </p>
                <p className="mt-1 text-xl font-semibold text-accent">
                  {stato.fasciaPrezzoMin.toLocaleString('it-IT')} –{' '}
                  {stato.fasciaPrezzoMax.toLocaleString('it-IT')} €
                </p>
              </div>
            )}

            <p className="mt-6 text-xs text-muted-foreground">
              Richiesta ricevuta il {new Date(stato.creataIl).toLocaleDateString('it-IT')}
            </p>
          </>
        )}
      </div>

      <p className="max-w-sm text-xs text-muted-foreground">
        Questa pagina si aggiorna automaticamente: puoi salvare il link e tornare a controllare
        quando vuoi.
      </p>
    </main>
  );
}
