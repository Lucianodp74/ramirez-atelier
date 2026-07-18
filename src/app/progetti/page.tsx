import Link from 'next/link';
import { db } from '@/server/db';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic'; // sempre dati freschi: nuovi tipi progetto attivati dal titolare devono comparire subito

export default async function ProgettiPage() {
  const tipiProgetto = await db.tipoProgetto.findMany({
    where: { attivo: true },
    orderBy: { ordinamento: 'asc' },
  });

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Che progetto hai in mente?</h1>
        <p className="mt-3 text-muted-foreground">
          Scegli il punto di partenza più vicino alla tua idea — ti guideremo passo dopo passo.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
        {tipiProgetto.map((tipo) => (
          <Link key={tipo.id} href={`/progetti/${tipo.chiave}`}>
            <Card className="h-full transition-colors hover:border-accent">
              <CardContent className="pt-6">
                <h3 className="mb-2 text-lg font-medium">{tipo.nome}</h3>
                {tipo.descrizione && (
                  <p className="text-sm text-muted-foreground">{tipo.descrizione}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {tipiProgetto.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">
          Nessun tipo di progetto disponibile al momento.
        </p>
      )}
    </main>
  );
}
