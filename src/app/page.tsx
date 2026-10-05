import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StellaHero3D } from '@/components/StellaHero3D';

const progetti = [
  { immagine: '/progetti/zona-giorno-su-misura.jpg', categoria: 'Zona giorno', titolo: 'Arredi su misura' },
  { immagine: '/progetti/cucina-su-misura.jpg', categoria: 'Cucine', titolo: 'Cucina su misura' },
  { immagine: '/progetti/armadio-cabina.jpg', categoria: 'Contenitori', titolo: 'Armadi e cabine' },
  { immagine: '/progetti/falegnameria-su-misura.jpg', categoria: 'Atelier', titolo: 'Falegnameria su misura' },
];

const fasi = [
  { numero: '01', titolo: 'Racconta il tuo spazio', descrizione: 'Partiamo da ciò che immagini: ambiente, misure indicative, esigenze e ispirazioni.' },
  { numero: '02', titolo: 'Configura il progetto', descrizione: 'Costruisci una prima composizione e ottieni una stima indicativa prima di definire ogni dettaglio.' },
  { numero: '03', titolo: 'Lo definiamo insieme', descrizione: 'Materiali, finiture, sopralluogo e dettagli vengono poi verificati con il nostro laboratorio.' },
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
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" aria-label="Ramirez Atelier" className="block shrink-0">
          <Image src="/logo-completo.png" alt="Ramirez Atelier — Arredi su misura" width={320} height={178} priority className="h-auto w-[120px] sm:w-[145px]" />
        </Link>
        <nav className="hidden items-center gap-7 text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:flex" aria-label="Navigazione principale">
          <Link href="/progetti" className="transition-colors hover:text-foreground">Progetti</Link>
          <Link href="/preventivatore" className="transition-colors hover:text-foreground">Configuratore</Link>
          <a href="#percorso" className="transition-colors hover:text-foreground">Metodo</a>
          <Link href="/richiesta" className="text-[#8F4525] transition-opacity hover:opacity-60">Parliamone ↗</Link>
        </nav>
      </header>

      <section className="relative overflow-hidden border-y border-border/70 bg-[radial-gradient(circle_at_82%_38%,rgba(166,83,43,0.13),transparent_32%),linear-gradient(135deg,rgba(166,83,43,0.055),transparent_48%)]">
        <div className="mx-auto grid max-w-7xl items-center gap-2 px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-10">
          <div className="relative z-10 py-14 sm:py-20 lg:py-24">
            <p className="mb-5 text-[10px] uppercase tracking-[0.28em] text-[#A6532B]">Falegnameria artigiana · dal 1987</p>
            <p className="mb-4 font-serif text-sm italic text-[#A6532B]">Ramirez Atelier · arredi su misura</p>
            <h1 className="max-w-2xl text-balance font-serif text-[3rem] font-light leading-[0.98] tracking-[-0.03em] sm:text-6xl xl:text-7xl">
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
                <Link href="/preventivatore">Configura il tuo progetto</Link>
              </Button>
              <Link href="/progetti" className="text-xs uppercase tracking-[0.18em] text-[#8F4525] transition-opacity hover:opacity-60">Guarda i progetti →</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-border/70 pt-5 text-[10px] uppercase tracking-[0.17em] text-muted-foreground">
              <span>Su misura</span>
              <span>Produzione artigianale</span>
              <span>Dal progetto alla posa</span>
            </div>
          </div>
          <div className="relative -mx-6 min-h-[420px] sm:-mx-8 lg:mx-0 lg:min-h-[590px]">
            <StellaHero3D />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="mb-12 flex items-end justify-between gap-6 sm:mb-14">
          <div>
            <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-[#A6532B]">Il portfolio</p>
            <h2 className="font-serif text-4xl font-light tracking-tight sm:text-5xl">Progetti che diventano spazio.</h2>
          </div>
          <Link href="/progetti" className="hidden text-[10px] uppercase tracking-[0.2em] text-[#8F4525] sm:block">Tutti i progetti ↗</Link>
        </div>
        <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2">
          {progetti.map((progetto) => (
            <Link key={progetto.immagine} href="/progetti" className="group block">
              <div className="relative aspect-[4/3] overflow-hidden bg-card">
                <Image src={progetto.immagine} alt={`${progetto.titolo} Ramirez Atelier`} fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
              </div>
              <div className="border-b border-border/80 pb-5 pt-4">
                <p className="text-[9px] uppercase tracking-[0.22em] text-[#A6532B]">{progetto.categoria}</p>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <h3 className="font-serif text-2xl font-light tracking-tight">{progetto.titolo}</h3>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#8F4525] transition-transform group-hover:translate-x-1" strokeWidth={1.3} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card" id="configuratore">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <div className="mb-4 flex items-center gap-3 text-[#A6532B]"><Ruler className="h-5 w-5" strokeWidth={1.4} /><p className="text-[10px] uppercase tracking-[0.25em]">Il configuratore Ramirez</p></div>
              <h2 className="font-serif text-4xl font-light tracking-tight sm:text-5xl">Dalla tua idea a una prima stima.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Scegli il tipo di arredo, dimensioni, materiali e finiture. Il preventivatore ti accompagna passo dopo passo e prepara la richiesta da portare nel nostro percorso di progettazione.</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button size="lg" variant="accent" className="border-[#A6532B] bg-[#A6532B] px-7 text-white hover:bg-[#8F4525]" asChild><Link href="/preventivatore">Apri il configuratore</Link></Button>
                <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Stima indicativa · senza impegno</span>
              </div>
            </div>
            <div className="hidden h-32 w-32 items-center justify-center rounded-full border border-border bg-background lg:flex"><Ruler className="h-10 w-10 text-[#A6532B]/70" strokeWidth={1} /></div>
          </div>
        </div>
      </section>

      <section id="percorso" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="mb-14 max-w-2xl sm:mb-16">
          <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-[#A6532B]">Il nostro metodo</p>
          <h2 className="font-serif text-4xl font-light tracking-tight sm:text-5xl">Non un modulo. Un progetto costruito insieme.</h2>
        </div>
        <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {fasi.map((fase) => (
            <div key={fase.numero} className="border-t border-border pt-6 sm:px-2">
              <p className="font-serif text-5xl font-light text-[#A6532B]">{fase.numero}</p>
              <h3 className="mt-4 text-lg font-medium">{fase.titolo}</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{fase.descrizione}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-border px-6 py-24 text-center sm:py-32">
        <Image src="/foto-laboratorio.jpg" alt="Laboratorio Ramirez Atelier" fill quality={90} className="object-cover opacity-[0.30]" aria-hidden="true" />
        <div className="absolute inset-0 bg-card/50" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-[#A6532B]">Dal laboratorio a casa tua</p>
          <h2 className="text-balance font-serif text-4xl font-light tracking-tight sm:text-5xl">Il legno aspetta solo la tua idea.</h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted-foreground">Inizia dal configuratore oppure raccontaci direttamente cosa vuoi realizzare.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="accent" className="border-[#A6532B] bg-[#A6532B] px-8 text-white hover:bg-[#8F4525]" asChild><Link href="/preventivatore">Inizia dal configuratore</Link></Button>
            <Link href="/richiesta" className="inline-flex items-center px-5 text-xs uppercase tracking-[0.16em] text-[#8F4525]">Parliamone →</Link>
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
          <div className="mt-5 flex justify-end text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <Link href="/admin/login" className="text-[#8F4525] transition-opacity hover:opacity-60">Area riservata falegname</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
