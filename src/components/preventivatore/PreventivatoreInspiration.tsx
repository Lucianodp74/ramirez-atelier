import Image from 'next/image';

const items = [
  { title: 'Armadio', image: '/progetti/armadio-cabina.jpg' },
  { title: 'Parete attrezzata', image: '/foto-elemento-parete-attrezzata.jpg' },
  { title: 'Madia / credenza', image: '/foto-elemento-credenza.jpg' },
  { title: 'Libreria', image: '/foto-elemento-libreria.jpg' },
  { title: 'Mobile TV', image: '/foto-elemento-mobile-tv.jpg' },
];

export function PreventivatoreInspiration() {
  return (
    <section aria-labelledby="ispirazione-preventivatore" className="mx-auto max-w-5xl px-4 pb-2 pt-6 sm:px-6 sm:pt-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Ramirez Atelier</p>
          <h2 id="ispirazione-preventivatore" className="mt-1 font-serif text-xl font-light sm:text-2xl">Lasciati ispirare dai nostri arredi.</h2>
        </div>
        <span className="hidden text-xs text-muted-foreground sm:inline">Esempi reali · su misura</span>
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto pb-2 scrollbar-none">
        {items.map((item) => (
          <div key={item.title} className="group relative min-w-[180px] snap-start overflow-hidden rounded-xl border border-border bg-card sm:min-w-[205px]">
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 180px, 205px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 pt-8">
                <p className="text-sm font-medium text-white">{item.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
