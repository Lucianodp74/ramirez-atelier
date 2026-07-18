import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const punti = [
  {
    titolo: 'Un progetto, non un modulo',
    descrizione:
      'Ti guidiamo passo dopo passo, come in una consulenza reale — non davanti a un questionario da compilare.',
  },
  {
    titolo: 'Documenti, foto, schizzi',
    descrizione:
      'Carica tutto quello che hai già: planimetrie, riferimenti, ispirazioni. Organizziamo tutto per te.',
  },
  {
    titolo: 'Una prima stima, subito',
    descrizione:
      'Ricevi una fascia di prezzo indicativa in pochi minuti, prima ancora di parlare con noi.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">Ramirez Atelier</span>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/progetti">Accedi all&apos;area riservata</Link>
        </Button>
      </nav>

      <section className="mx-auto max-w-4xl px-6 pt-20 pb-28 text-center">
        <p className="mb-6 inline-block rounded-full border border-border px-4 py-1 text-xs uppercase tracking-widest text-muted-foreground">
          Falegnameria artigiana — arredi su misura
        </p>
        <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
          Il tuo prossimo progetto
          <br />
          merita più di un preventivo via email.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          Racconta il tuo spazio, il tuo stile, le tue idee — anche solo abbozzate. Trasformiamo
          tutto in un progetto concreto, con una prima stima già in pochi minuti.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg" variant="accent" asChild>
            <Link href="/progetti">Inizia il tuo progetto</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="grid gap-6 sm:grid-cols-3">
          {punti.map((punto) => (
            <Card key={punto.titolo} className="bg-secondary/40">
              <CardContent className="pt-6">
                <h3 className="mb-2 font-medium">{punto.titolo}</h3>
                <p className="text-sm text-muted-foreground">{punto.descrizione}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">
        Ramirez Atelier — Laboratorio artigiano dal 1987
      </footer>
    </main>
  );
}
