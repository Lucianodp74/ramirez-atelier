'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FORMATO_CODICE_MODELLO, MODELLI_LIBRERIE } from '@/lib/catalogo-librerie/catalogo';
import {
  ingombroComposizione,
  opzioniDisponibili,
  riepilogoElementi,
  validaComposizione,
  type ColonnaComposizione,
  type ComposizioneLibreria,
  type TipoVano,
  type VanoComposizione,
} from '@/lib/catalogo-librerie/composizione';

const modelliBozza = MODELLI_LIBRERIE.filter((modello) => modello.stato === 'BOZZA');
const modelloIniziale = modelliBozza[0];

// Fallback puramente strutturale: consente di eseguire gli hook React anche
// quando il catalogo non contiene alcun modello. La schermata mostra poi il
// messaggio dedicato e non permette di modificare/esportare questa struttura.
const COMPOSIZIONE_VUOTA: ComposizioneLibreria = {
  profonditaCm: 35,
  schienale: true,
  materiale: 'TRUCIOLARE',
  finitura: 'MELAMINICO',
  colonne: [],
};

function copia<T>(valore: T): T {
  return JSON.parse(JSON.stringify(valore)) as T;
}

function idColonna(): string {
  return `col-${crypto.randomUUID().slice(0, 8)}`;
}

const vanoVuoto = (): VanoComposizione => ({
  tipo: 'VANO_APERTO',
  altezzaCm: 40,
  ripiani: 0,
});

export function EditorComposizioneParete() {
  const [modelloCodice, setModelloCodice] = useState(modelloIniziale?.codice ?? '');
  const [nome, setNome] = useState('Nuova composizione parete');
  const [composizione, setComposizione] = useState<ComposizioneLibreria>(() =>
    copia(modelloIniziale?.composizione ?? COMPOSIZIONE_VUOTA),
  );
  const [codice, setCodice] = useState('LIB-NEW-01');
  const [messaggio, setMessaggio] = useState('');

  const errori = useMemo(() => validaComposizione(composizione), [composizione]);
  const ingombro = useMemo(() => ingombroComposizione(composizione), [composizione]);
  const riepilogo = useMemo(() => riepilogoElementi(composizione), [composizione]);
  const opzioni = useMemo(() => opzioniDisponibili(composizione), [composizione]);
  const codiceValido =
    FORMATO_CODICE_MODELLO.test(codice) &&
    !MODELLI_LIBRERIE.some((modello) => modello.codice === codice);
  const json = useMemo(
    () =>
      JSON.stringify(
        {
          codice,
          nome: nome.trim() || 'Composizione senza nome',
          famiglia: 'PARETE',
          descrizione: 'Composizione preparata con l’editor interno.',
          stato: 'BOZZA',
          dimostrativo: true,
          componibile: true,
          immagini: [],
          composizione,
          validazionePreventivatore: {
            valida: errori.length === 0,
            errori,
          },
          avvertenza:
            'Bozza dimostrativa non certificata per produzione. Non usare per distinta, costo o lavorazione senza revisione tecnica.',
        },
        null,
        2,
      ),
    [codice, nome, composizione, errori],
  );

  if (!modelloIniziale) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Editor pareti attrezzate</h1>
        <p className="text-sm text-muted-foreground">
          Non ci sono modelli in stato Bozza da cui partire. Crea o riporta almeno un modello in
          Bozza nel Catalogo Librerie, poi riapri l’editor.
        </p>
      </div>
    );
  }

  function aggiornaComposizione(
    aggiornamento: (corrente: ComposizioneLibreria) => ComposizioneLibreria,
  ) {
    setComposizione((corrente) => aggiornamento(copia(corrente)));
    setMessaggio('');
  }

  function cambiaModello(nuovoCodice: string) {
    const modello = modelliBozza.find((elemento) => elemento.codice === nuovoCodice);
    if (!modello) return;
    setModelloCodice(nuovoCodice);
    setComposizione(copia(modello.composizione));
    setNome(`${modello.nome} — variante`);
    setMessaggio('');
  }

  function aggiornaColonna(
    indice: number,
    aggiornamento: (colonna: ColonnaComposizione) => ColonnaComposizione,
  ) {
    aggiornaComposizione((corrente) => ({
      ...corrente,
      colonne: corrente.colonne.map((colonna, i) =>
        i === indice ? aggiornamento(colonna) : colonna,
      ),
    }));
  }

  function aggiornaVano(
    colonnaIndice: number,
    vanoIndice: number,
    aggiornamento: (vano: VanoComposizione) => VanoComposizione,
  ) {
    aggiornaColonna(colonnaIndice, (colonna) => ({
      ...colonna,
      vani: colonna.vani.map((vano, i) => (i === vanoIndice ? aggiornamento(vano) : vano)),
    }));
  }

  function cambiaTipoVano(colonnaIndice: number, vanoIndice: number, tipo: TipoVano) {
    aggiornaVano(colonnaIndice, vanoIndice, (vano) => {
      if (tipo === 'CASSETTI') {
        return { tipo, altezzaCm: vano.altezzaCm, cassetti: 3 };
      }
      if (tipo === 'BASE_ANTE') {
        return { tipo, altezzaCm: vano.altezzaCm, ante: 2, ripiani: 0 };
      }
      return { tipo, altezzaCm: vano.altezzaCm, ripiani: 0 };
    });
  }

  function spostaColonna(indice: number, direzione: -1 | 1) {
    aggiornaComposizione((corrente) => {
      const colonne = [...corrente.colonne];
      const destinazione = indice + direzione;
      [colonne[indice], colonne[destinazione]] = [colonne[destinazione], colonne[indice]];
      return { ...corrente, colonne };
    });
  }

  function spostaVano(colonnaIndice: number, vanoIndice: number, direzione: -1 | 1) {
    aggiornaColonna(colonnaIndice, (colonna) => {
      const vani = [...colonna.vani];
      const destinazione = vanoIndice + direzione;
      [vani[vanoIndice], vani[destinazione]] = [vani[destinazione], vani[vanoIndice]];
      return { ...colonna, vani };
    });
  }

  async function copiaJson() {
    try {
      await navigator.clipboard.writeText(json);
      setMessaggio(
        'JSON copiato. Il modello resta una bozza: per inserirlo nel catalogo serve una PR ' +
          'revisionata.',
      );
    } catch {
      setMessaggio('Seleziona e copia manualmente il JSON generato qui sotto.');
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Area operativa · Solo bozza
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Editor pareti attrezzate</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Componi colonne e vani riutilizzando la validazione del Preventivatore. Questa versione
          non salva nel database, non modifica prezzi e non pubblica modelli.
        </p>
      </header>

      <section className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Modello di partenza</span>
          <select
            className="h-11 w-full rounded-md border border-input bg-background px-3"
            value={modelloCodice}
            onChange={(event) => cambiaModello(event.target.value)}
          >
            {modelliBozza.map((modello) => (
              <option key={modello.codice} value={modello.codice}>
                {modello.codice} · {modello.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Nome della variante</span>
          <Input value={nome} onChange={(event) => setNome(event.target.value)} maxLength={100} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Codice proposto</span>
          <Input
            value={codice}
            onChange={(event) =>
              setCodice(
                event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9-]/g, '')
                  .slice(0, 20),
              )
            }
            maxLength={20}
          />
          <span className="text-xs text-muted-foreground">
            Formato richiesto: LIB-XXX-NN. Il codice non viene riservato.
          </span>
          {!FORMATO_CODICE_MODELLO.test(codice) && (
            <span role="alert" className="block text-xs text-destructive">
              Codice non valido: usa il formato LIB-XXX-NN.
            </span>
          )}
          {FORMATO_CODICE_MODELLO.test(codice) &&
            MODELLI_LIBRERIE.some((modello) => modello.codice === codice) && (
              <span role="alert" className="block text-xs text-destructive">
                Questo codice è già presente nel catalogo.
              </span>
            )}
        </label>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Larghezza totale', ingombro.larghezzaCm, 'cm'],
          ['Altezza massima', ingombro.altezzaCm, 'cm'],
          ['Profondità', ingombro.profonditaCm, 'cm'],
          ['Colonne / vani aperti', `${riepilogo.colonne} / ${riepilogo.vaniAperti}`, ''],
        ].map(([etichetta, valore, unita]) => (
          <div key={String(etichetta)} className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">{etichetta}</p>
            <p className="mt-1 text-xl font-semibold">
              {valore} {unita}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Struttura della parete</h2>
            <p className="text-sm text-muted-foreground">
              Le colonne sono da sinistra a destra; i vani dal basso verso l’alto.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              aggiornaComposizione((corrente) => ({
                ...corrente,
                colonne: [
                  ...corrente.colonne,
                  { id: idColonna(), larghezzaCm: 60, vani: [vanoVuoto()] },
                ],
              }))
            }
          >
            Aggiungi colonna
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {composizione.colonne.map((colonna, colonnaIndice) => (
            <article
              key={colonna.id}
              className="space-y-3 rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">Colonna {colonnaIndice + 1}</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={colonnaIndice === 0}
                    onClick={() => spostaColonna(colonnaIndice, -1)}
                  >
                    ←
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={colonnaIndice === composizione.colonne.length - 1}
                    onClick={() => spostaColonna(colonnaIndice, 1)}
                  >
                    →
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={composizione.colonne.length === 1}
                    onClick={() =>
                      aggiornaComposizione((corrente) => ({
                        ...corrente,
                        colonne: corrente.colonne.filter((_, i) => i !== colonnaIndice),
                      }))
                    }
                  >
                    Rimuovi
                  </Button>
                </div>
              </div>
              <label className="block space-y-1 text-sm">
                <span>Larghezza colonna (cm)</span>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={colonna.larghezzaCm}
                  onChange={(event) =>
                    aggiornaColonna(colonnaIndice, (corrente) => ({
                      ...corrente,
                      larghezzaCm: Number(event.target.value),
                    }))
                  }
                />
              </label>

              <div className="space-y-3 border-l-2 border-border pl-3">
                {colonna.vani.map((vano, vanoIndice) => (
                  <div
                    key={`${colonna.id}-vano-${vanoIndice}`}
                    className="space-y-3 rounded-md bg-muted/40 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Vano {vanoIndice + 1}</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={vanoIndice === 0}
                          onClick={() => spostaVano(colonnaIndice, vanoIndice, -1)}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={vanoIndice === colonna.vani.length - 1}
                          onClick={() => spostaVano(colonnaIndice, vanoIndice, 1)}
                        >
                          ↓
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={colonna.vani.length === 1}
                          onClick={() =>
                            aggiornaColonna(colonnaIndice, (corrente) => ({
                              ...corrente,
                              vani: corrente.vani.filter((_, i) => i !== vanoIndice),
                            }))
                          }
                        >
                          Elimina
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1 text-sm">
                        <span>Tipo vano</span>
                        <select
                          className="h-11 w-full rounded-md border border-input bg-background px-3"
                          value={vano.tipo}
                          onChange={(event) =>
                            cambiaTipoVano(
                              colonnaIndice,
                              vanoIndice,
                              event.target.value as TipoVano,
                            )
                          }
                        >
                          <option value="VANO_APERTO">Aperto</option>
                          <option value="BASE_ANTE">Base con ante</option>
                          <option value="CASSETTI">Cassettiera</option>
                        </select>
                      </label>
                      <label className="space-y-1 text-sm">
                        <span>Altezza (cm)</span>
                        <Input
                          type="number"
                          min={1}
                          max={500}
                          value={vano.altezzaCm}
                          onChange={(event) =>
                            aggiornaVano(colonnaIndice, vanoIndice, (corrente) => ({
                              ...corrente,
                              altezzaCm: Number(event.target.value),
                            }))
                          }
                        />
                      </label>
                      {vano.tipo !== 'CASSETTI' && (
                        <label className="space-y-1 text-sm">
                          <span>Ripiani</span>
                          <Input
                            type="number"
                            min={0}
                            max={30}
                            value={vano.ripiani ?? 0}
                            onChange={(event) =>
                              aggiornaVano(colonnaIndice, vanoIndice, (corrente) => ({
                                ...corrente,
                                ripiani: Number(event.target.value),
                              }))
                            }
                          />
                        </label>
                      )}
                      {vano.tipo === 'BASE_ANTE' && (
                        <label className="space-y-1 text-sm">
                          <span>Ante</span>
                          <select
                            className="h-11 w-full rounded-md border border-input bg-background px-3"
                            value={vano.ante ?? 2}
                            onChange={(event) =>
                              aggiornaVano(colonnaIndice, vanoIndice, (corrente) => ({
                                ...corrente,
                                ante: Number(event.target.value) as 1 | 2,
                              }))
                            }
                          >
                            <option value={1}>1 anta</option>
                            <option value={2}>2 ante</option>
                          </select>
                        </label>
                      )}
                      {vano.tipo === 'CASSETTI' && (
                        <label className="space-y-1 text-sm">
                          <span>Cassetti</span>
                          <select
                            className="h-11 w-full rounded-md border border-input bg-background px-3"
                            value={vano.cassetti ?? 3}
                            onChange={(event) =>
                              aggiornaVano(colonnaIndice, vanoIndice, (corrente) => ({
                                ...corrente,
                                cassetti: Number(event.target.value) as 3 | 4,
                              }))
                            }
                          >
                            <option value={3}>3 cassetti</option>
                            <option value={4}>4 cassetti</option>
                          </select>
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  aggiornaColonna(colonnaIndice, (corrente) => ({
                    ...corrente,
                    vani: [...corrente.vani, vanoVuoto()],
                  }))
                }
              >
                Aggiungi vano
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border p-4">
          <h2 className="text-lg font-semibold">Materiali e costruzione</h2>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={composizione.schienale}
              onChange={(event) =>
                aggiornaComposizione((corrente) => ({
                  ...corrente,
                  schienale: event.target.checked,
                }))
              }
            />
            Prevedi schienale
          </label>
          <label className="block space-y-1 text-sm">
            <span>Profondità (cm)</span>
            <Input
              type="number"
              min={1}
              max={200}
              value={composizione.profonditaCm}
              onChange={(event) =>
                aggiornaComposizione((corrente) => ({
                  ...corrente,
                  profonditaCm: Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Materiale</span>
            <select
              className="h-11 w-full rounded-md border border-input bg-background px-3"
              value={composizione.materiale}
              onChange={(event) =>
                aggiornaComposizione((corrente) => ({
                  ...corrente,
                  materiale: event.target.value as ComposizioneLibreria['materiale'],
                }))
              }
            >
              {opzioni.materiali.map((materiale) => (
                <option key={materiale} value={materiale}>
                  {materiale}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span>Finitura</span>
            <select
              className="h-11 w-full rounded-md border border-input bg-background px-3"
              value={composizione.finitura}
              onChange={(event) =>
                aggiornaComposizione((corrente) => ({
                  ...corrente,
                  finitura: event.target.value as ComposizioneLibreria['finitura'],
                }))
              }
            >
              {opzioni.finiture.map((finitura) => (
                <option key={finitura} value={finitura}>
                  {finitura}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-muted-foreground">
            Materiali e finiture derivano dal catalogo del Preventivatore. La selezione non
            certifica la disponibilità commerciale o la fattibilità costruttiva.
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-border p-4">
          <h2 className="text-lg font-semibold">Riepilogo elementi</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Vani aperti</dt>
            <dd className="text-right">{riepilogo.vaniAperti}</dd>
            <dt className="text-muted-foreground">Ripiani</dt>
            <dd className="text-right">{riepilogo.ripiani}</dd>
            <dt className="text-muted-foreground">Basi con ante</dt>
            <dd className="text-right">
              {riepilogo.basiConAnte} ({riepilogo.ante} ante)
            </dd>
            <dt className="text-muted-foreground">Cassettiere</dt>
            <dd className="text-right">
              {riepilogo.cassettiere} ({riepilogo.cassetti} cassetti)
            </dd>
          </dl>
          <div className="rounded-md border border-border p-3">
            <p className="font-medium">
              {errori.length === 0
                ? 'Validazione Preventivatore superata'
                : `${errori.length} problemi da correggere`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Non è una verifica di produzione: fianchi condivisi, spessori, ferramenta, portate e
              giunzioni richiedono ancora approvazione tecnica.
            </p>
            {errori.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive">
                {errori.map((errore, indice) => (
                  <li key={`${indice}-${errore}`}>{errore}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Esporta la bozza</h2>
            <p className="text-sm text-muted-foreground">
              JSON di bozza da revisionare. Nessun salvataggio automatico.
            </p>
            <p
              role="note"
              className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
            >
              Bozza non certificata per produzione: richiede revisione tecnica di geometria,
              materiali, ferramenta, portate e costi.
            </p>
            {errori.length > 0 && (
              <p role="alert" className="mt-2 text-sm text-destructive">
                La bozza contiene {errori.length} errori di validazione. L&apos;esito e
                l&apos;elenco sono inclusi nel JSON esportato.
              </p>
            )}
          </div>
          <Button type="button" onClick={copiaJson} disabled={!codiceValido}>
            Copia JSON
          </Button>
        </div>
        <textarea
          aria-label="JSON della composizione"
          readOnly
          value={json}
          className="min-h-72 w-full rounded-md border border-input bg-muted/30 p-3 font-mono text-xs"
        />
        {messaggio && (
          <p role="status" className="text-sm text-muted-foreground">
            {messaggio}
          </p>
        )}
      </section>
    </div>
  );
}
