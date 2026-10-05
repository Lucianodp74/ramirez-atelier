import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bath, ChefHat, DoorOpen, Layers3, Ruler, Sofa, SquareStack } from 'lucide-react';
import { db } from '@/server/db';

export const dynamic = 'force-dynamic';

const progettiVisuali = [
  { immagine: '/progetti/zona-giorno-su-misura.jpg', etichetta: 'Zona giorno' },
  { immagine: '/progetti/cucina-su-misura.jpg', etichetta: 'Cucine su misura' },
  { immagine: '/progetti/armadio-cabina.jpg', etichetta: 'Armadi e cabine' },
  { immagine: '/progetti/falegnameria-su-misura.jpg', etichetta: 'Falegnameria su misura' },
];

const progettiCategoriaVisuali = [
  { immagine: '/progetti/cucina-su-misura.jpg', etichetta: 'Cucina su misura' },
  { immagine: '/progetti/armadio-cabina.jpg', etichetta: 'Armadio e cabina armadio su misura' },
  { immagine: '/progetti/zona-giorno-su-misura.jpg', etichetta: 'Zona giorno su misura' },
  { immagine: '/progetti/falegnameria-su-misura.jpg', etichetta: 'Falegnameria su misura' },
];

const icone = [ChefHat, Layers3, SquareStack, Bath, Sofa, DoorOpen];

function LegalLinks() {
  return (
    <div className="mt-8 border-t border-border pt-5">
      <nav aria-label="Informazioni legali" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link href="/cookie-policy" className="hover:text-foreground">Cookie Policy</Link>
        <Link href="/termini-e-condizioni" className="hover:text-foreground">Termini e condizioni</Link>
      </nav>
      <p className="mt-3 text-center text-[10px] tracking-[0.08em] text-muted-foreground">ITALDESIGN DI RAMIREZ ROBERTO · P.IVA 04951160755</p>
    </div>
  );
}

export default async function ProgettiPage() {
  const tipiProgetto = await db.tipoProgetto.findMany({ where: { attivo: true }, orderBy: { ordinamento: 'asc' } });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-8 sm:pb-24 sm:pt-10">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Ramirez Atelier</Link>
          <div className="mx-auto mt-16 max-w-4xl text-center sm:mt-20">
            <p className="mb-5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Il portfolio</p>
            <h1 className="text-balance font-serif text-5xl font-light leading-[1.04] tracking-tight sm:text-7xl">Progetti che diventano spazio.</h1>
            <p className="mx-auto mt-7 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl">Ogni ambiente parte da esigenze reali, misure reali e un progetto costruito intorno a chi lo vive.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-[#A6532B]">Ramirez Atelier</p>
            <h2 className="font-serif text-3xl font-light tracking-tight sm:text-4xl">Alcune possibilità</h2>
          </div>
          <p className="hidden max-w-xs text-right text-sm leading-relaxed text-muted-foreground sm:block">Immagini e categorie sono organizzate con proporzioni uniformi: niente effetto mosaico, ogni progetto ha lo stesso peso visivo.</p>
        </div>

        <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2">
          {progettiVisuali.map((progetto) => (
            <Link key={progetto.immagine} href="/preventivatore" className="group block">
              <div className="relative aspect-[4/3] overflow-hidden bg-card">
                <Image src={progetto.immagine} alt={progetto.etichetta} fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
              </div>
              <div className="flex items-center justify-between border-b border-border pt-4 pb-5">
                <h3 className="font-serif text-2xl font-light tracking-tight">{progetto.etichetta}</h3>
                <ArrowRight className="h-4 w-4 text-[#8F4525] transition-transform group-hover:translate-x-1" strokeWidth={1.3} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-[#A6532B]">Da dove partiamo</p>
            <h2 className="font-serif text-3xl font-light tracking-tight sm:text-4xl">Scegli il tuo progetto</h2>
            <p className="mt-4 text-muted-foreground">Non serve avere già tutto deciso. Ti guideremo passo dopo passo.</p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {tipiProgetto.map((tipo, i) => {
              const Icona = icone[i % icone.length];
              const visuale = progettiCategoriaVisuali[i % progettiCategoriaVisuali.length];
              return (
                <Link key={tipo.id} href={`/progetti/${tipo.chiave}`} className="group bg-background">
                  <article className="relative flex min-h-[390px] flex-col overflow-hidden p-6 sm:p-7">
                    <div className="absolute inset-x-0 top-0 aspect-[16/9] overflow-hidden">
                      <Image src={visuale.immagine} alt={visuale.etichetta} fill sizes="(min-width:1024px) 33vw,(min-width:640px) 50vw,100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
                      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/25" />
                    </div>
                    <div className="relative flex h-full flex-col">
                      <div className="flex items-center justify-between">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/90 text-[#8F4525] shadow-sm backdrop-blur-sm"><Icona className="h-4 w-4" strokeWidth={1.6} /></span>
                        <span className="text-xs tracking-[0.2em] text-foreground/80">0{i + 1}</span>
                      </div>
                      <div className="mt-auto pt-52">
                        <h3 className="font-serif text-2xl font-light tracking-tight">{tipo.nome}</h3>
                        {tipo.descrizione && <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{tipo.descrizione}</p>}
                        <span className="mt-6 flex items-center gap-2 text-sm font-medium">Inizia a progettare<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>

          {tipiProgetto.length === 0 && (
            <div className="mx-auto max-w-xl rounded-sm border border-dashed border-border p-10 text-center">
              <p className="font-medium">Stiamo preparando i nuovi progetti.</p>
              <p className="mt-2 text-sm text-muted-foreground">Torna presto: troverai qui le categorie disponibili per iniziare il tuo percorso.</p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-sm border border-border bg-card">
          <div className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:p-14">
            <div>
              <div className="mb-4 flex items-center gap-3 text-[#A6532B]"><Ruler className="h-5 w-5" strokeWidth={1.5} /><p className="text-[10px] uppercase tracking-[0.25em]">Configuratore Ramirez</p></div>
              <h2 className="max-w-2xl font-serif text-3xl font-light tracking-tight sm:text-4xl">Configura il tuo arredo su misura.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">Scegli moduli, dimensioni, materiale e finitura. Puoi comporre più elementi e ricevere una prima stima indicativa prima di definire ogni dettaglio con il nostro laboratorio.</p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link href="/preventivatore" className="inline-flex items-center gap-2 rounded-sm bg-[#A6532B] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90">Apri il configuratore<ArrowRight className="h-4 w-4" /></Link>
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Stima indicativa · senza impegno</span>
              </div>
            </div>
            <div className="hidden h-32 w-32 items-center justify-center rounded-full border border-border bg-background lg:flex"><Ruler className="h-10 w-10 text-[#A6532B]/70" strokeWidth={1} /></div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card px-6 py-10">
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-serif text-2xl tracking-tight text-foreground">RAMIREZ ATELIER</p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#A6532B]">Arredi su misura · Falegnameria artigiana dal 1987</p>
          <p className="mt-4 text-sm text-muted-foreground">Via S. Andrea, Zona Artigianale · Borgagne di Melendugno, 73026</p>
          <a href="mailto:info@ramirezatelier.it" className="mt-2 inline-block text-sm text-[#8F4525] underline-offset-4 hover:underline">info@ramirezatelier.it</a>
          <LegalLinks />
          <div className="mt-5 text-[10px] uppercase tracking-[0.14em]"><Link href="/admin/login" className="text-[#8F4525] hover:opacity-60">Area riservata falegname</Link></div>
        </div>
      </footer>
    </main>
  );
}
