import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy — Ramirez Atelier',
  description: 'Informazioni sui cookie e sugli strumenti di tracciamento utilizzati dal sito Ramirez Atelier.',
};

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-20">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Ramirez Atelier</Link>
        <article className="mt-12 space-y-10">
          <header>
            <p className="text-xs uppercase tracking-[0.25em] text-[#A6532B]">Cookie</p>
            <h1 className="mt-4 font-serif text-4xl font-light sm:text-6xl">Cookie Policy</h1>
            <p className="mt-5 text-sm text-muted-foreground">Informazioni sui cookie e sugli altri strumenti di tracciamento.</p>
          </header>

          <section className="space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-2xl text-foreground">1. Cosa sono i cookie</h2>
            <p>I cookie sono piccoli file o identificatori che un sito può utilizzare per consentire il funzionamento delle pagine, ricordare preferenze o, in presenza dei relativi strumenti, effettuare analisi e profilazione.</p>
          </section>

          <section className="space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-2xl text-foreground">2. Cookie e strumenti utilizzati</h2>
            <p>Il sito è progettato per utilizzare, come base, gli strumenti strettamente necessari al funzionamento, alla sicurezza e alla gestione tecnica delle funzionalità richieste dall’utente.</p>
            <p>Eventuali servizi di analisi, marketing, social, video, mappe o altri servizi di terze parti che introducano strumenti di tracciamento dovranno essere configurati in modo da rispettare le preferenze dell’utente e, quando necessario, essere attivati solo dopo il consenso.</p>
          </section>

          <section className="space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-2xl text-foreground">3. Gestione delle preferenze</h2>
            <p>Quando saranno presenti cookie o altri strumenti per i quali è richiesto il consenso, il sito dovrà presentare un’apposita informativa e consentire all’utente di accettare, rifiutare o gestire le categorie interessate. Le preferenze dovranno poter essere modificate successivamente in modo semplice.</p>
          </section>

          <section className="space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-2xl text-foreground">4. Impostazioni del browser</h2>
            <p>L’utente può anche gestire i cookie tramite le impostazioni del proprio browser. La disabilitazione dei cookie tecnici può tuttavia compromettere alcune funzionalità del sito.</p>
          </section>

          <section className="space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-2xl text-foreground">5. Verifica prima della pubblicazione</h2>
            <p><strong className="text-foreground">Prima della pubblicazione definitiva è necessario effettuare una scansione del sito in produzione e aggiornare questa pagina con l’elenco effettivo dei cookie, dei servizi di terze parti, delle finalità e dei tempi di conservazione.</strong></p>
            <p>Questo controllo è particolarmente importante se verranno aggiunti Analytics, Meta Pixel, YouTube, Google Maps, strumenti pubblicitari o altri servizi esterni.</p>
          </section>
        </article>
      </div>
    </main>
  );
}
