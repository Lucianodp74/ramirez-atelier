import Link from 'next/link';

export const metadata = {
  title: 'Termini e condizioni — Ramirez Atelier',
  description: 'Termini di utilizzo del sito Ramirez Atelier.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-20">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Ramirez Atelier</Link>
        <article className="mt-12 space-y-10">
          <header>
            <p className="text-xs uppercase tracking-[0.25em] text-[#A6532B]">Informazioni</p>
            <h1 className="mt-4 font-serif text-4xl font-light sm:text-6xl">Termini e condizioni</h1>
          </header>
          <section className="space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-2xl text-foreground">1. Titolare e utilizzo del sito</h2>
            <p>Il sito Ramirez Atelier è riferito a <strong className="text-foreground">ITALDESIGN DI RAMIREZ ROBERTO</strong>, P.IVA 04951160755, e presenta servizi, lavorazioni e percorsi per la progettazione di arredi su misura.</p>
            <p>I contenuti hanno finalità informative e non costituiscono, salvo diversa indicazione, un’offerta contrattuale vincolante.</p>
          </section>
          <section className="space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-2xl text-foreground">2. Progetti e stime</h2>
            <p>Le configurazioni, le immagini, le misure indicative e le eventuali stime visualizzate online hanno carattere preliminare. Materiali, dimensioni, lavorazioni, tempi e prezzi definitivi vengono concordati con il cliente sulla base del progetto effettivamente approvato.</p>
          </section>
          <section className="space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-2xl text-foreground">3. Proprietà dei contenuti</h2>
            <p>Testi, fotografie, marchi, modelli tridimensionali, grafiche e altri contenuti del sito non possono essere riprodotti o utilizzati senza autorizzazione, salvo i casi consentiti dalla legge.</p>
          </section>
          <section className="space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-2xl text-foreground">4. Contatti</h2>
            <p>Per informazioni sul sito o sui progetti: <a className="text-[#8F4525] underline-offset-4 hover:underline" href="mailto:info@ramirezatelier.it">info@ramirezatelier.it</a>.</p>
          </section>
        </article>
      </div>
    </main>
  );
}
