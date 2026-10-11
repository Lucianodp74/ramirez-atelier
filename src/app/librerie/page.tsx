import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FAMIGLIE_LIBRERIE, modelliVisibili } from '@/lib/catalogo-librerie/catalogo';
import { ingombroComposizione } from '@/lib/catalogo-librerie/composizione';
import { anteprimaInternaConsentita } from '@/server/services/catalogo-librerie-accesso';
import {
  BadgeDimostrativo,
  BadgeStatoModello,
  CorniceLibrerie,
} from '@/components/librerie/CorniceLibrerie';
import { DisegnoLibreria } from '@/components/librerie/DisegnoLibreria';

// L'anteprima interna dipende dal cookie di sessione: mai prerendering statico.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Librerie | Ramirez Atelier',
  description: 'Le linee di librerie su misura di Ramirez Atelier.',
};

export default async function LibreriePage() {
  const anteprimaInterna = await anteprimaInternaConsentita();
  const modelli = modelliVisibili({ anteprimaInterna });

  return (
    <CorniceLibrerie
      indietro={{ href: '/', etichetta: 'Ramirez Atelier' }}
      anteprimaInterna={anteprimaInterna}
    >
      <header className="mx-auto mt-12 max-w-3xl text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-[#A6532B]">Collezione</p>
        <h1 className="mt-4 font-serif text-4xl font-light tracking-tight sm:text-6xl">Librerie</h1>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Cinque linee progettuali da cui partire. Ogni libreria viene poi adattata alle misure
          della stanza, ai materiali e alle finiture scelti insieme.
        </p>
      </header>

      <div className="mt-14 space-y-14">
        {FAMIGLIE_LIBRERIE.map((famiglia) => {
          const modelliFamiglia = modelli.filter((m) => m.famiglia === famiglia.codice);
          return (
            <section key={famiglia.codice} aria-labelledby={`famiglia-${famiglia.codice}`}>
              <div className="border-b border-border pb-4">
                <h2
                  id={`famiglia-${famiglia.codice}`}
                  className="font-serif text-2xl font-light sm:text-3xl"
                >
                  {famiglia.nome}
                </h2>
                <p className="mt-1 text-sm text-[#8F4525]">{famiglia.sintesi}</p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {famiglia.descrizione}
                </p>
              </div>

              {modelliFamiglia.length === 0 ? (
                <p className="mt-5 text-sm text-muted-foreground">
                  Modelli in definizione.{' '}
                  <Link href="/preventivatore" className="text-[#8F4525] hover:underline">
                    Progetta la tua libreria su misura
                  </Link>
                  .
                </p>
              ) : (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {modelliFamiglia.map((modello) => {
                    const ingombro = ingombroComposizione(modello.composizione);
                    return (
                      <Link
                        key={modello.codice}
                        href={`/librerie/${modello.codice}`}
                        className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent"
                      >
                        <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-muted/50 p-4">
                          <DisegnoLibreria
                            composizione={modello.composizione}
                            titolo={modello.nome}
                            className="h-full w-full"
                          />
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <BadgeStatoModello stato={modello.stato} />
                          {modello.dimostrativo && <BadgeDimostrativo />}
                        </div>
                        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          {modello.codice}
                        </p>
                        <h3 className="mt-1 font-serif text-xl">{modello.nome}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          L {ingombro.larghezzaCm} × H {ingombro.altezzaCm} × P{' '}
                          {ingombro.profonditaCm} cm
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm text-[#8F4525]">
                          Scheda del modello
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </CorniceLibrerie>
  );
}
