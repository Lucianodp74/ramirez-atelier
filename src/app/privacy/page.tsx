import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Ramirez Atelier',
  description: 'Informativa sul trattamento dei dati personali di Ramirez Atelier ai sensi dell’art. 13 del GDPR.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-20">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Ramirez Atelier</Link>
        <article className="mt-12 space-y-10">
          <header>
            <p className="text-xs uppercase tracking-[0.25em] text-[#A6532B]">Privacy</p>
            <h1 className="mt-4 font-serif text-4xl font-light sm:text-6xl">Informativa sulla privacy</h1>
            <p className="mt-5 text-sm text-muted-foreground">Informativa ai sensi dell’art. 13 del Regolamento (UE) 2016/679.</p>
          </header>
          <section className="space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-2xl text-foreground">1. Titolare del trattamento</h2>
            <p><strong className="text-foreground">ITALDESIGN DI RAMIREZ ROBERTO</strong>, P.IVA 04951160755, con sede presso il laboratorio in Via S. Andrea, Zona Artigianale, Borgagne di Melendugno, 73026.</p>
            <p>Per richieste relative alla protezione dei dati personali: <a className="text-[#8F4525] underline-offset-4 hover:underline" href="mailto:info@ramirezatelier.it">info@ramirezatelier.it</a>.</p>
          </section>
          <section className="space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-2xl text-foreground">2. Dati trattati e finalità</h2>
            <p>Il sito può trattare i dati forniti volontariamente dall’utente, ad esempio quando richiede informazioni, avvia un progetto o utilizza le funzionalità del sito. I dati sono trattati per rispondere alle richieste, gestire il rapporto con l’utente, fornire i servizi richiesti e adempiere agli obblighi di legge.</p>
            <p>Possono inoltre essere trattati dati tecnici necessari al funzionamento e alla sicurezza del sito, secondo quanto indicato nella Cookie Policy.</p>
          </section>
          <section className="space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-2xl text-foreground">3. Base giuridica</h2>
            <p>Il trattamento può basarsi sull’esecuzione di misure precontrattuali o contrattuali, sull’adempimento di obblighi di legge, sul legittimo interesse del titolare o, quando richiesto, sul consenso dell’interessato.</p>
          </section>
          <section className="space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-2xl text-foreground">4. Conservazione e destinatari</h2>
            <p>I dati sono conservati per il tempo necessario alle finalità per cui sono raccolti e, quando applicabile, per i periodi richiesti dalla legge. Possono avere accesso ai dati fornitori tecnici che operano per conto del titolare, nei limiti necessari alla fornitura dei servizi.</p>
          </section>
          <section className="space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-2xl text-foreground">5. Diritti dell’interessato</h2>
            <p>L’interessato può esercitare i diritti previsti dagli artt. 15–22 GDPR, inclusi accesso, rettifica, cancellazione, limitazione, opposizione e portabilità quando applicabile, nonché revocare il consenso ove costituisca la base del trattamento.</p>
            <p>Le richieste possono essere inviate a <a className="text-[#8F4525] underline-offset-4 hover:underline" href="mailto:info@ramirezatelier.it">info@ramirezatelier.it</a>. Resta salvo il diritto di proporre reclamo al Garante per la protezione dei dati personali.</p>
          </section>
          <section className="space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-2xl text-foreground">6. Aggiornamenti</h2>
            <p>La presente informativa può essere aggiornata in caso di modifiche al sito, ai trattamenti effettuati o alla normativa applicabile.</p>
          </section>
        </article>
      </div>
    </main>
  );
}
