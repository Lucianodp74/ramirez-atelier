import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { StellaHero3D } from '@/components/StellaHero3D';

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
      <nav className="mx-auto flex min-h-[112px] max-w-6xl items-center justify-center px-6 py-6 sm:min-h-[128px]">
        <Link href="/" aria-label="Ramirez Atelier" className="block">
          <Image
            src="/logo-completo.png"
            alt="Ramirez Atelier — Arredi su misura"
            width={230}
            height={128}
            priority
            className="h-auto w-[190px] sm:w-[230px]"
          />
        </Link>
      </nav>

      <section className="relative overflow-hidden border-y border-border/70 bg-card/40">
        <div className="mx-auto grid max-w-7xl items-center gap-4 px-6 lg:grid-cols-[0.78fr_1.22fr] lg:px-10">
          <div className="relative z-10 py-16 sm:py-20 lg:py-24">
            <p className="mb-6 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Falegnameria artigiana — dal 1987
            </p>
            <p className="mb-5 font-serif text-sm italic text-primary">STELLA · Madia manifesto</p>
            <h1 className="text-balance font-serif text-[2.8rem] font-light leading-[1.04] tracking-tight sm:text-6xl xl:text-7xl">
              La tua casa,
              <br />
              disegnata a mano,
              <br />
              <span className="italic text-primary">costruita per durare.</span>
            </h1>
            <p className="mt-7 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
              Un oggetto di falegnameria contemporanea, esplorabile in 3D. Materiali, proporzioni e
              dettagli nascono dal dialogo tra progetto e materia.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button size="lg" variant="accent" asChild>
                <Link href="/progetti">Inizia il tuo progetto</Link>
              </Button>
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Modello interattivo
              </span>
            </div>
          </div>

          <div className="-mx-6 sm:-mx-8 lg:mx-0">
            <StellaHero3D />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card py-24">
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
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
          <span>Ramirez Atelier — Laboratorio artigiano dal 1987</span>
          <Link
            href="/admin/login"
            className="uppercase tracking-[0.16em] text-foreground transition-opacity hover:opacity-60"
          >
            Accedi all&apos;area riservata
          </Link>
        </div>
      </footer>
    </main>
  );
}
