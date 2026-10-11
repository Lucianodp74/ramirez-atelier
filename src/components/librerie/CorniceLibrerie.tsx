import Link from 'next/link';
import { ETICHETTE_STATO, type StatoModello } from '@/lib/catalogo-librerie/catalogo';
import { Badge } from '@/components/ui/badge';

/** Cornice comune alle pagine pubbliche del Catalogo Librerie. */
export function CorniceLibrerie({
  indietro,
  anteprimaInterna,
  children,
}: {
  indietro: { href: string; etichetta: string };
  anteprimaInterna: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {anteprimaInterna && (
        <div className="border-b border-border bg-muted px-6 py-2 text-center text-xs text-muted-foreground">
          Anteprima interna: stai vedendo anche i modelli in bozza, non visibili al pubblico.
        </div>
      )}
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <Link
          href={indietro.href}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {indietro.etichetta}
        </Link>
        {children}
      </div>
      <footer className="border-t border-border bg-card px-6 py-10 text-center">
        <p className="font-serif text-2xl tracking-tight">RAMIREZ ATELIER</p>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#A6532B]">
          Arredi su misura · Falegnameria artigiana dal 1987
        </p>
        <nav
          aria-label="Informazioni legali"
          className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
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
      </footer>
    </main>
  );
}

export function BadgeStatoModello({ stato }: { stato: StatoModello }) {
  return (
    <Badge variant={stato === 'APPROVATO' ? 'accent' : 'outline'}>{ETICHETTE_STATO[stato]}</Badge>
  );
}

export function BadgeDimostrativo() {
  return <Badge variant="outline">Esempio dimostrativo</Badge>;
}
