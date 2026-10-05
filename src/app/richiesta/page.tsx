import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Inizia il tuo progetto | Ramirez Atelier',
  description: 'Inizia il percorso per progettare il tuo arredo su misura con Ramirez Atelier.',
};

export default function RichiestaPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" aria-label="Ramirez Atelier">
          <Image src="/logo-completo.png" alt="Ramirez Atelier" width={320} height={178} priority className="h-auto w-[120px] sm:w-[145px]" />
        </Link>
        <Link href="/progetti" className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">Torna ai progetti</Link>
      </header>

      <section className="border-y border-border/70 bg-card px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 text-[10px] uppercase tracking-[0.28em] text-[#A6532B]">Il primo passo</p>
          <h1 className="font-serif text-5xl font-light leading-[1.02] tracking-tight sm:text-7xl">Inizia dal tuo spazio.</h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">Abbiamo costruito un percorso semplice: puoi configurare il tuo arredo, ottenere una prima stima indicativa e poi passare al confronto con il nostro atelier.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="accent" className="border-[#A6532B] bg-[#A6532B] px-8 text-white hover:bg-[#8F4525]" asChild>
              <Link href="/preventivatore">Apri il configuratore <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link href="/progetti" className="inline-flex items-center px-5 text-xs uppercase tracking-[0.16em] text-[#8F4525]">Guarda i progetti</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <div className="grid gap-8 md:grid-cols-3">
          <article className="border-t border-border pt-5">
            <p className="font-serif text-4xl font-light text-[#A6532B]">01</p>
            <h2 className="mt-4 text-lg font-medium">Configura</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Scegli tipologia, dimensioni, materiali e finiture nel configuratore Ramirez.</p>
          </article>
          <article className="border-t border-border pt-5">
            <p className="font-serif text-4xl font-light text-[#A6532B]">02</p>
            <h2 className="mt-4 text-lg font-medium">Ricevi una stima</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Ottieni una prima indicazione economica prima di definire il progetto esecutivo.</p>
          </article>
          <article className="border-t border-border pt-5">
            <p className="font-serif text-4xl font-light text-[#A6532B]">03</p>
            <h2 className="mt-4 text-lg font-medium">Parliamone</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Il risultato del configuratore diventa il punto di partenza per il lavoro con l'atelier.</p>
          </article>
        </div>
      </section>

      <section className="border-t border-border bg-card px-6 py-14 text-center">
        <Ruler className="mx-auto h-6 w-6 text-[#A6532B]" strokeWidth={1.3} />
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Il configuratore non sostituisce il progetto su misura: serve a trasformare la tua idea in una base concreta da discutere con Ramirez Atelier.</p>
      </section>
    </main>
  );
}
