import Link from 'next/link';
import { notFound } from 'next/navigation';
import { richiediContesto } from '@/server/identity/contesto';
import {
  ETICHETTE_STATO,
  moduliPerPreventivatore,
  trovaModello,
} from '@/lib/catalogo-librerie/catalogo';
import { PreventivatoreModulare } from '@/components/preventivatore/PreventivatoreModulare';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Anteprima modello | Ramirez Atelier' };

/**
 * ANTEPRIMA INTERNA DI UN MODELLO NEL PREVENTIVATORE.
 *
 * Percorso dedicato all'area operativa per provare un modello del Catalogo
 * Librerie, anche in BOZZA, dentro il Preventivatore. Il link pubblico
 * `/preventivatore?modello=…` apre una bozza solo a chi ha già una sessione
 * operativa valida in quel browser, e in caso contrario ripiega in silenzio
 * sui valori predefiniti: qui invece l'accesso è esplicito.
 *
 *  - senza sessione il layout dell'area operativa rimanda al login;
 *  - senza permesso di lettura sul catalogo `richiediContesto` interrompe la
 *    pagina prima di caricare qualunque dato del modello;
 *  - lo stato del modello non cambia e nulla diventa pubblico.
 */
export default async function AnteprimaModelloPage({
  params,
}: {
  params: Promise<{ codice: string }>;
}) {
  // Il controllo precede ogni lettura del catalogo: nessun dato della bozza
  // viene calcolato per chi non è autorizzato.
  await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });

  const { codice } = await params;
  const modello = trovaModello(codice);
  const moduli = modello ? moduliPerPreventivatore(codice, { anteprimaInterna: true }) : null;
  if (!modello || !moduli) notFound();

  return (
    <div>
      <div className="border-b border-border bg-muted px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Anteprima interna · {ETICHETTE_STATO[modello.stato]}
            </p>
            <p className="text-sm font-medium">
              {modello.codice} · {modello.nome}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Composizione attesa nel Preventivatore, {moduli.length}{' '}
              {moduli.length === 1 ? 'modulo' : 'moduli'}:
            </p>
            <ul className="mt-1 text-xs text-muted-foreground">
              {moduli.map((modulo, indice) => (
                <li key={modulo.id}>
                  {indice + 1}. L {modulo.larghezzaCm} × H {modulo.altezzaCm} × P{' '}
                  {modulo.profonditaCm} cm · {modulo.ripiani ?? 0} ripiani
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted-foreground">
              Visibile solo all&apos;area operativa. Inviare la richiesta da qui crea una richiesta
              reale.
            </p>
          </div>
          <Link
            href="/admin/catalogo/librerie"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Catalogo Librerie
          </Link>
        </div>
      </div>
      <PreventivatoreModulare
        key={modello.codice}
        moduliIniziali={moduli}
        codiceModelloOrigine={modello.codice}
      />
    </div>
  );
}
