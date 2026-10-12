import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StellaHero3D } from '@/components/StellaHero3D';
import { cn } from '@/lib/utils';

const garanzie = [
  { titolo: 'Dal 1987', descrizione: 'Quasi quarant’anni di falegnameria artigiana' },
  { titolo: 'Su misura', descrizione: 'Ogni pezzo disegnato sul tuo spazio' },
  { titolo: 'Stima in pochi minuti', descrizione: 'Una fascia di prezzo onesta, subito' },
];

const lavori = [
  { titolo: 'Zona giorno', immagine: '/foto-elemento-altro-zona-giorno.jpg' },
  {
    titolo: 'Pareti attrezzate',
    immagine: '/foto-elemento-parete-attrezzata.jpg',
  },
  { titolo: 'Librerie', immagine: '/foto-elemento-libreria.jpg' },
  {
    titolo: 'Madie e credenze',
    immagine: '/foto-elemento-credenza.jpg',
  },
];

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

const linkFocus =
  'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

function Sovratitolo({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('mb-4 text-xs font-medium uppercase tracking-[0.25em] text-brand', className)}>
      {children}
    </p>
  );
}

function Intestazione() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-10">
        <Link
          href="/"
          aria-label="Ramirez Atelier — torna alla home"
          className={`flex items-center gap-3 ${linkFocus}`}
        >
          <Image
            src="/logo-monogramma.png"
            alt=""
            width={666}
            height={487}
            priority
            className="h-9 w-auto sm:h-11"
          />
          <span className="hidden font-serif text-lg tracking-tight sm:inline">
            Ramirez Atelier
          </span>
        </Link>
        <nav
          aria-label="Sezioni della pagina"
          className="hidden items-center gap-8 text-sm text-muted-foreground md:flex"
        >
          <a
            href="#lavori"
            className={`transition-colors duration-200 hover:text-foreground ${linkFocus}`}
          >
            Cosa realizziamo
          </a>
          <a
            href="#materia"
            className={`transition-colors duration-200 hover:text-foreground ${linkFocus}`}
          >
            La materia
          </a>
          <a
            href="#come-funziona"
            className={`transition-colors duration-200 hover:text-foreground ${linkFocus}`}
          >
            Come funziona
          </a>
        </nav>
        <Button variant="brand" className="h-11 px-5" asChild>
          <Link href="/progetti">Inizia il progetto</Link>
        </Button>
      </div>
    </header>
  );
}

function LegalLinks() {
  return (
    <div className="mt-8 border-t border-border pt-6 text-center sm:flex sm:items-center sm:justify-between sm:gap-6 sm:text-left">
      <nav
        aria-label="Informazioni legali"
        className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs uppercase tracking-[0.14em] text-muted-foreground sm:justify-start"
      >
        <Link
          href="/privacy"
          className={`transition-colors duration-200 hover:text-foreground ${linkFocus}`}
        >
          Privacy
        </Link>
        <Link
          href="/cookie-policy"
          className={`transition-colors duration-200 hover:text-foreground ${linkFocus}`}
        >
          Cookie Policy
        </Link>
        <Link
          href="/termini-e-condizioni"
          className={`transition-colors duration-200 hover:text-foreground ${linkFocus}`}
        >
          Termini e condizioni
        </Link>
      </nav>
      <p className="mt-4 text-xs tracking-[0.08em] text-muted-foreground sm:mt-0">
        ITALDESIGN DI RAMIREZ ROBERTO · P.IVA 04951160755
      </p>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <a
        href="#contenuto"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-4 focus:py-3 focus:text-background"
      >
        Vai al contenuto
      </a>
      <Intestazione />
      <main id="contenuto" className="min-h-screen bg-background text-foreground">
        {/* Hero: proposta di valore + modello 3D */}
        <section className="grana relative overflow-hidden bg-[radial-gradient(circle_at_78%_48%,rgba(166,83,43,0.10),transparent_34%),linear-gradient(135deg,rgba(166,83,43,0.05),transparent_42%)]">
          <div className="mx-auto grid max-w-7xl items-center gap-4 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-10">
            <div className="relative z-10 pb-4 pt-14 sm:pt-20 lg:py-24">
              <Sovratitolo className="rivela">Falegnameria artigiana — dal 1987</Sovratitolo>
              <h1 className="rivela text-balance font-serif text-[2.6rem] font-light leading-[1.05] tracking-tight [animation-delay:80ms] sm:text-6xl xl:text-[4.25rem]">
                La tua casa,
                <br />
                disegnata a mano,
                <br />
                <span className="italic text-brand">costruita per durare.</span>
              </h1>
              <p className="rivela mt-7 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground [animation-delay:160ms]">
                Arredi su misura nati dal dialogo tra progetto e materia. Raccontaci il tuo spazio:
                in pochi minuti ricevi una prima stima, poi lo definiamo insieme.
              </p>
              <div className="rivela mt-9 flex flex-col gap-3 [animation-delay:240ms] sm:flex-row sm:items-center sm:gap-4">
                <Button size="lg" variant="brand" asChild>
                  <Link href="/progetti">
                    Inizia il tuo progetto
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-foreground/20 bg-card/60"
                  asChild
                >
                  <a href="#lavori">Guarda cosa realizziamo</a>
                </Button>
              </div>
            </div>
            <figure className="-mx-4 sm:-mx-6 lg:mx-0">
              <StellaHero3D />
              <figcaption className="-mt-6 pb-8 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground lg:-mt-10">
                <span className="font-serif text-sm normal-case italic tracking-normal text-brand-strong">
                  STELLA
                </span>{' '}
                · madia manifesto
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Garanzie: prova di credibilità subito sotto la hero */}
        <section aria-label="Perché sceglierci" className="border-y border-border bg-card">
          <ul className="mx-auto grid max-w-6xl divide-y divide-border px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6">
            {garanzie.map((g) => (
              <li key={g.titolo} className="px-2 py-6 text-center sm:px-6 sm:py-8">
                <p className="font-serif text-2xl font-light tracking-tight">{g.titolo}</p>
                <p className="mt-1 text-sm text-muted-foreground">{g.descrizione}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Capitolo 1: cosa realizziamo */}
        <section
          id="lavori"
          aria-labelledby="titolo-lavori"
          className="scroll-mt-24 py-20 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="mb-12 flex flex-col gap-6 sm:mb-14 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <Sovratitolo>Cosa realizziamo</Sovratitolo>
                <h2
                  id="titolo-lavori"
                  className="text-balance font-serif text-4xl font-light tracking-tight sm:text-5xl"
                >
                  Dalla zona giorno alla libreria, ogni pezzo nasce per un solo spazio.
                </h2>
              </div>
              <Link
                href="/progetti"
                className={`group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-strong underline-offset-4 hover:underline ${linkFocus}`}
              >
                Scegli da dove partire
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1"
                />
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {lavori.map((lavoro) => (
                <li key={lavoro.titolo}>
                  <Link
                    href="/progetti"
                    className={`group block overflow-hidden rounded-[1.25rem] border border-border/70 bg-card shadow-[0_12px_40px_rgba(42,38,34,0.06)] transition-shadow duration-300 hover:shadow-[0_20px_60px_rgba(42,38,34,0.12)] ${linkFocus}`}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                      <Image
                        src={lavoro.immagine}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="flex items-center justify-between min-h-14 gap-2 px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
                      <h3 className="font-serif text-base font-light sm:text-xl tracking-tight">
                        {lavoro.titolo}
                      </h3>
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-brand transition-transform duration-200 motion-safe:group-hover:translate-x-1"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Capitolo 2: la materia */}
        <section
          id="materia"
          aria-labelledby="titolo-materia"
          className="grana scroll-mt-24 border-y border-border bg-card py-20 sm:py-28"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background shadow-[0_20px_60px_rgba(42,38,34,0.08)]">
              <Image
                src="/foto-finiture.jpg"
                alt="Ventaglio di finiture e materiali disponibili: legni, laccati, pietre"
                width={1536}
                height={1024}
                sizes="(min-width: 1024px) 560px, 100vw"

                className="aspect-[4/3] h-full w-full object-cover"
              />
            </div>
            <div className="max-w-xl">
              <Sovratitolo>La materia</Sovratitolo>
              <h2
                id="titolo-materia"
                className="font-serif text-4xl font-light tracking-tight sm:text-5xl"
              >
                Ogni progetto comincia da qui.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Rovere o noce, laccato opaco o pietra naturale — decine di finiture e colorazioni
                personalizzabili, per un progetto che sia davvero il tuo. Le vedrai tutte, una a
                una, nel momento in cui inizierai a costruire la tua idea con noi.
              </p>
              <div className="mt-8 h-px w-16 bg-brand" aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* Capitolo 3: come funziona */}
        <section
          id="come-funziona"
          aria-labelledby="titolo-come-funziona"
          className="mx-auto max-w-5xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28"
        >
          <div className="mb-14 text-center sm:mb-16">
            <Sovratitolo>Come funziona</Sovratitolo>
            <h2
              id="titolo-come-funziona"
              className="font-serif text-4xl font-light tracking-tight sm:text-5xl"
            >
              Non un modulo. Una consulenza.
            </h2>
          </div>
          <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {fasi.map((fase, index) => (
              <li key={fase.numero} className="relative sm:px-3">
                {index < fasi.length - 1 && (
                  <span
                    className="absolute left-[calc(100%+0.5rem)] top-7 hidden h-px w-[calc(100%-1rem)] bg-border sm:block"
                    aria-hidden="true"
                  />
                )}
                <p className="font-serif text-5xl font-light text-brand" aria-hidden="true">
                  {fase.numero}
                </p>
                <h3 className="mt-4 text-lg font-medium">{fase.titolo}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {fase.descrizione}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-14 text-center">
            <Button size="lg" variant="brand" asChild>
              <Link href="/progetti">
                Ricevi la tua prima stima
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Chiusura: CTA finale sul laboratorio */}
        <section
          aria-labelledby="titolo-chiusura"
          className="relative overflow-hidden bg-foreground px-4 py-24 text-center text-background sm:py-32"
        >
          <Image
            src="/foto-laboratorio.jpg"
            alt=""
            fill
            sizes="100vw"

            className="object-cover opacity-30"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-foreground/70"
            aria-hidden="true"
          />
          <div className="relative">
            <Sovratitolo className="text-brand-soft">Dal laboratorio a casa tua</Sovratitolo>
            <h2
              id="titolo-chiusura"
              className="mx-auto max-w-2xl text-balance font-serif text-4xl font-light tracking-tight sm:text-5xl"
            >
              Il legno aspetta solo la tua idea.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-background/80">
              Nessun impegno: inizi a raccontarci il progetto e decidi tu quando incontrarci.
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                variant="brand"
                className="focus-visible:ring-background focus-visible:ring-offset-foreground"
                asChild
              >
                <Link href="/progetti">Inizia il tuo progetto</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-[1.1fr_1fr] sm:items-end">
            <div>
              <Image
                src="/logo-completo.png"
                alt="Ramirez Atelier — Arredi su misura"
                width={906}
                height={889}
                className="h-auto w-[120px]"
              />
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-brand-strong">
                Arredi su misura · Falegnameria artigiana dal 1987
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Laboratorio
              </p>
              <address className="mt-3 not-italic leading-relaxed text-foreground">
                Via S. Andrea, Zona Artigianale
                <br />
                Borgagne di Melendugno, 73026
              </address>
              <a
                href="mailto:info@ramirezatelier.it"
                className={`mt-2 inline-flex min-h-11 items-center text-brand-strong underline-offset-4 transition-colors duration-200 hover:text-brand hover:underline ${linkFocus}`}
              >
                info@ramirezatelier.it
              </a>
            </div>
          </div>
          <LegalLinks />
          <div className="mt-5 flex justify-end text-xs uppercase tracking-[0.14em]">
            <Link
              href="/admin/login"
              className={`inline-flex min-h-11 items-center text-brand-strong transition-opacity duration-200 hover:opacity-70 ${linkFocus}`}
            >
              Accedi all&apos;area riservata
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
