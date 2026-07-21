import Link from 'next/link';
import { notFound } from 'next/navigation';
import { richiediContesto } from '@/server/identity/contesto';
import { dettaglioCliente } from '@/server/services/cliente-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatoBadge } from '@/components/admin/StatoBadge';
import { TimelineEventi } from '@/components/admin/TimelineEventi';
import { NoteCliente } from '@/components/admin/NoteCliente';

export const dynamic = 'force-dynamic';

const ETICHETTA_TIPO: Record<string, string> = {
  PRIVATO: 'Privato',
  ARCHITETTO: 'Architetto',
  IMPRESA: 'Impresa',
  STUDIO_TECNICO: 'Studio tecnico',
};

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const contesto = await richiediContesto({ modulo: 'clienti', azione: 'leggi' });
  const { id } = await params;

  const dati = await dettaglioCliente(contesto.tenantId, id);
  if (!dati) notFound();
  const { cliente, richieste, eventi, ultimoContatto } = dati;

  const mappaTipoProgetto = new Map(richieste.map((r) => [r.id, r.tipoProgetto?.nome ?? '']));

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/admin/clienti" className="text-sm text-muted-foreground hover:underline">
        ← Clienti
      </Link>

      <div className="mb-8 mt-2 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{cliente.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {[cliente.email, cliente.telefono].filter(Boolean).join(' · ') ||
              'Nessun contatto registrato'}
            {' · '}
            {ETICHETTA_TIPO[cliente.tipo] ?? cliente.tipo}
            {cliente.azienda && ` · ${cliente.azienda}`}
          </p>
        </div>
        {ultimoContatto && (
          <p className="text-xs text-muted-foreground">
            Ultimo contatto: {new Date(ultimoContatto).toLocaleDateString('it-IT')}
          </p>
        )}
      </div>

      <div className="mb-8">
        <NoteCliente clienteId={cliente.id} noteIniziali={cliente.note ?? ''} />
      </div>

      <h2 className="mb-3 text-lg font-medium">Richieste</h2>
      <div className="mb-10 grid gap-3 sm:grid-cols-2">
        {richieste.map((r) => (
          <Link key={r.id} href={`/admin/richieste/${r.id}`}>
            <Card className="h-full transition-colors hover:border-accent">
              <CardContent className="space-y-1 pt-6">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.tipoProgetto?.nome}</span>
                  <StatoBadge stato={r.stato} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString('it-IT')}
                  {r.fasciaPrezzoMin !== null &&
                    r.fasciaPrezzoMax !== null &&
                    ` · ${r.fasciaPrezzoMin.toLocaleString('it-IT')}–${r.fasciaPrezzoMax.toLocaleString('it-IT')} €`}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {richieste.length === 0 && (
          <p className="text-sm text-muted-foreground">Nessuna richiesta ancora collegata.</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cronologia del rapporto</CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineEventi
            eventi={eventi}
            etichettaRichiesta={(rid) => mappaTipoProgetto.get(rid) ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
