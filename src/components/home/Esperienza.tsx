'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowRight, Move3d, Pause, Play, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE, FINITURE, TAPPE, type IdFinitura } from './contenuti';

// three.js e React Three Fiber arrivano solo quando la visita sta per entrare nello schermo
const Scena = dynamic(() => import('./Scena'), { ssr: false });

const focusChiaro =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F1E9]';
const focusScuro =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6F1E9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E1B18]';
const premi =
  'transition-[background-color,border-color,color,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:active:scale-[0.97]';

// Comparsa della scheda con @starting-style: una transizione, quindi interrompibile se si scorre in fretta.
// Con movimento ridotto resta solo la dissolvenza.
const STILI = `
html{scroll-padding-top:4.5rem;overflow-anchor:none}
.scheda-tappa{transition:opacity 260ms cubic-bezier(0.23,1,0.32,1),transform 260ms cubic-bezier(0.23,1,0.32,1)}
@starting-style{.scheda-tappa{opacity:0;transform:translateY(8px)}}
@media (prefers-reduced-motion:reduce){.scheda-tappa{transition:opacity 200ms ease}@starting-style{.scheda-tappa{transform:none}}}
`;

function webglDisponibile() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

function Apertura() {
  const video = useRef<HTMLVideoElement>(null);
  const [inPausa, setInPausa] = useState(true);
  const [finito, setFinito] = useState(false);
  const [ridotto, setRidotto] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const rid = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setRidotto(rid);
    if (!rid) v.play().catch(() => {});
    const oss = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting && !v.paused) v.pause();
      },
      { threshold: 0.2 },
    );
    oss.observe(v);
    return () => oss.disconnect();
  }, []);

  return (
    <section aria-labelledby="titolo-apertura" className="relative bg-[#1E1B18] text-[#F6F1E9]">
      <div className="relative aspect-[4/3] md:absolute md:inset-0 md:aspect-auto">
        <video
          ref={video}
          muted
          playsInline
          preload="metadata"
          poster={`${BASE}/img/apertura-poster.jpg`}
          aria-hidden="true"
          onPlay={() => {
            setInPausa(false);
            setFinito(false);
          }}
          onPause={() => setInPausa(true)}
          onEnded={() => setFinito(true)}
          className="h-full w-full object-cover object-[70%_50%]"
        >
          <source src={`${BASE}/video/apertura.webm`} type="video/webm" />
          <source src={`${BASE}/video/apertura.mp4`} type="video/mp4" />
        </video>
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden bg-gradient-to-r from-[#1E1B18]/85 via-[#1E1B18]/30 to-transparent md:block"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#1E1B18] to-transparent md:hidden"
        />
      </div>
      <div className="relative mx-auto max-w-[1320px] px-5 pb-16 sm:px-10 md:flex md:min-h-svh md:items-center md:py-32">
        <div className="max-w-[40rem]">
          <p className="mb-5 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.24em] text-[#C9A46A]">
            <span aria-hidden="true" className="h-px w-8 bg-current" />
            Falegnameria artigiana · dal 1987
          </p>
          <h1
            id="titolo-apertura"
            className="font-serif text-[2.9rem] font-light leading-[1.02] tracking-[-0.02em] sm:text-6xl lg:text-[5.4rem]"
          >
            Il legno prende forma.
            <span className="block italic text-[#C9A46A]">Il tuo spazio diventa unico.</span>
          </h1>
          <p className="mt-8 max-w-[32rem] text-lg leading-relaxed text-[#F6F1E9]/80">
            Progettiamo e costruiamo arredi su misura nel nostro laboratorio di Borgagne di
            Melendugno. Entra nello showroom: cinque arredi, da vicino.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href="#showroom"
              className={`inline-flex h-13 items-center justify-center gap-3 rounded-full bg-[#F6F1E9] px-7 text-sm font-medium text-[#1E1B18] hover:bg-[#EDE5D8] ${premi} ${focusScuro}`}
            >
              Entra nello showroom 3D
              <ArrowDown aria-hidden="true" className="size-4" />
            </a>
            <Link
              href="/progetti"
              className={`inline-flex h-13 items-center justify-center rounded-full border border-[#F6F1E9]/45 px-7 text-sm font-medium hover:bg-[#F6F1E9]/10 ${premi} ${focusScuro}`}
            >
              Inizia il tuo progetto
            </Link>
          </div>
        </div>
      </div>
      {!ridotto && (
        <button
          type="button"
          onClick={() => {
            const v = video.current;
            if (!v) return;
            if (v.paused) {
              if (v.ended) v.currentTime = 0;
              void v.play();
            } else v.pause();
          }}
          className={`absolute bottom-6 right-5 inline-flex h-11 items-center gap-2 rounded-full border border-[#F6F1E9]/35 bg-[#1E1B18]/55 px-4 text-xs font-medium uppercase tracking-[0.1em] backdrop-blur sm:right-10 ${premi} ${focusScuro}`}
        >
          {inPausa ? (
            <Play aria-hidden="true" className="size-3.5" />
          ) : (
            <Pause aria-hidden="true" className="size-3.5" />
          )}
          {inPausa ? (finito ? 'Rivedi' : 'Riproduci') : 'Pausa'}
        </button>
      )}
    </section>
  );
}

export function Esperienza() {
  const visita = useRef<HTMLElement>(null);
  const segnaposti = useRef<(HTMLDivElement | null)[]>([]);
  const [tappa, setTappa] = useState(0);
  const [finiture, setFiniture] = useState<Record<number, IdFinitura>>({});
  const [led, setLed] = useState(true);
  const [libera, setLibera] = useState(false);
  const [ridotto, setRidotto] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [montata, setMontata] = useState(false);
  const [attiva, setAttiva] = useState(false);
  const [pronta, setPronta] = useState(false);

  useEffect(() => {
    setRidotto(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setWebgl(webglDisponibile());
    const el = visita.current;
    if (!el) return;
    // montaggio differito (600 px prima) e rendering sospeso fuori schermo
    const vicino = new IntersectionObserver(([e]) => e.isIntersecting && setMontata(true), {
      rootMargin: '600px 0px',
    });
    const visibile = new IntersectionObserver(([e]) => setAttiva(e.isIntersecting));
    vicino.observe(el);
    visibile.observe(el);
    const capitoli = new IntersectionObserver(
      (voci) => {
        for (const v of voci)
          if (v.isIntersecting) setTappa(Number((v.target as HTMLElement).dataset.indice));
      },
      { threshold: 0.55 },
    );
    segnaposti.current.forEach((s) => s && capitoli.observe(s));
    return () => {
      vicino.disconnect();
      visibile.disconnect();
      capitoli.disconnect();
    };
  }, []);

  const vaiA = useCallback(
    (i: number) => {
      const n = Math.max(0, Math.min(TAPPE.length - 1, i));
      // posizione esatta della tappa: inizio della sezione + scostamento del suo segnaposto
      const sezione = visita.current;
      const segnaposto = segnaposti.current[n];
      if (sezione && segnaposto) {
        const top = sezione.getBoundingClientRect().top + window.scrollY + segnaposto.offsetTop;
        window.scrollTo({ top, behavior: ridotto ? 'auto' : 'smooth' });
      }
      setTappa(n);
    },
    [ridotto],
  );
  const onPronta = useCallback(() => setPronta(true), []);

  const t = TAPPE[tappa];
  const finituraAttiva = t.arredo !== null ? finiture[t.arredo] : undefined;

  return (
    <div className="bg-[#F6F1E9] text-[#1E1B18] antialiased">
      <header className="sticky top-0 z-40 border-b border-[#1E1B18]/10 bg-[#F6F1E9]/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-5 sm:h-[72px] sm:px-10">
          <Link
            href="/"
            aria-label="Ramirez Atelier"
            className={`flex min-h-11 items-center gap-3 rounded-sm ${focusChiaro}`}
          >
            <Image
              src="/logo-monogramma.png"
              alt=""
              width={666}
              height={487}
              className="h-9 w-auto"
              priority
            />
            <span className="font-serif text-[1.05rem] whitespace-nowrap max-[400px]:sr-only">
              Ramirez Atelier
            </span>
          </Link>
          <Link
            href="/progetti"
            className={`inline-flex h-11 items-center whitespace-nowrap rounded-full bg-[#1E1B18] px-5 text-sm font-medium text-[#F6F1E9] hover:bg-[#5B3F2C] ${premi} ${focusChiaro}`}
          >
            Inizia il tuo progetto
          </Link>
        </div>
      </header>

      <main>
        <Apertura />

        {/* VISITA 3D: scena fissa, i capitoli scorrono */}
        <section
          id="showroom"
          ref={visita}
          aria-label="Showroom 3D"
          className="relative"
          style={{ height: `${TAPPE.length * 100}svh` }}
        >
          <div className="sticky top-0 h-svh overflow-hidden">
            {webgl === false ? (
              <Image
                key={t.id}
                src={t.immagine}
                alt={t.alt}
                fill
                sizes="100vw"
                className="object-cover"
              />
            ) : (
              <>
                <Image
                  src={`${BASE}/img/libreria.jpg`}
                  alt=""
                  fill
                  sizes="100vw"
                  className={`object-cover transition-opacity duration-500 ${pronta ? 'opacity-0' : 'opacity-100'}`}
                />
                {montata && webgl && (
                  <div className="absolute inset-0">
                    <Scena
                      tappa={t.arredo}
                      finiture={finiture}
                      led={led}
                      esplorazioneLibera={libera}
                      movimentoRidotto={ridotto}
                      attiva={attiva}
                      onPronta={onPronta}
                    />
                  </div>
                )}
                {!pronta && montata && (
                  <p
                    role="status"
                    className="absolute left-5 top-5 rounded-full bg-[#1E1B18]/80 px-4 py-2 text-xs text-[#F6F1E9]"
                  >
                    Caricamento dello showroom…
                  </p>
                )}
              </>
            )}

            {/* scheda del capitolo */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-8 md:inset-y-0 md:left-0 md:right-auto md:flex md:w-[30rem] md:items-end lg:p-10">
              <div className="pointer-events-auto rounded-[1.25rem] bg-[#F6F1E9]/95 p-6 shadow-[0_30px_80px_-30px_rgba(30,27,24,0.5)] backdrop-blur sm:p-7">
                {/* solo il contenuto si rinnova a ogni tappa: i pulsanti restano, il focus non si perde */}
                <div key={t.id} className="scheda-tappa" aria-live="polite">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#7A5A32]">
                    {String(tappa + 1).padStart(2, '0')} / {String(TAPPE.length).padStart(2, '0')} ·{' '}
                    {t.sovratitolo}
                  </p>
                  <h2 className="mt-3 font-serif text-3xl font-light leading-tight sm:text-4xl">
                    {t.titolo}
                  </h2>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-[#5E564C]">{t.testo}</p>

                  {t.finiture && t.arredo !== null && webgl && (
                    <fieldset className="mt-5">
                      <legend className="mb-2 text-xs uppercase tracking-[0.16em] text-[#5E564C]">
                        Finitura
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {t.finiture.map((f) => {
                          const attivo = (finituraAttiva ?? t.finiture![0]) === f;
                          return (
                            <button
                              key={f}
                              type="button"
                              aria-pressed={attivo}
                              onClick={() =>
                                setFiniture((p) => ({ ...p, [t.arredo as number]: f }))
                              }
                              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm ${premi} ${focusChiaro} ${attivo ? 'border-[#1E1B18] bg-[#1E1B18] text-[#F6F1E9]' : 'border-[#1E1B18]/25 hover:border-[#1E1B18]'}`}
                            >
                              <span
                                aria-hidden="true"
                                className="size-4 rounded-full border border-black/10"
                                style={{ background: FINITURE[f].campione }}
                              />
                              {FINITURE[f].nome}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}
                  {t.led && webgl && (
                    <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-between gap-4 text-sm">
                      Luce LED
                      <input
                        type="checkbox"
                        role="switch"
                        checked={led}
                        onChange={(e) => setLed(e.target.checked)}
                        className={`size-5 accent-[#7A5A32] ${focusChiaro}`}
                      />
                    </label>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#1E1B18]/10 pt-5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => vaiA(tappa - 1)}
                      disabled={tappa === 0}
                      aria-label="Tappa precedente"
                      className={`inline-flex size-11 items-center justify-center rounded-full border border-[#1E1B18]/25 disabled:opacity-40 ${premi} ${focusChiaro}`}
                    >
                      <ArrowLeft aria-hidden="true" className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => vaiA(tappa + 1)}
                      disabled={tappa === TAPPE.length - 1}
                      aria-label="Tappa successiva"
                      className={`inline-flex size-11 items-center justify-center rounded-full bg-[#1E1B18] text-[#F6F1E9] disabled:opacity-40 ${premi} ${focusChiaro}`}
                    >
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                  {webgl && (
                    <button
                      type="button"
                      aria-pressed={libera}
                      onClick={() => setLibera((v) => !v)}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-[#5E564C] hover:text-[#1E1B18] ${premi} ${focusChiaro}`}
                    >
                      {libera ? (
                        <RotateCcw aria-hidden="true" className="size-4" />
                      ) : (
                        <Move3d aria-hidden="true" className="size-4" />
                      )}
                      {libera ? 'Torna alla visita' : 'Esplora liberamente'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* indice dei capitoli */}
            <nav
              aria-label="Tappe dello showroom"
              className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-1 md:flex"
            >
              {TAPPE.map((x, i) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => vaiA(i)}
                  aria-current={i === tappa ? 'step' : undefined}
                  aria-label={x.titolo}
                  className={`group flex size-11 items-center justify-center rounded-full ${focusChiaro}`}
                >
                  <span
                    aria-hidden="true"
                    className={`block size-3 rounded-full transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${i === tappa ? 'bg-[#1E1B18]' : 'scale-[0.66] bg-[#1E1B18]/35 group-hover:bg-[#1E1B18]/70'}`}
                  />
                </button>
              ))}
            </nav>
          </div>

          {/* segnaposti invisibili che guidano i capitoli con lo scorrimento */}
          {TAPPE.map((x, i) => (
            <div
              key={x.id}
              ref={(el) => {
                segnaposti.current[i] = el;
              }}
              data-indice={i}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 h-svh"
              style={{ top: `${i * 100}svh` }}
            />
          ))}
        </section>

        <section
          id="contatti"
          aria-labelledby="titolo-contatti"
          className="bg-[#1E1B18] px-5 py-24 text-[#F6F1E9] sm:px-10 sm:py-32"
        >
          <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <h2
                id="titolo-contatti"
                className="font-serif text-5xl font-light leading-[1.05] sm:text-6xl"
              >
                Raccontaci il tuo spazio.
              </h2>
              <p className="mt-6 max-w-lg text-lg text-[#F6F1E9]/75">
                Misure, foto, ispirazioni: anche un’idea abbozzata è un buon punto di partenza.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/progetti"
                  className={`inline-flex h-13 items-center justify-center rounded-full bg-[#F6F1E9] px-7 text-sm font-medium text-[#1E1B18] ${premi} ${focusScuro}`}
                >
                  Inizia il tuo progetto
                </Link>
              </div>
            </div>
            <address className="self-end border-t border-[#F6F1E9]/20 pt-6 font-serif text-2xl font-light not-italic leading-snug">
              Via S. Andrea, Zona Artigianale
              <br />
              Borgagne di Melendugno, 73026
              <br />
              <a
                href="mailto:info@ramirezatelier.it"
                className={`mt-3 inline-flex min-h-11 items-center font-sans text-base underline underline-offset-4 ${focusScuro}`}
              >
                info@ramirezatelier.it
              </a>
            </address>
          </div>
        </section>
      </main>

      {/* stessi collegamenti della home precedente: legali, P.IVA e accesso all'area riservata */}
      <footer className="bg-[#EDE5D8] px-5 py-10 text-[#5E564C] sm:px-10">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex items-end gap-5">
              <Image
                src="/logo-completo.png"
                alt="Ramirez Atelier — Arredi su misura"
                width={906}
                height={889}
                className="h-auto w-24"
              />
              <p className="text-xs uppercase tracking-[0.2em] text-[#7A5A32]">
                Arredi su misura · Falegnameria artigiana dal 1987
              </p>
            </div>
            <nav
              aria-label="Informazioni legali"
              className="flex flex-wrap gap-x-6 text-xs uppercase tracking-[0.12em]"
            >
              {[
                ['/privacy', 'Privacy'],
                ['/cookie-policy', 'Cookie Policy'],
                ['/termini-e-condizioni', 'Termini e condizioni'],
              ].map(([h, l]) => (
                <Link
                  key={h}
                  href={h}
                  className={`inline-flex min-h-11 items-center ${focusChiaro}`}
                >
                  {l}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#1E1B18]/10 pt-4 text-xs">
            <p className="tracking-[0.06em]">ITALDESIGN DI RAMIREZ ROBERTO · P.IVA 04951160755</p>
            <Link
              href="/admin/login"
              className={`inline-flex min-h-11 items-center uppercase tracking-[0.14em] text-[#7A5A32] hover:text-[#1E1B18] ${focusChiaro}`}
            >
              Accedi all&apos;area riservata
            </Link>
          </div>
        </div>
      </footer>
      <style>{STILI}</style>
    </div>
  );
}
