import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const fasi = [
  {
    numero: '01',
    titolo: 'Racconta il tuo spazio',
    descrizione:
      'Materiali, dimensioni indicative, ispirazioni — anche solo abbozzate. Nessun modulo da compilare, una conversazione da iniziare.',
  },
  {
    numero: '02',
    titolo: 'Ricevi una prima stima',
    descrizione:
      'In pochi minuti, non giorni: una fascia di prezzo indicativa, onesta fin dall’inizio, prima ancora di parlare con noi.',
  },
  {
    numero: '03',
    titolo: 'Incontriamoci di persona',
    descrizione:
      'Un sopralluogo, i dettagli definiti insieme, e il tuo progetto prende la forma esatta che avevi immaginato.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <span className="flex items-center gap-2.5">
          <Image src="/logo-monogramma.png" alt="Ramirez Atelier" width={30} height={22} priority />
          <span className="font-serif text-lg tracking-tight">Ramirez Atelier</span>
        </span>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/progetti">Accedi all&apos;area riservata</Link>
        </Button>
      </nav>

      {/* Hero - foto delle venature in trasparenza, velo dello sfondo sopra
          per garantire la leggibilità del testo (Unsplash, licenza gratuita
          per uso commerciale). */}
      <section className="relative overflow-hidden">
        <Image
          src="/foto-venature-legno.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-[0.16]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-5xl px-6 pb-24 pt-16 text-center sm:pb-32 sm:pt-24">
          <p className="mb-8 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Falegnameria artigiana — dal 1987
          </p>
          <h1 className="text-balance font-serif text-[2.75rem] font-light leading-[1.1] tracking-tight sm:text-7xl">
            La tua casa,
            <br />
            disegnata a mano,
            <br />
            <span className="italic text-primary">costruita per durare.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
            Raccontaci il tuo spazio. Un maestro d&apos;ascia trasforma l&apos;idea in progetto, il
            progetto in una stima chiara — in pochi minuti, non in settimane.
          </p>
          <div className="mt-12">
            <Button size="lg" variant="accent" asChild>
              <Link href="/progetti">Inizia il tuo progetto</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* La Materia - una sola foto illustrativa (generata, non un catalogo
          specifico) che comunica varietà, non un elenco di campioni reali
          spacciati per fotografia - i campioni veri, quelli che contano
          davvero, restano nel configuratore dove hanno un ruolo funzionale. */}
      <section className="border-y border-border bg-card py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="overflow-hidden rounded-lg">
              <Image
                src="/foto-finiture.jpg"
                alt="Ventaglio di finiture e materiali disponibili - legni, laccati, pietre"
                width={1536}
                height={1024}
                className="h-auto w-full object-cover"
              />
            </div>
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                La materia
              </p>
              <h2 className="font-serif text-4xl font-light tracking-tight sm:text-5xl">
                Ogni progetto comincia da qui.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Rovere o noce, laccato opaco o pietra naturale — decine di finiture e colorazioni
                personalizzabili, per un progetto che sia davvero il tuo. Le vedrai tutte, una a
                una, nel momento in cui inizierai a costruire la tua idea con noi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Il processo - numerazione giustificata: è davvero una sequenza,
          non una decorazione (le tre fasi reali del Customer Journey). */}
      <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <div className="mb-16 text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Come funziona
          </p>
          <h2 className="font-serif text-4xl font-light tracking-tight sm:text-5xl">
            Non un modulo. Una consulenza.
          </h2>
        </div>
        <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
          {fasi.map((fase) => (
            <div key={fase.numero}>
              <p className="font-serif text-5xl font-light text-primary/40">{fase.numero}</p>
              <h3 className="mt-4 text-lg font-medium">{fase.titolo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {fase.descrizione}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Chiusura - foto del laboratorio in trasparenza (Pexels, licenza
          gratuita per uso commerciale) - ambientazione generale, non
          dichiarata come "il nostro laboratorio" specifico. */}
      <section className="relative overflow-hidden border-t border-border px-6 py-24 text-center sm:py-32">
        <Image
          src="/foto-laboratorio.jpg"
          alt=""
          fill
          className="object-cover opacity-[0.22]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-card/60" aria-hidden="true" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-balance font-serif text-4xl font-light tracking-tight sm:text-5xl">
            Il legno aspetta solo la tua idea.
          </h2>
          <div className="mt-10">
            <Button size="lg" variant="accent" asChild>
              <Link href="/progetti">Inizia il tuo progetto</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">
        Ramirez Atelier — Laboratorio artigiano dal 1987
      </footer>
    </main>
  );
}
