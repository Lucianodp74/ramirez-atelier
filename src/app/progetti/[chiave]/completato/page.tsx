import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { recuperaRiepilogo } from '../azioni';

export default async function CompletatoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) notFound();

  let richiesta;
  try {
    richiesta = await recuperaRiepilogo(id);
    if (!richiesta.tipoProgetto) throw new Error('Tipo di progetto non caricato.');
  } catch {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <div className="rounded-full bg-accent/10 p-4">
        <svg
          className="h-8 w-8 text-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">Grazie, {richiesta.clienteNome}.</h1>
      <p className="max-w-md text-muted-foreground">
        Abbiamo ricevuto il tuo progetto per <strong>{richiesta.tipoProgetto.nome}</strong>. Lo
        stiamo già guardando: ti ricontatteremo a {richiesta.clienteEmail} entro 48 ore con una
        prima proposta.
      </p>
      {richiesta.fasciaPrezzoMin !== null && richiesta.fasciaPrezzoMax !== null && (
        <div className="rounded-lg border border-border bg-card px-6 py-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Prima stima indicativa
          </p>
          <p className="mt-1 text-2xl font-semibold text-accent">
            {Number(richiesta.fasciaPrezzoMin).toLocaleString('it-IT')} –{' '}
            {Number(richiesta.fasciaPrezzoMax).toLocaleString('it-IT')} €
          </p>
          <p className="mt-2 max-w-xs text-xs text-muted-foreground">
            Non è un preventivo definitivo: la cifra reale dipenderà dal progetto che definiremo
            insieme.
          </p>
        </div>
      )}
      <div className="max-w-sm rounded-lg border border-dashed border-border px-6 py-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Vuoi controllare a che punto siamo?
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Salva questo link: potrai consultare lo stato del tuo progetto quando vuoi, senza bisogno
          di accedere a un account.
        </p>
        <a
          href={`/richiesta/${richiesta.tokenRipresa}`}
          className="mt-2 inline-block break-all text-sm text-accent underline"
        >
          {`ramirezatelier.it/richiesta/${richiesta.tokenRipresa}`}
        </a>
      </div>
      <Button variant="outline" asChild>
        <Link href="/">Torna alla home</Link>
      </Button>
    </main>
  );
}
