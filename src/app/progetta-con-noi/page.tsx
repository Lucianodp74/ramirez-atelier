import Link from 'next/link';
import { ArrowLeft, FileUp, Ruler, ShieldCheck } from 'lucide-react';
import { ModuloRichiestaProgetto } from './ModuloRichiestaProgetto';

export const metadata = {
  title: 'Progetta con noi | Ramirez Atelier',
  description:
    'Raccontaci il tuo progetto di arredo su misura e inviaci planimetrie, disegni e fotografie. Ti ricontatteremo.',
};

const passaggi = [
  {
    titolo: 'Raccontaci l’idea',
    testo: 'Descrivi l’ambiente, cosa vorresti realizzare e le esigenze più importanti.',
  },
  {
    titolo: 'Allega i documenti',
    testo: 'Puoi inviare planimetrie, disegni quotati, fotografie e PDF utili.',
  },
  {
    titolo: 'Ti ricontattiamo',
    testo: 'Esaminiamo il materiale e ti contattiamo per approfondire il progetto.',
  },
];

export default function ProgettaConNoiPage() {
  return (
    <main className="min-h-screen bg-[#F6F1E9] text-[#1E1B18]">
      <header className="border-b border-[#1E1B18]/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="font-serif text-xl tracking-wide">
            RAMIREZ ATELIER
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#5C554D] hover:text-[#8F4525]"
          >
            <ArrowLeft className="h-4 w-4" /> Torna al sito
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#8F4525]">Progetti su misura</p>
          <h1 className="mt-5 max-w-xl font-serif text-5xl font-light leading-[1.05] sm:text-6xl">
            Raccontaci il tuo progetto.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#5C554D]">
            Ogni spazio ha esigenze diverse. Spiegaci cosa immagini e condividi i documenti che hai
            già: valuteremo insieme come trasformare la tua idea in un arredo su misura.
          </p>

          <div className="mt-10 space-y-6">
            {passaggi.map((passaggio, index) => (
              <div key={passaggio.titolo} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#8F4525]/30 font-serif text-lg text-[#8F4525]">
                  {index + 1}
                </div>
                <div>
                  <h2 className="font-medium">{passaggio.titolo}</h2>
                  <p className="mt-1 max-w-md text-sm leading-6 text-[#5C554D]">
                    {passaggio.testo}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-3 border-t border-[#1E1B18]/10 pt-6 text-sm text-[#5C554D] sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <FileUp className="mt-0.5 h-5 w-5 shrink-0 text-[#8F4525]" />
              <span>Fino a 5 allegati, massimo 8 MB ciascuno</span>
            </div>
            <div className="flex items-start gap-3">
              <Ruler className="mt-0.5 h-5 w-5 shrink-0 text-[#8F4525]" />
              <span>Planimetrie, PDF, immagini e disegni tecnici</span>
            </div>
            <div className="flex items-start gap-3 sm:col-span-2">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8F4525]" />
              <span>
                I documenti vengono associati alla richiesta e non sono pubblicati nel sito.
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1E1B18]/10 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="font-serif text-3xl font-light">Parliamone</h2>
          <p className="mt-2 text-sm leading-6 text-[#5C554D]">
            Compila i campi e invia il materiale disponibile. Se non hai ancora planimetrie o
            disegni, puoi inviare la richiesta senza allegati.
          </p>
          <div className="mt-7">
            <ModuloRichiestaProgetto />
          </div>
          <p className="mt-5 text-xs leading-5 text-[#71685E]">
            L’invio è una richiesta di contatto, non un preventivo né un ordine. Puoi leggere l’{' '}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-[#8F4525]">
              informativa privacy
            </Link>
            .
          </p>
        </div>
      </section>

      <footer className="border-t border-[#1E1B18]/10 px-5 py-6 text-center text-xs text-[#71685E]">
        Ramirez Atelier · Arredi progettati intorno a te
      </footer>
    </main>
  );
}
