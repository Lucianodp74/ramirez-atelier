import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDownRight, ArrowRight, Mail } from 'lucide-react';
import { ConfiguratoreLibreria } from './_componenti/ConfiguratoreLibreria';
import { Intestazione } from './_componenti/Intestazione';
import { ASSET, CONTATTI, GALLERIA, LAVORAZIONI, METODO } from './_componenti/contenuti';

// Prototipo isolato: non indicizzato, non in sitemap, non sostituisce la home ufficiale.
export const metadata: Metadata = {
  title: 'Prototipo · Home premium | Ramirez Atelier',
  description: 'Prototipo sperimentale della home page di Ramirez Atelier.',
  robots: { index: false, follow: false },
};

// Palette del prototipo, confinata a questa pagina.
// Contrasti verificati: antracite/avorio 15.2:1, bronzo/avorio 5.6:1, grigio/avorio 6.4:1,
// bronzo chiaro/antracite 7.4:1. Il rovere è solo decorativo (2.8:1 su avorio).
const palette = {
  '--pa-avorio': '#F6F1E9',
  '--pa-avorio-2': '#EDE5D8',
  '--pa-antracite': '#1E1B18',
  '--pa-noce': '#5B3F2C',
  '--pa-rovere': '#B48A5A',
  '--pa-bronzo': '#7A5A32',
  '--pa-bronzo-chiaro': '#C9A46A',
  '--pa-grigio': '#5E564C',
  '--pa-grigio-chiaro': '#B9AE9F',
  '--pa-linea': 'rgba(30, 27, 24, 0.12)',
  '--pa-linea-forte': 'rgba(30, 27, 24, 0.28)',
} as CSSProperties;

// ease-out deciso per le interazioni, ease-in-out per ciò che si sposta sullo schermo.
// Pressione 160 ms con scale(0.97); con prefers-reduced-motion niente movimento,
// resta solo una dissolvenza breve.
const STILI_PAGINA = `
html{scroll-padding-top:6rem}
.pa-premi,.pa-colore{transition-property:color,background-color,border-color,box-shadow,transform,translate,scale;transition-duration:160ms;transition-timing-function:cubic-bezier(0.23,1,0.32,1)}
.pa-freccia{transition-property:transform,translate;transition-duration:200ms;transition-timing-function:cubic-bezier(0.23,1,0.32,1)}
.pa-sposta{transition-property:transform,translate;transition-duration:200ms;transition-timing-function:cubic-bezier(0.77,0,0.175,1)}
.pa-ombra{transition:box-shadow 200ms cubic-bezier(0.23,1,0.32,1)}
.pa-zoom{transition-property:transform,scale;transition-duration:600ms;transition-timing-function:cubic-bezier(0.23,1,0.32,1)}
@keyframes pa-comparsa{from{opacity:0;transform:translateY(-6px)}}
@keyframes pa-dissolvenza{from{opacity:0}}
@media (prefers-reduced-motion:no-preference){.pa-premi:active{transform:scale(0.97)}.pa-comparsa{animation:pa-comparsa 200ms cubic-bezier(0.23,1,0.32,1)}}
@media (prefers-reduced-motion:reduce){.pa-comparsa{animation:pa-dissolvenza 150ms ease}}
`;

const focusChiaro =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pa-antracite)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pa-avorio)]';
const focusScuro =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pa-avorio)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pa-antracite)]';
const focusNoce =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pa-avorio)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pa-noce)]';

function Sovratitolo({ children, scuro = false }: { children: ReactNode; scuro?: boolean }) {
  return (
    <p
      className={`mb-5 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.24em] ${
        scuro ? 'text-[var(--pa-bronzo-chiaro)]' : 'text-[var(--pa-bronzo)]'
      }`}
    >
      <span aria-hidden="true" className="h-px w-8 bg-current" />
      {children}
    </p>
  );
}

/** Segnala nel prototipo i testi proposti che l'azienda deve ancora confermare. */
function DaValidare({ scuro = false }: { scuro?: boolean }) {
  return (
    <span
      className={`ml-3 inline-block rounded-full border border-dashed px-2.5 py-0.5 align-middle font-sans text-xs font-normal normal-case tracking-normal ${
        scuro
          ? 'border-[var(--pa-grigio-chiaro)] text-[var(--pa-grigio-chiaro)]'
          : 'border-[var(--pa-grigio)] text-[var(--pa-grigio)]'
      }`}
    >
      testo da validare
    </span>
  );
}

export default function HomepagePremiumPrototipo() {
  return (
    <div
      style={palette}
      className="min-h-screen bg-[var(--pa-avorio)] text-[var(--pa-antracite)] antialiased selection:bg-[var(--pa-rovere)]/40"
    >
      {/* Solo per questa pagina: l'intestazione fissa non copre ancore ed elementi a fuoco,
          e le transizioni condivise del prototipo (curve e durate da emil-design-eng). */}
      <style>{STILI_PAGINA}</style>
      <a
        href="#contenuto"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--pa-antracite)] focus:px-5 focus:py-3 focus:text-[var(--pa-avorio)]"
      >
        Vai al contenuto
      </a>

      <div className="bg-[var(--pa-antracite)] px-5 text-center text-xs text-[var(--pa-grigio-chiaro)]">
        Prototipo sperimentale — non è la home ufficiale.{' '}
        <Link
          href="/"
          className={`inline-flex min-h-11 items-center rounded-sm text-[var(--pa-avorio)] underline underline-offset-4 ${focusScuro}`}
        >
          Vai alla home attuale
        </Link>
      </div>

      <Intestazione />

      <main id="contenuto">
        {/* HERO ------------------------------------------------------------ */}
        <section
          id="inizio"
          aria-labelledby="titolo-hero"
          className="relative bg-[var(--pa-antracite)] text-[var(--pa-avorio)]"
        >
          <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto">
            <Image
              src={`${ASSET}/stella-panorama.jpg`}
              alt="La madia STELLA in radica d’olivo con maniglie a stella in pietra, nella luce di una finestra"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[80%_50%] lg:object-center"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 hidden bg-gradient-to-r from-[var(--pa-antracite)]/85 via-[var(--pa-antracite)]/30 to-transparent lg:block"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--pa-antracite)] to-transparent lg:hidden"
            />
          </div>
          <div className="relative mx-auto max-w-[1320px] px-5 pb-16 sm:px-8 lg:flex lg:min-h-[calc(100svh-7rem)] lg:items-center lg:py-28">
            <div className="max-w-[40rem]">
              <Sovratitolo scuro>Falegnameria artigiana · dal 1987</Sovratitolo>
              <h1
                id="titolo-hero"
                className="text-balance font-serif text-[2.75rem] font-light leading-[1.02] tracking-[-0.02em] sm:text-6xl lg:text-[5.25rem]"
              >
                Il legno prende forma.{' '}
                <span className="block italic text-[var(--pa-bronzo-chiaro)]">
                  Il tuo spazio diventa unico.
                </span>
              </h1>
              <p className="mt-8 max-w-[32rem] text-pretty text-lg leading-relaxed text-[var(--pa-avorio)]/80">
                Progettiamo e costruiamo arredi su misura nel nostro laboratorio di Borgagne di
                Melendugno: cucine, armadi, boiserie e librerie pensati per una sola casa.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <a
                  href="#realizzazioni"
                  className={`group inline-flex h-13 items-center justify-center gap-3 rounded-full bg-[var(--pa-avorio)] px-7 text-sm font-medium text-[var(--pa-antracite)] pa-premi hover:bg-[var(--pa-avorio-2)] ${focusScuro}`}
                >
                  Scopri le realizzazioni
                  <ArrowDownRight
                    aria-hidden="true"
                    className="size-4 pa-freccia motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:translate-y-0.5"
                  />
                </a>
                <a
                  href="#contatti"
                  className={`inline-flex h-13 items-center justify-center rounded-full border border-[var(--pa-avorio)]/40 px-7 text-sm font-medium text-[var(--pa-avorio)] pa-premi hover:bg-[var(--pa-avorio)]/10 ${focusScuro}`}
                >
                  Parliamo del tuo progetto
                </a>
              </div>
            </div>
          </div>
          <p className="absolute bottom-5 right-5 hidden text-xs uppercase tracking-[0.18em] text-[var(--pa-avorio)]/70 sm:right-8 lg:block">
            <span className="font-serif text-sm normal-case italic tracking-normal">STELLA</span> ·
            render del modello
          </p>
        </section>

        {/* MANIFESTO --------------------------------------------------------- */}
        <section
          aria-labelledby="titolo-manifesto"
          className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 sm:py-32"
        >
          <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
            <div>
              <Sovratitolo>L’atelier</Sovratitolo>
              <h2
                id="titolo-manifesto"
                className="text-balance font-serif text-4xl font-light leading-[1.1] tracking-[-0.01em] sm:text-5xl"
              >
                Ogni arredo nasce da un disegno, una misura e una materia scelta con cura.
              </h2>
            </div>
            <dl className="grid gap-10 self-end sm:grid-cols-3 sm:gap-8">
              {[
                [
                  'Su misura',
                  'Nessun modulo standard: ogni pezzo segue le proporzioni del tuo spazio.',
                ],
                [
                  'Materia',
                  'Legni, laccati, pietre e metalli scelti dal vero, campione per campione.',
                ],
                [
                  'Precisione',
                  'Dettagli costruttivi e finiture curati in laboratorio, dall’inizio alla fine.',
                ],
              ].map(([titolo, testo]) => (
                <div key={titolo} className="border-t border-[var(--pa-linea-forte)] pt-5">
                  <dt className="font-serif text-xl">{titolo}</dt>
                  <dd className="mt-3 text-[0.95rem] leading-relaxed text-[var(--pa-grigio)]">
                    {testo}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* LAVORAZIONI ------------------------------------------------------- */}
        <section
          id="lavorazioni"
          aria-labelledby="titolo-lavorazioni"
          className="scroll-mt-24 border-t border-[var(--pa-linea)] bg-[var(--pa-avorio-2)] py-24 sm:py-32"
        >
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
            <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <Sovratitolo>Lavorazioni</Sovratitolo>
                <h2
                  id="titolo-lavorazioni"
                  className="text-balance font-serif text-4xl font-light tracking-[-0.01em] sm:text-5xl"
                >
                  Cinque modi di dare forma allo spazio.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-[var(--pa-grigio)]">
                Le immagini di questa pagina sono render dimostrativi creati per il prototipo, non
                fotografie di lavori consegnati.
              </p>
            </div>
            <ul className="grid gap-5 md:grid-cols-6">
              {LAVORAZIONI.map((l, i) => (
                <li key={l.titolo} className={i < 2 ? 'md:col-span-3' : 'md:col-span-2'}>
                  <Link
                    href="/progetti"
                    className={`group flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-[var(--pa-avorio)] pa-ombra hover:shadow-[0_24px_60px_-28px_rgba(30,27,24,0.45)] ${focusChiaro}`}
                  >
                    <div
                      className={`relative overflow-hidden ${i < 2 ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}
                    >
                      <Image
                        src={l.immagine}
                        alt={l.alt}
                        fill
                        sizes={
                          i < 2
                            ? '(min-width: 768px) 50vw, 100vw'
                            : '(min-width: 768px) 33vw, 100vw'
                        }
                        className="object-cover pa-zoom motion-safe:group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="flex flex-1 items-start justify-between gap-4 p-6">
                      <div>
                        <h3 className="font-serif text-2xl font-light tracking-[-0.01em]">
                          {l.titolo}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--pa-grigio)]">
                          {l.testo}
                        </p>
                      </div>
                      <ArrowRight
                        aria-hidden="true"
                        className="mt-2 size-5 shrink-0 text-[var(--pa-bronzo)] pa-freccia motion-safe:group-hover:translate-x-1"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ESPERIENZA 3D ----------------------------------------------------- */}
        <section
          id="configura"
          aria-labelledby="titolo-configura"
          className="scroll-mt-24 py-24 sm:py-32"
        >
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
            <div className="mb-12 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
              <div>
                <Sovratitolo>Esperienza 3D</Sovratitolo>
                <h2
                  id="titolo-configura"
                  className="text-balance font-serif text-4xl font-light tracking-[-0.01em] sm:text-5xl"
                >
                  Prova a immaginarla. Poi la disegniamo davvero.
                </h2>
              </div>
              <p className="self-end text-[0.95rem] leading-relaxed text-[var(--pa-grigio)]">
                Gira intorno a una libreria, cambia finitura e misure, accendi la luce sotto i
                ripiani. È un esempio per orientarsi: il progetto vero nasce dal rilievo e dal
                confronto con te.
              </p>
            </div>
            <ConfiguratoreLibreria />
          </div>
        </section>

        {/* GALLERIA ---------------------------------------------------------- */}
        <section
          id="realizzazioni"
          aria-labelledby="titolo-realizzazioni"
          className="scroll-mt-24 bg-[var(--pa-antracite)] py-24 text-[var(--pa-avorio)] sm:py-32"
        >
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
            <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <Sovratitolo scuro>Realizzazioni</Sovratitolo>
                <h2
                  id="titolo-realizzazioni"
                  className="text-balance font-serif text-4xl font-light tracking-[-0.01em] sm:text-5xl"
                >
                  Il dettaglio è il progetto.
                </h2>
              </div>
              <p className="max-w-sm rounded-xl border border-dashed border-[var(--pa-grigio-chiaro)]/60 p-4 text-sm leading-relaxed text-[var(--pa-grigio-chiaro)]">
                Segnaposto: qui andranno le fotografie dei lavori Ramirez Atelier. Nel prototipo la
                galleria mostra render dimostrativi.
              </p>
            </div>
            <ul className="grid grid-flow-dense auto-rows-[220px] grid-cols-2 gap-3 sm:auto-rows-[260px] sm:gap-4 lg:grid-cols-4 lg:auto-rows-[300px]">
              {GALLERIA.map((g) => (
                <li
                  key={g.immagine}
                  className={
                    g.formato === 'ampio'
                      ? 'col-span-2 row-span-2'
                      : g.formato === 'alto'
                        ? 'row-span-2'
                        : g.formato === 'largo'
                          ? 'col-span-2'
                          : ''
                  }
                >
                  <figure className="group relative h-full overflow-hidden rounded-[1rem] bg-black/20">
                    <Image
                      src={g.immagine}
                      alt={g.alt}
                      fill
                      sizes={
                        g.formato === 'ampio' || g.formato === 'largo'
                          ? '(min-width: 1024px) 50vw, 100vw'
                          : '(min-width: 1024px) 25vw, 50vw'
                      }
                      className="object-cover pa-zoom motion-safe:group-hover:scale-[1.03]"
                    />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10 text-xs uppercase tracking-[0.14em] text-[var(--pa-avorio)]">
                      {g.didascalia}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* METODO ------------------------------------------------------------ */}
        <section
          id="metodo"
          aria-labelledby="titolo-metodo"
          className="scroll-mt-24 py-24 sm:py-32"
        >
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
            <div className="mb-16 max-w-2xl">
              <Sovratitolo>Metodo</Sovratitolo>
              <h2
                id="titolo-metodo"
                className="text-balance font-serif text-4xl font-light tracking-[-0.01em] sm:text-5xl"
              >
                Dal primo incontro all’ultima regolazione.
                <DaValidare />
              </h2>
            </div>
            <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
              {METODO.map((fase, i) => (
                <li
                  key={fase.titolo}
                  className="relative border-t border-[var(--pa-linea-forte)] pt-6"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -top-px left-0 h-px w-10 bg-[var(--pa-bronzo)]"
                  />
                  <p
                    aria-hidden="true"
                    className="font-serif text-5xl font-light text-[var(--pa-rovere)]"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-5 text-lg font-medium">{fase.titolo}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--pa-grigio)]">
                    {fase.testo}
                  </p>
                </li>
              ))}
            </ol>
            <div className="mt-16">
              <Link
                href="/progetti"
                className={`group inline-flex h-13 items-center gap-3 rounded-full bg-[var(--pa-antracite)] px-7 text-sm font-medium text-[var(--pa-avorio)] pa-premi hover:bg-[var(--pa-noce)] ${focusChiaro}`}
              >
                Richiedi un progetto
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 pa-freccia motion-safe:group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </section>

        {/* PROFESSIONISTI ---------------------------------------------------- */}
        <section
          aria-labelledby="titolo-professionisti"
          className="bg-[var(--pa-noce)] text-[var(--pa-avorio)]"
        >
          <div className="mx-auto grid max-w-[1320px] lg:grid-cols-2">
            <div className="relative aspect-[4/3] lg:aspect-auto">
              <Image
                src={`${ASSET}/libreria-dettaglio.jpg`}
                alt="Dettaglio di una libreria in noce: ante con maniglie in bronzo e ripiani"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="px-5 py-20 sm:px-8 sm:py-24 lg:px-16 lg:py-32">
              <Sovratitolo scuro>Per architetti e interior designer</Sovratitolo>
              <h2
                id="titolo-professionisti"
                className="text-balance font-serif text-4xl font-light tracking-[-0.01em] sm:text-5xl"
              >
                Il vostro progetto, costruito con la stessa cura.
                <DaValidare scuro />
              </h2>
              <p className="mt-7 max-w-lg text-[0.95rem] leading-relaxed text-[var(--pa-avorio)]/80">
                Possiamo partire dai vostri disegni e lavorare insieme su materiali, dettagli e
                tempi di cantiere, con un solo interlocutore dal progetto al montaggio.
              </p>
              <ul className="mt-8 space-y-3 text-[0.95rem] text-[var(--pa-avorio)]/90">
                {[
                  'Confronto tecnico sui disegni',
                  'Campionature di materiali e finiture',
                  'Coordinamento con il cantiere',
                ].map((v) => (
                  <li key={v} className="flex items-center gap-3">
                    <span aria-hidden="true" className="h-px w-5 bg-[var(--pa-bronzo-chiaro)]" />
                    {v}
                  </li>
                ))}
              </ul>
              <a
                href={`mailto:${CONTATTI.email}?subject=${encodeURIComponent('Collaborazione professionale')}`}
                className={`mt-10 inline-flex h-13 items-center gap-3 rounded-full border border-[var(--pa-avorio)]/50 px-7 text-sm font-medium pa-premi hover:bg-[var(--pa-avorio)]/10 ${focusNoce}`}
              >
                <Mail aria-hidden="true" className="size-4" />
                Scriveteci per collaborare
              </a>
            </div>
          </div>
        </section>

        {/* CTA FINALE / CONTATTI --------------------------------------------- */}
        <section
          id="contatti"
          aria-labelledby="titolo-contatti"
          className="scroll-mt-24 py-24 sm:py-32"
        >
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
            <div className="grid gap-14 lg:grid-cols-[1.3fr_1fr] lg:gap-24">
              <div>
                <Sovratitolo>Parliamone</Sovratitolo>
                <h2
                  id="titolo-contatti"
                  className="text-balance font-serif text-5xl font-light leading-[1.05] tracking-[-0.02em] sm:text-6xl lg:text-7xl"
                >
                  Raccontaci il tuo spazio.
                </h2>
                <p className="mt-7 max-w-lg text-lg leading-relaxed text-[var(--pa-grigio)]">
                  Misure, foto, ispirazioni: anche un’idea abbozzata è un buon punto di partenza.
                </p>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <Link
                    href="/progetti"
                    className={`group inline-flex h-13 items-center justify-center gap-3 rounded-full bg-[var(--pa-antracite)] px-7 text-sm font-medium text-[var(--pa-avorio)] pa-premi hover:bg-[var(--pa-noce)] ${focusChiaro}`}
                  >
                    Richiedi un progetto
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 pa-freccia motion-safe:group-hover:translate-x-1"
                    />
                  </Link>
                  <a
                    href={`mailto:${CONTATTI.email}`}
                    className={`inline-flex h-13 items-center justify-center gap-3 rounded-full border border-[var(--pa-linea-forte)] px-7 text-sm font-medium pa-premi hover:border-[var(--pa-antracite)] ${focusChiaro}`}
                  >
                    <Mail aria-hidden="true" className="size-4" />
                    {CONTATTI.email}
                  </a>
                </div>
              </div>
              <div className="self-end border-t border-[var(--pa-linea-forte)] pt-6">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--pa-bronzo)]">
                  Laboratorio
                </p>
                <address className="mt-4 font-serif text-2xl font-light not-italic leading-snug">
                  {CONTATTI.indirizzo[0]}
                  <br />
                  {CONTATTI.indirizzo[1]}
                </address>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--pa-linea)] bg-[var(--pa-avorio-2)] px-5 py-12 sm:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <Image
            src="/logo-completo.png"
            alt="Ramirez Atelier — Arredi su misura"
            width={906}
            height={889}
            className="h-auto w-28"
          />
          <div className="flex flex-col gap-4 md:items-end">
            <nav aria-label="Informazioni legali">
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.14em] text-[var(--pa-grigio)]">
                {[
                  ['/privacy', 'Privacy'],
                  ['/cookie-policy', 'Cookie Policy'],
                  ['/termini-e-condizioni', 'Termini e condizioni'],
                ].map(([href, testo]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`inline-flex min-h-11 items-center rounded-sm hover:text-[var(--pa-antracite)] ${focusChiaro}`}
                    >
                      {testo}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="text-xs tracking-[0.06em] text-[var(--pa-grigio)]">
              {CONTATTI.ragioneSociale}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
