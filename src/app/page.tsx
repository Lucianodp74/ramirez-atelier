import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StellaHero3D } from '@/components/StellaHero3D';

const projects = [
  { title: 'Living su misura', category: 'Arredi e pareti attrezzate', image: '/foto-elemento-altro-zona-giorno.jpg' },
  { title: 'Libreria e contenitori', category: 'Arredi personalizzati', image: '/foto-elemento-libreria.jpg' },
  { title: 'Parete attrezzata', category: 'Boiserie e living', image: '/foto-elemento-parete-attrezzata.jpg' },
  { title: 'Madia e dettagli', category: 'Complementi su misura', image: '/foto-elemento-credenza.jpg' },
];

const services = [
  ['01', 'Cucine su misura', 'Spazi progettati intorno alla persona, con materiali e dettagli scelti senza compromessi.'],
  ['02', 'Armadi e cabine', 'Volumi, organizzazione e finiture costruiti esattamente sulle misure dell’ambiente.'],
  ['03', 'Boiserie e pareti', 'Architetture in legno che integrano contenitori, porte, luce e tecnologia.'],
  ['04', 'Arredi personalizzati', 'Madie, librerie, mobili e complementi sviluppati a partire dalla tua idea.'],
];

const process = [
  ['01', 'Ascolto', 'Partiamo dallo spazio, dalle esigenze e da ciò che vuoi ottenere.'],
  ['02', 'Progettazione', 'Trasformiamo l’idea in proporzioni, materiali, finiture e dettagli.'],
  ['03', 'Produzione', 'Il progetto prende forma nel nostro atelier, con controllo diretto delle lavorazioni.'],
  ['04', 'Installazione', 'Seguiamo il montaggio fino all’ultimo dettaglio, perché il risultato conta quanto il progetto.'],
];

function Arrow() {
  return <span aria-hidden="true" className="text-[#8b6e4e] transition-transform duration-300 group-hover:translate-x-1">↗</span>;
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#8b6e4e]/15 bg-[#f7f3ed]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label="Ramirez Atelier" className="shrink-0">
            <Image src="/logo-completo.png" alt="Ramirez Atelier — Arredi su misura" width={320} height={178} priority className="h-auto w-[108px] sm:w-[122px]" />
          </Link>

          <nav className="hidden items-center gap-7 text-[11px] uppercase tracking-[0.18em] text-muted-foreground lg:flex">
            <Link href="#progetti" className="transition-colors hover:text-foreground">Progetti</Link>
            <Link href="#servizi" className="transition-colors hover:text-foreground">Servizi</Link>
            <Link href="#metodo" className="transition-colors hover:text-foreground">Metodo</Link>
            <Link href="#atelier" className="transition-colors hover:text-foreground">Atelier</Link>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/preventivatore" className="rounded-full border border-[#8b6e4e]/45 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.13em] text-[#725a40] transition hover:bg-[#8b6e4e] hover:text-white">
              Configura il tuo progetto
            </Link>
            <Link href="/admin/login" className="text-[10px] font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:text-[#8b6e4e]">
              Area falegname
            </Link>
            <Link href="/richiesta" className="group hidden items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground xl:flex">
              Parliamo del tuo progetto <Arrow />
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:hidden">
            <Link href="/preventivatore" className="rounded-full border border-[#8b6e4e]/45 px-3 py-2 text-[9px] font-medium uppercase tracking-[0.1em] text-[#725a40]">
              Configura
            </Link>
            <Link href="/admin/login" aria-label="Area falegname" className="text-[9px] font-medium uppercase tracking-[0.1em] text-foreground">
              Area falegname
            </Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-screen overflow-hidden border-b border-border pt-20">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-0 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <div className="relative z-10 py-14 sm:py-20 lg:py-24">
            <p className="mb-6 text-[10px] uppercase tracking-[0.28em] text-[#8b6e4e]">RAMIREZ ATELIER · FALEGNAMERIA SU MISURA</p>
            <h1 className="max-w-3xl font-serif text-[3.4rem] font-light leading-[0.94] tracking-[-0.035em] sm:text-6xl xl:text-[5.9rem]">
              La tua casa,
              <br />disegnata <em className="text-[#8b6e4e]">su misura.</em>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Progettiamo e realizziamo arredi in legno che entrano nell’architettura dello spazio. Dalla prima idea al montaggio, ogni dettaglio nasce intorno a te.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button size="lg" variant="accent" className="rounded-none bg-[#8b6e4e] px-7 text-white hover:bg-[#725a40]" asChild>
                <Link href="/preventivatore">Configura il tuo progetto</Link>
              </Button>
              <Link href="/richiesta" className="group flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]">
                Parliamo del progetto <Arrow />
              </Link>
            </div>
            <div className="mt-14 flex gap-10 border-t border-border pt-5 text-[10px] uppercase tracking-[0.17em] text-muted-foreground">
              <span>Dal 1987</span><span>100% su misura</span><span>Atelier artigiano</span>
            </div>
          </div>
          <div className="relative -mx-5 sm:-mx-8 lg:mx-0 lg:-mr-10">
            <StellaHero3D />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2">
            <Link href="/preventivatore" className="group rounded-[2px] border border-border bg-[#f7f3ed] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#8b6e4e]/50 sm:p-9">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#8b6e4e]">Per chi sta progettando casa</p>
                  <h2 className="mt-3 font-serif text-3xl font-light sm:text-4xl">Configura il tuo arredo.</h2>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Esplora il configuratore Ramirez Atelier, costruisci la tua composizione e parti da una prima stima indicativa.</p>
                </div>
                <span className="font-serif text-3xl text-[#8b6e4e] transition-transform duration-300 group-hover:translate-x-1">↗</span>
              </div>
            </Link>

            <Link href="/admin/login" className="group rounded-[2px] bg-[#2a2622] p-7 text-[#f7f3ed] transition duration-300 hover:-translate-y-1 sm:p-9">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#c4a887]">Per il professionista</p>
                  <h2 className="mt-3 font-serif text-3xl font-light sm:text-4xl">Area riservata falegname.</h2>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-[#cfc7bd]">Accedi al tuo ambiente professionale e lavora con il Preventivatore, le richieste, le composizioni, le BOM, il listino e le commesse.</p>
                </div>
                <span className="font-serif text-3xl text-[#c4a887] transition-transform duration-300 group-hover:translate-x-1">↗</span>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#f7f3ed]/15 pt-5 text-[9px] uppercase tracking-[0.16em] text-[#a9a097]">
                <span>Preventivatore</span><span>Composizioni</span><span>BOM</span><span>Commesse</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
          <div><p className="text-[10px] uppercase tracking-[0.28em] text-[#8b6e4e]">01 · Il manifesto</p></div>
          <div>
            <h2 className="max-w-4xl font-serif text-4xl font-light leading-tight tracking-[-0.025em] sm:text-5xl lg:text-6xl">Ogni spazio ha una misura.<br /><em className="text-[#8b6e4e]">Ogni progetto ha una storia.</em></h2>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">Ramirez Atelier nasce dall’incontro tra cultura del legno, progettazione e attenzione al dettaglio. Non proponiamo mobili da scegliere: costruiamo soluzioni che appartengono davvero allo spazio in cui vivranno.</p>
          </div>
        </div>
      </section>

      <section id="progetti" className="border-y border-border bg-card px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div><p className="text-[10px] uppercase tracking-[0.28em] text-[#8b6e4e]">02 · Realizzazioni</p><h2 className="mt-4 font-serif text-4xl font-light sm:text-5xl">Progetti che diventano spazio.</h2></div>
            <Link href="/progetti" className="group hidden items-center gap-2 text-[10px] uppercase tracking-[0.18em] sm:flex">Tutti i progetti <Arrow /></Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {projects.map((project, index) => (
              <Link key={project.title} href="/progetti" className={`group block ${index % 3 === 1 ? 'md:mt-16' : ''}`}>
                <div className="relative aspect-[4/3] overflow-hidden bg-muted"><Image src={project.image} alt={project.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-700 group-hover:scale-[1.035]" /></div>
                <div className="flex items-start justify-between border-b border-border py-5"><div><p className="text-[10px] uppercase tracking-[0.18em] text-[#8b6e4e]">{project.category}</p><h3 className="mt-2 font-serif text-2xl font-light">{project.title}</h3></div><Arrow /></div>
              </Link>
            ))}
          </div>
          <Link href="/progetti" className="mt-8 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] sm:hidden">Tutti i progetti <Arrow /></Link>
        </div>
      </section>

      <section id="servizi" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-24">
            <div><p className="text-[10px] uppercase tracking-[0.28em] text-[#8b6e4e]">03 · Cosa realizziamo</p><h2 className="mt-4 max-w-md font-serif text-4xl font-light leading-tight sm:text-5xl">Su misura significa partire dallo spazio.</h2></div>
            <div className="divide-y divide-border border-y border-border">{services.map(([number, title, description]) => <div key={number} className="grid gap-4 py-7 sm:grid-cols-[70px_0.8fr_1.2fr] sm:items-start"><span className="font-serif text-2xl text-[#8b6e4e]">{number}</span><h3 className="font-serif text-2xl font-light">{title}</h3><p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p></div>)}</div>
          </div>
        </div>
      </section>

      <section id="metodo" className="bg-[#2a2622] px-5 py-24 text-[#f7f3ed] sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
            <div><p className="text-[10px] uppercase tracking-[0.28em] text-[#c4a887]">04 · Il metodo Ramirez</p><h2 className="mt-4 font-serif text-4xl font-light leading-tight sm:text-5xl">Dall’idea al dettaglio finale.</h2></div>
            <div className="grid gap-px bg-[#f7f3ed]/15 sm:grid-cols-2">{process.map(([number, title, description]) => <div key={number} className="bg-[#2a2622] p-7 sm:min-h-[190px]"><span className="text-[10px] tracking-[0.2em] text-[#c4a887]">{number}</span><h3 className="mt-8 font-serif text-2xl font-light">{title}</h3><p className="mt-3 text-sm leading-6 text-[#cfc7bd]">{description}</p></div>)}</div>
          </div>
        </div>
      </section>

      <section id="atelier" className="border-b border-border px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div className="relative aspect-[4/3] overflow-hidden"><Image src="/foto-laboratorio.jpg" alt="Il laboratorio Ramirez Atelier" fill sizes="(max-width: 1024px) 100vw, 65vw" className="object-cover" /></div>
          <div><p className="text-[10px] uppercase tracking-[0.28em] text-[#8b6e4e]">05 · L’atelier</p><h2 className="mt-4 font-serif text-4xl font-light leading-tight sm:text-5xl">La materia passa dalle nostre mani.</h2><p className="mt-7 text-lg leading-8 text-muted-foreground">Dietro ogni progetto c’è un luogo reale: il nostro laboratorio. Qui il disegno diventa materia, la materia diventa dettaglio e il dettaglio diventa parte della tua casa.</p><div className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"><span>Lavorazione artigianale</span><span>Controllo dei dettagli</span><span>Materiali selezionati</span><span>Montaggio su misura</span></div></div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div><p className="text-[10px] uppercase tracking-[0.28em] text-[#8b6e4e]">06 · La materia</p><h2 className="mt-4 font-serif text-4xl font-light sm:text-5xl">Materiali scelti per durare.</h2><p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">Legni, laccati, essenze e finiture diventano parte del progetto. La scelta nasce sempre dall’equilibrio tra estetica, uso e ambiente.</p></div>
          <div className="grid grid-cols-3 gap-3 sm:gap-5"><div className="relative aspect-[3/4] overflow-hidden"><Image src="/foto-venature-legno.jpg" alt="Venature naturali del legno" fill sizes="33vw" className="object-cover" /></div><div className="relative mt-8 aspect-[3/4] overflow-hidden sm:mt-14"><Image src="/foto-finiture.jpg" alt="Campioni di finiture Ramirez Atelier" fill sizes="33vw" className="object-cover" /></div><div className="relative aspect-[3/4] overflow-hidden"><Image src="/foto-elemento-mobile-tv.jpg" alt="Dettaglio di un arredo su misura" fill sizes="33vw" className="object-cover" /></div></div>
        </div>
      </section>

      <section className="border-t border-border bg-card px-5 py-24 text-center sm:px-8 sm:py-32 lg:px-10">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#8b6e4e]">07 · Iniziamo</p>
        <h2 className="mx-auto mt-5 max-w-4xl font-serif text-5xl font-light leading-[1.02] tracking-[-0.025em] sm:text-6xl lg:text-7xl">Hai uno spazio da trasformare?</h2>
        <p className="mx-auto mt-7 max-w-xl text-lg leading-7 text-muted-foreground">Raccontaci cosa hai in mente. Puoi partire dal configuratore oppure inviarci direttamente la tua richiesta.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-4"><Button size="lg" variant="accent" className="rounded-none bg-[#8b6e4e] px-8 text-white hover:bg-[#725a40]" asChild><Link href="/preventivatore">Apri il configuratore</Link></Button><Button size="lg" variant="outline" className="rounded-none border-[#8b6e4e]/40 px-8" asChild><Link href="/richiesta">Invia una richiesta</Link></Button></div>
      </section>

      <footer className="bg-[#2a2622] px-5 py-12 text-[#f7f3ed] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2"><p className="font-serif text-3xl font-light">RAMIREZ ATELIER</p><p className="mt-3 max-w-sm text-sm leading-6 text-[#cfc7bd]">Falegnameria artigiana su misura. Progettiamo e realizziamo arredi che entrano nell’architettura della casa.</p></div>
            <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#c4a887]">Navigazione</p><div className="mt-4 grid gap-2 text-sm text-[#cfc7bd]"><Link href="/progetti">Progetti</Link><Link href="#servizi">Servizi</Link><Link href="#metodo">Metodo</Link><Link href="#atelier">Atelier</Link></div></div>
            <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#c4a887]">Accessi</p><div className="mt-4 grid gap-2 text-sm text-[#cfc7bd]"><Link href="/preventivatore">Configuratore</Link><Link href="/richiesta">Richiedi un preventivo</Link><Link href="/admin/login">Area falegname</Link></div></div>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-[#f7f3ed]/15 pt-6 text-[10px] uppercase tracking-[0.14em] text-[#9f978e] sm:flex-row sm:items-center sm:justify-between"><span>ITALDESIGN DI RAMIREZ ROBERTO · P.IVA 04951160755</span><div className="flex gap-4"><Link href="/privacy">Privacy</Link><Link href="/cookie-policy">Cookie</Link><Link href="/termini-e-condizioni">Termini</Link></div></div>
        </div>
      </footer>
    </main>
  );
}
