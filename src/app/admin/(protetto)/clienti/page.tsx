import Link from 'next/link';
import { richiediContesto } from '@/server/identity/contesto';
import { elencoClienti } from '@/server/services/cliente-service';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const ETICHETTA_TIPO: Record<string, string> = {
  PRIVATO: 'Privato',
  ARCHITETTO: 'Architetto',
  IMPRESA: 'Impresa',
  STUDIO_TECNICO: 'Studio tecnico',
};

export default async function ClientiPage({
  searchParams,
}: {
  searchParams: Promise<{ ricerca?: string }>;
}) {
  const contesto = await richiediContesto({ modulo: 'clienti', azione: 'leggi' });
  const { ricerca } = await searchParams;
  const clienti = await elencoClienti(contesto.tenantId, { ricerca });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Clienti</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Un cliente compare qui la prima volta che invia una richiesta — non prima. Cerca per nome,
        email o telefono: utile soprattutto quando chiama e non si presenta subito.
      </p>

      <form className="mb-6">
        <input
          type="text"
          name="ricerca"
          defaultValue={ricerca}
          placeholder="Cerca per nome, email o telefono..."
          className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
        />
      </form>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-normal">Nome</th>
                <th className="px-4 py-3 font-normal">Contatti</th>
                <th className="px-4 py-3 font-normal">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {clienti.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link href={`/admin/clienti/${c.id}`} className="font-medium hover:underline">
                      {c.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.email && <div>{c.email}</div>}
                    {c.telefono && <div>{c.telefono}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ETICHETTA_TIPO[c.tipo] ?? c.tipo}
                  </td>
                </tr>
              ))}
              {clienti.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    {ricerca
                      ? `Nessun cliente trovato per "${ricerca}".`
                      : 'Ancora nessun cliente — compariranno qui alla prima richiesta inviata.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
