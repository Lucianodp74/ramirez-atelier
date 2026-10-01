import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { StellaHero3D } from '@/components/StellaHero3D';

const fasi = [
  { numero: '01', titolo: 'Racconta il tuo spazio', descrizione: 'Materiali, dimensioni indicative, ispirazioni — anche solo abbozzate. Partiamo da ciò che immagini.' },
  { numero: '02', titolo: 'Ricevi una prima stima', descrizione: 'Una fascia di prezzo indicativa, chiara fin dall’inizio, prima ancora di entrare nei dettagli.' },
  { numero: '03', titolo: 'Incontriamoci di persona', descrizione: 'Sopralluogo, materiali e dettagli definiti insieme. Poi il progetto prende forma.' },
];

function LegalLinks() {
  return (
    <div className="mt-8 border-t border-border/70 pt-5 text-center sm:flex sm:items-center sm:justify-between sm:gap-6 sm:text-left">
      <nav aria-label="Informazioni legali" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:justify-start">
        <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
        <Link href="/cookie-policy" className="transition-colors hover:text-foreground">Cookie Policy</Link>
        <Link href="/termini-e-condizioni" className="transition-colors hover:text-foreground">Termini e condizioni</Link>
      </nav>
      <p className="mt-4 text-[10px] tracking-[0.08em] text-muted-foreground sm:mt-0">ITALDESIGN DI RAMIREZ ROBERTO · P.IVA 04951160755</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" aria-label="Ramirez Atelier" className="block">
          <Image src="/logo-completo.png" alt="Ramirez Atelier — Arredi su misura" width={320} height={178} priority className="h-auto w-[150px] sm:w-[175px]" />
        </Link>
        <nav className="hidden items-center gap-7 text-[11px] uppercase tracking-[0.18em] text-muted-foreground md:flex" aria-label="Navigazione principale">
          <Link href="/progetti" className="transition-colors hover:text-foreground">Progetti</Link>
          <a href="#materia" className="transition-colors hover:text-foreground">Materia</a>
          <a href="#percorso" className="transition-colors hover:text-foreground">Metodo</a>
          <Link href="/richiesta" className="border-b border-[#A6532B] pb-1 text-[#8F4525]">Parliamone</Link>
        </nav>
      </header>

      <section className="relative overflow-hidden border-y border-border/70 bg-[radial-gradient(circle_at_82%_38%,rgba(166,83,43,0.13),transparent_32%),linear-gradient(135deg,rgba(166,83,43,0.055),transparent_48%)]">
        <div className="mx-auto grid max-w-7xl items-center gap-2 px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-10">
          <div className="relative z-10 py-16 sm:py-20 lg:py-24">
            <p className="mb-5 text-[10px] uppercase tracking-[0.28em] text-[#A6532B]">Falegnameria artigiana · dal 1987</p>
            <p className="mb-4 font-serif text-sm italic text-[#A6532B]">STELLA · Madia manifesto</p>
            <h1 className="max-w-2xl text-balance font-serif text-[3.2rem] font-light leading-[0.98] tracking-[-0.03em] sm:text-6xl xl:text-7xl">
              La tua casa,
              <br />
              disegnata a mano,
              <br />
              <span className="italic text-[#A6532B]">costruita per durare.</span>
            </h1>
            <p className="mt-7 max-w-xl text-balance text-base leading-7 text-muted-foreground sm:text-lg">
              Arredi su misura pensati intorno al tuo spazio. Progetto, materiali e lavorazione artigianale si incontrano in un unico percorso.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button size="lg" variant="accent" className="border-[#A6532B] bg-[#A6532B] px-7 text-white shadow-[0_12px_32px_rgba(166,83,43,0.20)] hover:bg-[#8F4525]" asChild>
                <Link href="/richiesta">Raccontaci il tuo progetto</Link>
              </Button>
              <Link href="/progetti" className="text-xs uppercase tracking-[0.18em] text-[#8F4525] transition-opacity hover:opacity-60">Scopri i progetti →</Link>
            </div>
            <div className="mt-10 flex gap-8 border-t border-border/70 pt-5 text-[10px] uppercase tracking-[0.17em] text-muted-foreground">
              <span>Su misura</span>
              <span>Produzione artigianale</span>
              <span className="hidden sm:inline">Dal progetto alla posa</span>
            </div>
          </div>
          <div className="relative -mx-6 min-h-[440px] sm:-mx-8 lg:mx-0 lg:min-h-[600px]">
            <StellaHero3D />
          </div>
        </div>
      </section>

      <section id="materia" className="border-b border-border bg-card py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background shadow-[0_24px_70px_rgba(42,38,34,0.08)]">
              <Image src="/foto-finiture.jpg" alt="Ventaglio di finiture e materiali disponibili" width={1536} height={1024} quality={90} className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]" />
            </div>
            <div className="max-w-xl">
              <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-[#A6532B]">La materia</p>
              <h2 className="font-serif text-4xl font-light tracking-tight sm:text-5xl">Ogni progetto comincia da qui.</h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">Rovere, noce, laccati e superfici materiche: scegliamo insieme ciò che deve entrare nella tua casa. Ogni finitura diventa parte del progetto, non un semplice campionario.</p>
              <div className="mt-8 h-px w-16 bg-[#A6532B]" aria-hidden="true" />
              <p className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">Materiali · colori · dettagli · proporzioni</p>
            </div>
          </div>
        </div>
      </section>

      <section id="percorso" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="mb-14 max-w-2xl sm:mb-16">
          <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-[#A6532B]">Il nostro metodo</p>
          <h2 className="font-serif text-4xl font-light tracking-tight sm:text-5xl">Non un modulo. Un progetto costruito insieme.</h2>
        </div>
        <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {fasi.map((fase, index) => (
            <div key={fase.numero} className="relative border-t border-border pt-6 sm:px-2">
              {index < fasi.length - 1 && <span className="absolute left-[calc(100%+0.5rem)] top-7 hidden h-px w-[calc(100%-1rem)] bg-border sm:block" aria-hidden="true" />}
              <p className="font-serif text-5xl font-light text-[#A6532B]">{fase.numero}</p>
              <h3 className="mt-4 text-lg font-medium">{fase.titolo}</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{fase.descrizione}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-border px-6 py-24 text-center sm:py-32">
        <Image src="/foto-laboratorio.jpg" alt="" fill quality={90} className="object-cover opacity-[0.30]" aria-hidden="true" />
        <div className="absolute inset-0 bg-card/45" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-[#A6532B]">Dal laboratorio a casa tua</p>
          <h2 className="text-balance font-serif text-4xl font-light tracking-tight sm:text-5xl">Il legno aspetta solo la tua idea.</h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted-foreground">Una prima conversazione basta per capire se possiamo dare forma a quello che hai in mente.</p>
          <div className="mt-10">
            <Button size="lg" variant="accent" className="border-[#A6532B] bg-[#A6532B] px-8 text-white shadow-[0_12px_32px_rgba(166,83,43,0.20)] hover:bg-[#8F4525]" asChild>
              <Link href="/richiesta">Inizia il tuo progetto</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card px-6 py-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-[1.1fr_1fr] sm:items-end">
            <div>
              <p className="font-serif text-2xl tracking-tight text-foreground">RAMIREZ ATELIER</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#A6532B]">Arredi su misura · Falegnameria artigiana dal 1987</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Laboratorio</p>
              <address className="mt-3 not-italic leading-relaxed text-foreground">Via S. Andrea, Zona Artigianale<br />Borgagne di Melendugno, 73026</address>
              <a href="mailto:info@ramirezatelier.it" className="mt-2 inline-block text-[#8F4525] underline-offset-4 transition-colors hover:text-[#A6532B] hover:underline">info@ramirezatelier.it</a>
            </div>
          </div>
          <LegalLinks />
          <div className="mt-5 flex justify-end text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <Link href="/admin/login" className="text-[#8F4525] transition-opacity hover:opacity-60">Accedi all&apos;area riservata</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
