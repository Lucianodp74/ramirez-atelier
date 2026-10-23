import Link from 'next/link';
import { richiediContesto } from '@/server/identity/contesto';
import {
  ETICHETTE_STATO,
  MODELLI_LIBRERIE,
  famigliaPerCodice,
} from '@/lib/catalogo-librerie/catalogo';
import { ingombroComposizione, validaComposizione } from '@/lib/catalogo-librerie/composizione';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function CatalogoLibreriePage() {
  await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/admin/catalogo" className="text-sm text-muted-foreground hover:underline">
        ← Catalogo Tecnico
      </Link>
      <h1 className="mb-2 mt-2 text-2xl font-semibold tracking-tight">Catalogo Librerie</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Modelli di libreria e loro stato. Solo i modelli approvati o non disponibili compaiono nella
        pagina pubblica; le bozze sono visibili solo da qui, in anteprima. Nessun prezzo è salvato
        nel catalogo: la stima è sempre calcolata dal Preventivatore.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Come si cambia lo stato di un modello
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            In questa prima versione modelli e stato sono definiti nel codice
            (src/lib/catalogo-librerie/catalogo.ts) e cambiano con una modifica revisionata. La
            gestione da questa pagina richiede una tabella dedicata: v. docs/catalogo-librerie.md.
          </p>
        </CardContent>
      </Card>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 p-4">
        <div>
          <p className="font-medium">Componi una nuova parete</p>
          <p className="text-sm text-muted-foreground">
            Crea una variante da una bozza, verifica le misure ed esporta il JSON da revisionare.
          </p>
        </div>
        <Link
          href="/admin/catalogo/librerie/editor"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Apri editor
        </Link>
      </div>

      <div className="space-y-3">
        {MODELLI_LIBRERIE.map((modello) => {
          const ingombro = ingombroComposizione(modello.composizione);
          const errori = validaComposizione(modello.composizione);
          return (
            <div
              key={modello.codice}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {modello.codice} · {famigliaPerCodice(modello.famiglia).nome}
                </p>
                <p className="font-medium">{modello.nome}</p>
                <p className="text-sm text-muted-foreground">
                  L {ingombro.larghezzaCm} × H {ingombro.altezzaCm} × P {ingombro.profonditaCm} cm
                  {' · '}
                  {ETICHETTE_STATO[modello.stato]}
                  {modello.dimostrativo ? ' · esempio dimostrativo' : ''}
                </p>
                {errori.length > 0 && (
                  <p className="mt-1 text-sm text-destructive">
                    Composizione non valida per il Preventivatore: {errori.join(' ')}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Link
                  href={`/librerie/${modello.codice}`}
                  className="text-sm text-primary hover:underline"
                >
                  Apri la scheda
                </Link>
                {errori.length === 0 && modello.stato !== 'NON_DISPONIBILE' && (
                  <Link
                    href={`/admin/catalogo/librerie/${modello.codice}/anteprima`}
                    className="text-sm text-primary hover:underline"
                  >
                    Prova nel Preventivatore
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
