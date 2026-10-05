import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Ruler, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StellaHero3D } from '@/components/StellaHero3D';

const fasi = [
  { numero: '01', titolo: 'Racconta lo spazio', descrizione: 'Misure, esigenze e ispirazioni. Anche se il progetto è ancora solo un’idea.' },
  { numero: '02', titolo: 'Configura e stima', descrizione: 'Usa il preventivatore per costruire una prima configurazione e orientarti sul budget.' },
  { numero: '03', titolo: 'Definiamo il progetto', descrizione: 'Sopralluogo, materiali, dettagli e produzione: tutto viene definito insieme.' },
];

function LegalLinks() {
  return (
    <div className="mt-8 border-t border-border/70 pt-5 text-center sm:flex sm:items-center sm:justify-between sm:gap-6 sm:text-left">
      <nav aria-label="Informazioni legali" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:justify-start">
        <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
        <Link href="/cookie-policy" className="transition-colors hover:text-foreground">Cookie Policy</Link>
        <Link href="/termini-e-condizioni" className="transition-colors hover:text-foreground">Termini e condizioni</Link>
      </nav>
      <p className="mt-4 text-[9px] tracking-[0.08em] text-muted-foreground sm:mt-0">ITALDESIGN DI RAMIREZ ROBERTO · P.IVA 04951160755</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-10">
          <Link href="/" aria-label="Ramirez Atelier" className="block shrink-0">
            <Image src="/logo-completo.png" alt="Ramirez Atelier — Arredi su misura" width={320} height={178} priority className="h-auto w-[78px] sm:w-[88px]" />
          </Link>
          <nav className="hidden items-center gap-8 text-[10px] uppercase tracking-[0.19em] text-muted-foreground md:flex" aria-label="Navigazione principale">
            <Link href="/progetti" className="transition-colors hover:text-foreground">Progetti</Link>
            <a href="#metodo" className="transition-colors hover:text-foreground">Metodo</a>
            <a href="#atelier" className="transition-colors hover:text-foreground">Atelier</a>
            <Link href="/preventivatore" className="transition-colors hover:text-foreground">Configuratore</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/progetti" className="hidden text-[10px] uppercase tracking-[0.17em] text-muted-foreground sm:inline">Esplora →</Link>
            <Link href="/richiesta" className="inline-flex items-center gap-2 border border-[#A6532B] px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.17em] text-[#8F4525] transition-colors hover:bg-[#A6532B] hover:text-white">Parliamo</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/70 bg-[radial-gradient(circle_at_80%_35%,rgba(166,83,43,0.14),transparent_32%),linear-gradient(135deg,rgba(166,83,43,0.055),transparent_50%)]">
        <div className="mx-auto grid max-w-7xl items-center px-5 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-10">
          <div className="relative z-10 py-16 sm:py-20 lg:py-24">
            <p className="mb-5 text-[9px] uppercase tracking-[0.3em] text-[#A6532B]">Falegnameria artigiana · dal 1987</p>
            <h1 className="max-w-2xl font-serif text-[3.15rem] font-light leading-[0.97] tracking-[-0.035em] sm:text-6xl xl:text-7xl">
              La tua casa,
              <br />
              disegnata a mano,
              <br />
              <span className="italic text-[#A6532B]">costruita per durare.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">Arredi su misura pensati intorno al tuo spazio. Progetto, configurazione, materiali e lavorazione artigianale in un unico percorso.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button size="lg" variant="accent" className="border-[#A6532B] bg-[#A6532B] px-7 text-white shadow-[0_12px_32px_rgba(166,83,43,0.20)] hover:bg-[#8F4525]" asChild>
                <Link href="/richiesta">Raccontaci il tuo progetto</Link>
              </Button>
              <Link href="/preventivatore" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.17em] text-[#8F4525] transition-opacity hover:opacity-60">Apri il configuratore <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 border-t border-border/70 pt-5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              <span>Su misura</span><span className="text-center">Artigianale</span><span className="text-right">Dalla misura alla posa</span>
            </div>
          </div>
          <div className="relative -mx-5 min-h-[410px] sm:-mx-8 lg:mx-0 lg:min-h-[600px]">
            <StellaHero3D />
            <div className="pointer-events-none absolute bottom-5 left-5 hidden border border-border/70 bg-background/80 px-4 py-3 backdrop-blur sm:block lg:left-auto lg:right-4">
              <p className="text-[8px] uppercase tracking-[0.2em] text-[#A6532B]">Stella</p>
              <p className="mt-1 font-serif text-sm">Un progetto, non un prodotto.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-0 px-6 sm:grid-cols-3">
          <Link href="/progetti" className="group border-b border-border py-9 sm:border-b-0 sm:border-r sm:pr-8">
            <p className="text-[9px] uppercase tracking-[0.25em] text-[#A6532B]">01 · Ispirazione</p>
            <h2 className="mt-3 font-serif text-2xl font-light">Guarda i progetti</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Scopri ambienti, arredi e soluzioni realizzate da Ramirez Atelier.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#8F4525]">Vai ai progetti <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/preventivatore" className="group border-b border-border py-9 sm:border-b-0 sm:border-r sm:px-8">
            <p className="text-[9px] uppercase tracking-[0.25em] text-[#A6532B]">02 · Configurazione</p>
            <h2 className="mt-3 font-serif text-2xl font-light">Costruisci una prima stima</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Componi dimensioni e moduli nel configuratore e parti da una base concreta.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#8F4525]">Apri il configuratore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/richiesta" className="group py-9 sm:pl-8">
            <p className="text-[9px] uppercase tracking-[0.25em] text-[#A6532B]">03 · Progetto</p>
            <h2 className="mt-3 font-serif text-2xl font-light">Parliamo del tuo spazio</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Quando vuoi fare sul serio, raccontaci cosa vuoi realizzare e partiamo insieme.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#8F4525]">Inizia la richiesta <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
          </Link>
        </div>
      </section>

      <section className="border-b border-border bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-stretch gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <Link href="/preventivatore" className="group relative overflow-hidden border border-border bg-card p-8 sm:p-10">
              <div className="absolute right-8 top-8 rounded-full border border-[#A6532B]/30 p-2 text-[#A6532B]"><Ruler className="h-4 w-4" strokeWidth={1.4} /></div>
              <p className="text-[9px] uppercase tracking-[0.27em] text-[#A6532B]">Configuratore Ramirez</p>
              <h2 className="mt-5 max-w-lg font-serif text-3xl font-light sm:text-4xl">Parti dalle misure.<br />Arriva a un progetto.</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">Definisci una composizione, esplora le possibilità e costruisci una prima stima. Quando il progetto è pronto, lo portiamo nel percorso tecnico dell’Atelier.</p>
              <span className="mt-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.17em] text-[#8F4525]">Inizia la configurazione <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
            </Link>
            <div className="border border-border/70 bg-[#F7F3ED] p-8 sm:p-10">
              <p className="text-[9px] uppercase tracking-[0.27em] text-[#A6532B]">Dal digitale all’artigianato</p>
              <p className="mt-5 font-serif text-2xl font-light leading-tight">La configurazione non sostituisce il progetto: lo prepara.</p>
              <div className="mt-7 space-y-4 border-t border-[#A6532B]/20 pt-6 text-sm text-muted-foreground">
                <div className="flex gap-3"><span className="font-serif text-[#A6532B]">01</span><span>Prima stima e composizione</span></div>
                <div className="flex gap-3"><span className="font-serif text-[#A6532B]">02</span><span>Verifica tecnica e materiali</span></div>
                <div className="flex gap-3"><span className="font-serif text-[#A6532B]">03</span><span>Produzione e posa su misura</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="atelier" className="border-b border-border py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="overflow-hidden border border-border/70 bg-card shadow-[0_24px_70px_rgba(42,38,34,0.08)]">
              <Image src="/foto-laboratorio.jpg" alt="Laboratorio Ramirez Atelier" width={1536} height={1024} quality={90} className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]" />
            </div>
            <div className="max-w-xl">
              <p className="mb-4 text-[9px] uppercase tracking-[0.28em] text-[#A6532B]">L&apos;atelier</p>
              <h2 className="font-serif text-4xl font-light tracking-tight sm:text-5xl">Il valore è nel modo in cui viene fatto.</h2>
              <p className="mt-6 text-base leading-7 text-muted-foreground sm:text-lg">Misuriamo, disegniamo, scegliamo i materiali e costruiamo ogni elemento pensando al luogo in cui andrà a vivere.</p>
              <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6 text-[9px] uppercase tracking-[0.17em] text-muted-foreground">
                <span>Progetto su misura</span><span>Materiali selezionati</span><span>Produzione artigianale</span><span>Posa e dettagli</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="metodo" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="mb-14 max-w-2xl sm:mb-16">
          <p className="mb-4 text-[9px] uppercase tracking-[0.28em] text-[#A6532B]">Il metodo Ramirez</p>
          <h2 className="font-serif text-4xl font-light tracking-tight sm:text-5xl">Dall&apos;idea alla stanza.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Un percorso semplice per trasformare un&apos;esigenza in un arredo che appartiene davvero allo spazio.</p>
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

      <section className="border-y border-border bg-card px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-4 flex items-center gap-3 text-[#A6532B]"><Sparkles className="h-4 w-4" strokeWidth={1.5} /><p className="text-[9px] uppercase tracking-[0.25em]">Su misura, davvero</p></div>
            <h2 className="max-w-3xl font-serif text-4xl font-light tracking-tight sm:text-5xl">Hai già un&apos;idea? Dalle una misura.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Puoi iniziare dal configuratore oppure raccontarci direttamente il progetto. La parte tecnica viene dopo: prima capiamo cosa deve funzionare nella tua casa.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/preventivatore" className="inline-flex items-center gap-2 bg-[#A6532B] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#8F4525]">Apri il configuratore <Ruler className="h-4 w-4" /></Link>
              <Link href="/richiesta" className="inline-flex items-center gap-2 border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-[#A6532B] hover:text-[#8F4525]">Parliamo del progetto <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card px-6 py-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-[1.1fr_1fr] sm:items-end">
            <div>
              <p className="font-serif text-2xl tracking-tight">RAMIREZ ATELIER</p>
              <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-[#A6532B]">Arredi su misura · Falegnameria artigiana dal 1987</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Laboratorio</p>
              <address className="mt-3 not-italic text-sm leading-relaxed">Via S. Andrea, Zona Artigianale<br />Borgagne di Melendugno, 73026</address>
              <a href="mailto:info@ramirezatelier.it" className="mt-2 inline-block text-sm text-[#8F4525] underline-offset-4 hover:underline">info@ramirezatelier.it</a>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-4 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <LegalLinks />
            <div className="text-center sm:text-right">
              <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground">Accesso professionale</p>
              <p className="mt-1 text-[9px] text-muted-foreground">Area riservata falegname · Preventivatore</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
