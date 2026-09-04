import Link from 'next/link';
import { ArrowRight, Bath, ChefHat, DoorOpen, Layers3, Sofa, SquareStack } from 'lucide-react';
import { db } from '@/server/db';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const icone = [ChefHat, Layers3, SquareStack, Bath, Sofa, DoorOpen];

export default async function ProgettiPage() {
  const tipiProgetto = await db.tipoProgetto.findMany({
    where: { attivo: true },
    orderBy: { ordinamento: 'asc' },
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-10 sm:pb-20 sm:pt-14">
          <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            ← Ramirez Atelier
          </Link>
          <div className="mx-auto mt-12 max-w-3xl text-center">
            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Il primo passo
            </p>
            <h1 className="text-balance font-serif text-4xl font-light tracking-tight sm:text-6xl">
              Che cosa vuoi creare?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground">
              Scegli il progetto più vicino alla tua idea. Ti accompagneremo nella scelta di
              dimensioni, materiali e dettagli, senza complicazioni.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tipiProgetto.map((tipo, indice) => {
            const Icona = icone[indice % icone.length];
            return (
              <Link key={tipo.id} href={`/progetti/${tipo.chiave}`} className="group">
                <Card className="h-full overflow-hidden border-border transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-sm">
                  <CardContent className="flex h-full min-h-52 flex-col p-6 sm:p-7">
                    <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icona className="h-5 w-5" strokeWidth={1.6} />
                    </div>
                    <h2 className="font-serif text-2xl font-light tracking-tight">{tipo.nome}</h2>
                    {tipo.descrizione && (
                      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        {tipo.descrizione}
                      </p>
                    )}
                    <span className="mt-auto flex items-center gap-2 pt-8 text-sm font-medium">
                      Inizia a progettare
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {tipiProgetto.length === 0 && (
          <div className="mx-auto max-w-xl rounded-lg border border-dashed border-border p-10 text-center">
            <p className="font-medium">Stiamo preparando i nuovi progetti.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Torna presto: troverai qui le categorie disponibili per iniziare il tuo percorso.
            </p>
          </div>
        )}
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3 sm:py-14">
          <div>
            <p className="font-serif text-2xl font-light">01</p>
            <p className="mt-2 font-medium">Parti dalla tua idea</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Anche se non hai ancora tutto definito.
            </p>
          </div>
          <div>
            <p className="font-serif text-2xl font-light">02</p>
            <p className="mt-2 font-medium">Costruisci il progetto</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Il percorso salva automaticamente le tue scelte.
            </p>
          </div>
          <div>
            <p className="font-serif text-2xl font-light">03</p>
            <p className="mt-2 font-medium">Ricevi una prima stima</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Poi definiamo insieme ogni dettaglio in laboratorio.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
