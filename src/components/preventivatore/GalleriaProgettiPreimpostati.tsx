import Image from 'next/image';
import Link from 'next/link';
import { idTenantRamirezAtelier } from '@/server/identity/tenant-corrente';
import { progettiPreimpostatiPubblicati } from '@/server/services/progetto-preimpostato-service';

/**
 * COMPOSIZIONI / CATALOGO V1 - galleria pubblica dei progetti preimpostati
 * pubblicati. Ogni card porta al Preventivatore con il preset selezionato
 * (`/preventivatore?preset=<id>`); il caricamento/validazione del preset
 * avviene lato server in `PreventivatorePage`, non qui - questo componente
 * mostra solo i metadati (nome, categoria, descrizione, immagine), mai i
 * moduli o un prezzo.
 */
export async function GalleriaProgettiPreimpostati() {
  const tenantId = await idTenantRamirezAtelier();
  const progetti = await progettiPreimpostatiPubblicati(tenantId);
  if (progetti.length === 0) return null;

  return (
    <section aria-labelledby="progetti-preimpostati" className="mx-auto max-w-5xl px-4 pb-2 pt-6 sm:px-6 sm:pt-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Ramirez Atelier</p>
          <h2 id="progetti-preimpostati" className="mt-1 font-serif text-xl font-light sm:text-2xl">Parti da un progetto già pronto.</h2>
        </div>
        <span className="hidden text-xs text-muted-foreground sm:inline">Punto di partenza · sempre modificabile</span>
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto pb-2 scrollbar-none">
        {progetti.map((progetto) => (
          <Link
            key={progetto.id}
            href={`/preventivatore?preset=${encodeURIComponent(progetto.id)}`}
            className="group relative min-w-[200px] snap-start overflow-hidden rounded-xl border border-border bg-card sm:min-w-[230px]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              {progetto.immagine ? (
                <Image
                  src={progetto.immagine}
                  alt={progetto.nome}
                  fill
                  sizes="(max-width: 640px) 200px, 230px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full items-end justify-between p-3 opacity-80">
                  <span className="h-10 w-8 rounded-sm border-2 border-current" />
                  <span className="h-16 w-8 rounded-sm border-2 border-current" />
                  <span className="h-12 w-8 rounded-sm border-2 border-current" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
                <p className="text-[10px] uppercase tracking-wide text-white/80">{progetto.categoria}</p>
                <p className="text-sm font-medium text-white">{progetto.nome}</p>
              </div>
            </div>
            {progetto.descrizione && (
              <p className="p-3 text-xs leading-5 text-muted-foreground">{progetto.descrizione}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
