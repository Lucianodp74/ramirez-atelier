import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { StellaHero3D } from '@/components/StellaHero3D';

const fasi = [
  { numero: '01', titolo: 'Racconta il tuo spazio', descrizione: 'Materiali, dimensioni indicative, ispirazioni — anche solo abbozzate. Nessun modulo da compilare, una conversazione da iniziare.' },
  { numero: '02', titolo: 'Ricevi una prima stima', descrizione: 'In pochi minuti, non giorni: una fascia di prezzo indicativa, onesta fin dall’inizio, prima ancora di parlare con noi.' },
  { numero: '03', titolo: 'Incontriamoci di persona', descrizione: 'Un sopralluogo, i dettagli definiti insieme, e il tuo progetto prende la forma esatta che avevi immaginato.' },
];

function LegalLinks() {
  return (
    <div className="mt-7 border-t border-border pt-5 text-center sm:flex sm:items-center sm:justify-between sm:gap-6 sm:text-left">
      <nav aria-label="Informazioni legali" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:justify-start">
        <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
        <Link href="/cookie-policy" className="transition-colors hover:text-foreground">Cookie Policy</Link>
        <Link href="/termini-e-condizioni" className="transition-colors hover:text-foreground">Termini e condizioni</Link>
      </nav>
      <p className="mt-4 text-[10px] tracking-[0.08em] text-muted-foreground sm:mt-0">ITALDESIGN DI RAMIREZ ROBERTO · P.IVA 04951160755</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="mx-auto flex min-h-[160px] max-w-6xl items-center justify-center px-6 py-8 sm:min-h-[190px] sm:py-10">
        <Link href="/" aria-label="Ramirez Atelier" className="block">
          <Image src="/logo-completo.png" alt="Ramirez Atelier — Arredi su misura" width={320} height={178} priority className="h-auto w-[250px] sm:w-[320px]" />
        </Link>
      </nav>

      <section className="relative overflow-hidden border-y border-border/70 bg-[radial-gradient(circle_at_78%_48%,rgba(166,83,43,0.10),transparent_34%),linear-gradient(135deg,rgba(166,83,43,0.05),transparent_42%)]">
        <div className="mx-auto grid max-w-7xl items-center gap-4 px-6 lg:grid-cols-[0.78fr_1.22fr] lg:px-10">
          <div className="relative z-10 py-16 sm:py-20 lg:py-24">
            <p className="mb-6 text-xs uppercase tracking-[0.25em] text-[#A6532B]">Falegnameria artigiana — dal 1987</p>
            <p className="mb-5 font-serif text-sm italic text-[#A6532B]">STELLA · Madia manifesto</p>
            <h1 className="text-balance font-serif text-[2.8rem] font-light leading-[1.04] tracking-tight sm:text-6xl xl:text-7xl">La tua casa,<br />disegnata a mano,<br /><span className="italic text-[#A6532B]">costruita per durare.</span></h1>
            <p className="mt-7 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">Un oggetto di falegnameria contemporanea, esplorabile in 3D. Materiali, proporzioni e dettagli nascono dal dialogo tra progetto e materia.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button size="lg" variant="accent" className="border-[#A6532B] bg-[#A6532B] text-white shadow-[0_10px_30px_rgba(166,83,43,0.22)] hover:bg-[#8F4525]" asChild><Link href="/progetti">Inizia il tuo progetto</Link></Button>
              <span className="text-xs uppercase tracking-[0.18em] text-[#8F4525]">Modello interattivo</span>
            </div>
          </div>
          <div className="-mx-6 sm:-mx-8 lg:mx-0"><StellaHero3D /></div>
        </div>
      </section>

      <section className="border-b border-border bg-card py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6"><div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background shadow-[0_20px_60px_rgba(42,38,34,0.08)]"><Image src="/foto-finiture.jpg" alt="Ventaglio di finiture e materiali disponibili - legni, laccati, pietre" width={1536} height={1024} className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]" /></div>
          <div className="max-w-xl"><p className="mb-4 text-xs uppercase tracking-[0.25em] text-[#A6532B]">La materia</p><h2 className="font-serif text-4xl font-light tracking-tight sm:text-5xl">Ogni progetto comincia da qui.</h2><p className="mt-6 text-lg leading-relaxed text-muted-foreground">Rovere o noce, laccato opaco o pietra naturale — decine di finiture e colorazioni personalizzabili, per un progetto che sia davvero il tuo. Le vedrai tutte, una a una, nel momento in cui inizierai a costruire la tua idea con noi.</p><div className="mt-8 h-px w-16 bg-[#A6532B]" aria-hidden="true" /></div>
        </div></div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 sm:py-28"><div className="mb-14 text-center sm:mb-16"><p className="mb-4 text-xs uppercase tracking-[0.25em] text-[#A6532B]">Come funziona</p><h2 className="font-serif text-4xl font-light tracking-tight sm:text-5xl">Non un modulo. Una consulenza.</h2></div><div className="grid gap-10 sm:grid-cols-3 sm:gap-8">{fasi.map((fase, index) => <div key={fase.numero} className="relative sm:px-3">{index < fasi.length - 1 && <span className="absolute left-[calc(100%+0.5rem)] top-7 hidden h-px w-[calc(100%-1rem)] bg-border sm:block" aria-hidden="true" />}<p className="font-serif text-5xl font-light text-[#A6532B]">{fase.numero}</p><h3 className="mt-4 text-lg font-medium">{fase.titolo}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{fase.descrizione}</p></div>)}</div></section>

      <section className="relative overflow-hidden border-t border-border px-6 py-24 text-center sm:py-32"><Image src="/foto-laboratorio.jpg" alt="" fill className="object-cover opacity-[0.34]" aria-hidden="true" /><div className="absolute inset-0 bg-card/35" aria-hidden="true" /><div className="relative"><p className="mb-4 text-xs uppercase tracking-[0.25em] text-[#A6532B]">Dal laboratorio a casa tua</p><h2 className="mx-auto max-w-2xl text-balance font-serif text-4xl font-light tracking-tight sm:text-5xl">Il legno aspetta solo la tua idea.</h2><div className="mt-10"><Button size="lg" variant="accent" className="border-[#A6532B] bg-[#A6532B] text-white shadow-[0_10px_30px_rgba(166,83,43,0.22)] hover:bg-[#8F4525]" asChild><Link href="/progetti">Inizia il tuo progetto</Link></Button></div></div></section>

      <footer className="border-t border-border bg-card px-6 py-8 sm:py-10"><div className="mx-auto max-w-6xl"><div className="grid gap-8 sm:grid-cols-[1.1fr_1fr] sm:items-end"><div><p className="font-serif text-2xl tracking-tight text-foreground">RAMIREZ ATELIER</p><p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#A6532B]">Arredi su misura · Falegnameria artigiana dal 1987</p></div><div className="sm:text-right"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Laboratorio</p><address className="mt-3 not-italic leading-relaxed text-foreground">Via S. Andrea, Zona Artigianale<br />Borgagne di Melendugno, 73026</address><a href="mailto:info@ramirezatelier.it" className="mt-2 inline-block text-[#8F4525] underline-offset-4 transition-colors hover:text-[#A6532B] hover:underline">info@ramirezatelier.it</a></div></div><LegalLinks /><div className="mt-5 flex justify-end text-xs uppercase tracking-[0.14em] text-muted-foreground"><Link href="/admin/login" className="text-[#8F4525] transition-opacity hover:opacity-60">Accedi all&apos;area riservata</Link></div></div></footer>
    </main>
  );
}
