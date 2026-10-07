import Link from 'next/link';
import { ArrowRight, Ruler } from 'lucide-react';

function LegalLinks() {
  return (
    <div className="mt-7 border-t border-border pt-5">
      <nav
        aria-label="Informazioni legali"
        className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
      >
        <Link href="/privacy" className="transition-colors hover:text-foreground">
          Privacy
        </Link>
        <Link href="/cookie-policy" className="transition-colors hover:text-foreground">
          Cookie Policy
        </Link>
        <Link href="/termini-e-condizioni" className="transition-colors hover:text-foreground">
          Termini e condizioni
        </Link>
      </nav>
      <p className="mt-3 text-center text-[10px] tracking-[0.08em] text-muted-foreground">
        ITALDESIGN DI RAMIREZ ROBERTO · P.IVA 04951160755
      </p>
    </div>
  );
}

export default function ProgettiPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-[72vh] max-w-5xl items-center px-6 py-16 sm:py-24">
        <div className="w-full rounded-sm border border-border bg-card p-8 sm:p-12 lg:p-16">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Ramirez Atelier
          </Link>

          <div className="mx-auto mt-16 max-w-3xl text-center sm:mt-20">
            <div className="mb-5 flex items-center justify-center gap-3 text-primary">
              <Ruler className="h-5 w-5" strokeWidth={1.5} />
              <p className="text-xs uppercase tracking-[0.25em]">Parti dalle tue misure</p>
            </div>

            <h1 className="font-serif text-4xl font-light tracking-tight sm:text-6xl">
              Configura il tuo arredo su misura.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Scegli moduli, dimensioni, materiale e finitura. Componi il tuo progetto e ricevi
              una prima stima indicativa, senza impegno.
            </p>

            <div className="mt-9">
              <Link
                href="/preventivatore"
                className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Apri il configuratore
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Stima indicativa · senza impegno
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card px-6 py-10">
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-serif text-2xl tracking-tight text-foreground">RAMIREZ ATELIER</p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#A6532B]">
            Arredi su misura · Falegnameria artigiana dal 1987
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Via S. Andrea, Zona Artigianale · Borgagne di Melendugno, 73026
          </p>
          <a
            href="mailto:info@ramirezatelier.it"
            className="mt-2 inline-block text-sm text-[#8F4525] underline-offset-4 hover:underline"
          >
            info@ramirezatelier.it
          </a>
          <LegalLinks />
        </div>
      </footer>
    </main>
  );
}
