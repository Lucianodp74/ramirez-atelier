import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  famigliaPerCodice,
  richiedibile,
  trovaModelloVisibile,
} from '@/lib/catalogo-librerie/catalogo';
import {
  ingombroComposizione,
  opzioniDisponibili,
  riepilogoElementi,
} from '@/lib/catalogo-librerie/composizione';
import { ETICHETTE_FINITURA, ETICHETTE_MATERIALE } from '@/lib/catalogo-librerie/etichette';
import { anteprimaInternaConsentita } from '@/server/services/catalogo-librerie-accesso';
import {
  BadgeDimostrativo,
  BadgeStatoModello,
  CorniceLibrerie,
} from '@/components/librerie/CorniceLibrerie';
import { DisegnoLibreria } from '@/components/librerie/DisegnoLibreria';
import { Button } from '@/components/ui/button';

// L'anteprima interna dipende dal cookie di sessione: mai prerendering statico.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Librerie | Ramirez Atelier' };

function Voce({ etichetta, children }: { etichetta: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 border-b border-border py-3 text-sm">
      <dt className="text-muted-foreground">{etichetta}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

export default async function SchedaModelloPage({
  params,
}: {
  params: Promise<{ codice: string }>;
}) {
  const { codice } = await params;
  const anteprimaInterna = await anteprimaInternaConsentita();
  const modello = trovaModelloVisibile(codice, { anteprimaInterna });
  if (!modello) notFound();

  const famiglia = famigliaPerCodice(modello.famiglia);
  const ingombro = ingombroComposizione(modello.composizione);
  const elementi = riepilogoElementi(modello.composizione);
  const opzioni = opzioniDisponibili(modello.composizione);
  const bozzaInAnteprima = anteprimaInterna && modello.stato === 'BOZZA';
  const puoRichiedere = richiedibile(modello) || bozzaInAnteprima;
  const hrefPreventivatore = bozzaInAnteprima
    ? `/admin/catalogo/librerie/${modello.codice}/anteprima`
    : `/preventivatore?modello=${modello.codice}`;

  return (
    <CorniceLibrerie
      indietro={{ href: '/librerie', etichetta: 'Librerie' }}
      anteprimaInterna={anteprimaInterna}
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div>
          <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-border bg-card p-8">
            <DisegnoLibreria
              composizione={modello.composizione}
              titolo={modello.nome}
              className="h-full w-full"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Disegno schematico in proporzione. Non è una fotografia di un lavoro realizzato.
          </p>
          {modello.immagini.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {modello.immagini.map((immagine) => (
                <figure key={immagine.src}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border">
                    <Image
                      src={immagine.src}
                      alt={immagine.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 320px"
                      className="object-cover"
                    />
                  </div>
                  {immagine.tipo === 'DIMOSTRATIVA' && (
                    <figcaption className="mt-1 text-xs text-muted-foreground">
                      Immagine dimostrativa, non un lavoro realizzato.
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <BadgeStatoModello stato={modello.stato} />
            {modello.dimostrativo && <BadgeDimostrativo />}
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {modello.codice} · {famiglia.nome}
          </p>
          <h1 className="mt-2 font-serif text-4xl font-light tracking-tight sm:text-5xl">
            {modello.nome}
          </h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">{modello.descrizione}</p>
          {modello.dimostrativo && (
            <p className="mt-4 rounded-lg border border-dashed border-border p-3 text-xs leading-relaxed text-muted-foreground">
              Questo modello è un esempio dimostrativo della linea: misure e composizione non sono
              ancora state approvate da Ramirez Atelier.
            </p>
          )}

          <dl className="mt-6">
            <Voce etichetta="Dimensioni standard">
              L {ingombro.larghezzaCm} × H {ingombro.altezzaCm} × P {ingombro.profonditaCm} cm
            </Voce>
            <Voce etichetta="Materiali">
              {opzioni.materiali.map((m) => ETICHETTE_MATERIALE[m]).join(', ')}
            </Voce>
            <Voce etichetta="Finiture disponibili">
              {opzioni.finiture.map((f) => ETICHETTE_FINITURA[f]).join(', ')}
            </Voce>
            <Voce etichetta="Moduli verticali">{elementi.colonne}</Voce>
            <Voce etichetta="Vani aperti">{elementi.vaniAperti}</Voce>
            <Voce etichetta="Ripiani">{elementi.ripiani}</Voce>
            {elementi.basiConAnte > 0 && (
              <Voce etichetta="Basi con ante">
                {elementi.basiConAnte} ({elementi.ante} ante)
              </Voce>
            )}
            {elementi.cassettiere > 0 && (
              <Voce etichetta="Cassettiere">
                {elementi.cassettiere} ({elementi.cassetti} cassetti)
              </Voce>
            )}
            <Voce etichetta="Schienale">{elementi.schienale ? 'Sì' : 'No'}</Voce>
            {modello.componibile && (
              <Voce etichetta="Composizione">Affiancabile ad altri moduli</Voce>
            )}
            <Voce etichetta="Prezzo">Su preventivo</Voce>
          </dl>

          <div className="mt-8">
            {puoRichiedere ? (
              <Button size="lg" variant="accent" asChild>
                <Link href={hrefPreventivatore}>
                  {bozzaInAnteprima ? 'Prova nel Preventivatore' : 'Richiedi preventivo'}
                </Link>
              </Button>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  Questo modello non è al momento disponibile.
                </p>
                <Button className="mt-3" variant="outline" asChild>
                  <Link href="/preventivatore">Progetta una libreria su misura</Link>
                </Button>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Misure, materiali e finiture restano modificabili nel passaggio successivo.
            </p>
          </div>
        </div>
      </div>
    </CorniceLibrerie>
  );
}
