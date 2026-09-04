'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CampoRenderer } from './CampoRenderer';
import { ProgressoWizard } from './ProgressoWizard';
import { UploadDocumenti } from './UploadDocumenti';
import { RiepilogoRichiesta } from './RiepilogoRichiesta';
import { SelettoreVariante } from './SelettoreVariante';
import {
  salvaStep,
  completaRichiesta,
  registraVarianteSelezionata,
} from '@/app/progetti/[chiave]/azioni';
import {
  calcolaStepMancanti,
  validaStep,
  type TipoProgettoConfigurazione,
} from '@/lib/tipo-progetto-schema';
import type { RichiestaProgetto, DocumentoRichiesta, VariantePreimpostata } from '@prisma/client';

type Fase =
  | { tipo: 'variante' }
  | { tipo: 'campo'; indice: number }
  | { tipo: 'allegati' }
  | { tipo: 'riepilogo' };

interface Props {
  chiaveTipoProgetto: string;
  nomeTipoProgetto: string;
  configurazione: TipoProgettoConfigurazione;
  richiestaIniziale: RichiestaProgetto;
  documentiIniziali: DocumentoRichiesta[];
  variantiDisponibili: VariantePreimpostata[];
}

function richiestaADatiForm(richiesta: RichiestaProgetto): Record<string, unknown> {
  const jsonEsistente = (richiesta.datiFormJson as Record<string, unknown>) ?? {};
  return {
    ...jsonEsistente,
    clienteNome: richiesta.clienteNome,
    clienteEmail: richiesta.clienteEmail,
    clienteTelefono: richiesta.clienteTelefono,
    clienteTipo: richiesta.clienteTipo,
    clienteAzienda: richiesta.clienteAzienda,
    budgetDichiarato: richiesta.budgetDichiarato,
    dataDesiderata: richiesta.dataDesiderata
      ? new Date(richiesta.dataDesiderata).toISOString().slice(0, 10)
      : null,
    messaggioLibero: richiesta.messaggioLibero,
  };
}

export function ConfiguratoreWizard({
  chiaveTipoProgetto,
  nomeTipoProgetto,
  configurazione,
  richiestaIniziale,
  documentiIniziali,
  variantiDisponibili,
}: Props) {
  const router = useRouter();
  const [richiesta, setRichiesta] = useState(richiestaIniziale);
  const [documenti, setDocumenti] = useState(documentiIniziali);
  const [datiForm, setDatiForm] = useState<Record<string, unknown>>(() =>
    richiestaADatiForm(richiestaIniziale),
  );
  const [varianteSelezionataId, setVarianteSelezionataId] = useState<string | null>(
    richiestaIniziale.variantePreimpostataId,
  );
  const [errori, setErrori] = useState<Record<string, string>>({});
  const [salvando, startSalvataggio] = useTransition();
  const [inviando, startInvio] = useTransition();
  const [erroreInvio, setErroreInvio] = useState<string | null>(null);

  const mostraVariante = variantiDisponibili.length > 0;

  const fasi: Fase[] = useMemo(
    () => [
      ...(mostraVariante ? [{ tipo: 'variante' as const }] : []),
      ...configurazione.step.map((_, indice) => ({ tipo: 'campo' as const, indice })),
      { tipo: 'allegati' as const },
      { tipo: 'riepilogo' as const },
    ],
    [configurazione, mostraVariante],
  );

  const [faseIndice, setFaseIndice] = useState(() => {
    if (!richiestaIniziale.ultimoStepChiave) return 0;
    const indiceRipreso = configurazione.step.findIndex(
      (s) => s.chiave === richiestaIniziale.ultimoStepChiave,
    );
    if (indiceRipreso < 0) return 0;
    return indiceRipreso + (mostraVariante ? 1 : 0);
  });

  function selezionaVariante(variante: { id: string; scelte: unknown }) {
    setVarianteSelezionataId(variante.id);
    setDatiForm((prec) => ({ ...prec, ...(variante.scelte as Record<string, unknown>) }));
    startSalvataggio(async () => {
      await registraVarianteSelezionata(richiesta.id, variante.id);
    });
  }

  const faseCorrente = fasi[faseIndice];
  const stepCorrente = faseCorrente?.tipo === 'campo' ? configurazione.step[faseCorrente.indice] : null;

  const stepMancanti = useMemo(
    () => calcolaStepMancanti(configurazione, datiForm),
    [configurazione, datiForm],
  );

  useEffect(() => {
    if (!stepCorrente) return;
    const timeout = setTimeout(() => {
      const valoriStep: Record<string, unknown> = {};
      for (const campo of stepCorrente.campi) {
        valoriStep[campo.chiave] = datiForm[campo.chiave];
      }
      startSalvataggio(async () => {
        const risultato = await salvaStep(richiesta.id, stepCorrente.chiave, valoriStep);
        setRichiesta(risultato.richiesta);
      });
    }, 900);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datiForm, stepCorrente?.chiave]);

  function aggiornaCampo(chiave: string, valore: unknown) {
    setDatiForm((prec) => ({ ...prec, [chiave]: valore }));
    setErrori((prec) => {
      if (!(chiave in prec)) return prec;
      const nuovo = { ...prec };
      delete nuovo[chiave];
      return nuovo;
    });
  }

  async function vaiAvanti() {
    if (stepCorrente) {
      const erroriStep = validaStep(stepCorrente, datiForm);
      if (Object.keys(erroriStep).length > 0) {
        setErrori(erroriStep);
        return;
      }
      const valoriStep: Record<string, unknown> = {};
      for (const campo of stepCorrente.campi) valoriStep[campo.chiave] = datiForm[campo.chiave];
      await new Promise<void>((resolve) => {
        startSalvataggio(async () => {
          const risultato = await salvaStep(
            richiesta.id,
            stepCorrente.chiave,
            valoriStep,
            'avanzamento',
          );
          setRichiesta(risultato.richiesta);
          resolve();
        });
      });
    }
    setErrori({});
    setFaseIndice((i) => Math.min(i + 1, fasi.length - 1));
  }

  function vaiIndietro() {
    setErrori({});
    setFaseIndice((i) => Math.max(i - 1, 0));
  }

  function invia() {
    setErroreInvio(null);
    startInvio(async () => {
      const risultato = await completaRichiesta(richiesta.id);
      if (!risultato.successo) {
        setErrori(risultato.errori);
        setErroreInvio('Alcune informazioni necessarie mancano ancora. Controlla i passaggi indicati.');
        return;
      }
      router.push(`/progetti/${chiaveTipoProgetto}/completato?id=${richiesta.id}`);
    });
  }

  const numeroFase = faseIndice + 1;
  const titoloFase =
    faseCorrente?.tipo === 'variante'
      ? 'Stile di partenza'
      : faseCorrente?.tipo === 'campo'
        ? stepCorrente?.titolo ?? 'Dettagli del progetto'
        : faseCorrente?.tipo === 'allegati'
          ? 'Documenti e riferimenti'
          : 'Il tuo progetto, in sintesi';

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ramirez Atelier</p>
            <p className="mt-1 font-serif text-lg font-light">{nomeTipoProgetto}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Save className="h-3.5 w-3.5" />
            {salvando ? 'Salvataggio…' : 'Salvato automaticamente'}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 pb-16 pt-8 sm:pt-10">
        <div className="mb-8">
          <ProgressoWizard
            percentuale={richiesta.indiceCompletezza}
            stepMancanti={stepMancanti}
            faseCorrente={faseIndice}
            totaleFasi={fasi.length}
          />
        </div>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Passaggio {numeroFase}
            </p>
            <h1 className="mt-2 text-balance font-serif text-3xl font-light tracking-tight sm:text-4xl">
              {titoloFase}
            </h1>
            {faseCorrente?.tipo === 'campo' && stepCorrente?.sottotitolo && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {stepCorrente.sottotitolo}
              </p>
            )}
          </div>

          {faseCorrente?.tipo === 'variante' && (
            <SelettoreVariante
              varianti={variantiDisponibili}
              selezionata={varianteSelezionataId}
              onSeleziona={selezionaVariante}
            />
          )}

          {faseCorrente?.tipo === 'campo' && stepCorrente && (
            <div className="space-y-6">
              {stepCorrente.campi.map((campo) => (
                <CampoRenderer
                  key={campo.chiave}
                  campo={campo}
                  valore={datiForm[campo.chiave]}
                  errore={errori[campo.chiave]}
                  onChange={aggiornaCampo}
                />
              ))}
            </div>
          )}

          {faseCorrente?.tipo === 'allegati' && (
            <UploadDocumenti
              richiestaId={richiesta.id}
              documenti={documenti}
              onDocumentiChange={setDocumenti}
            />
          )}

          {faseCorrente?.tipo === 'riepilogo' && (
            <div className="space-y-6">
              <RiepilogoRichiesta
                configurazione={configurazione}
                datiForm={datiForm}
                documenti={documenti}
              />
              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Quasi fatto.</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Inviando il progetto ci permetterai di valutarlo e ricontattarti per definire
                      insieme i dettagli e la stima.
                    </p>
                  </div>
                </div>
              </div>
              {erroreInvio && <p className="text-sm text-destructive">{erroreInvio}</p>}
            </div>
          )}

          <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={vaiIndietro} disabled={faseIndice === 0 || salvando}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Indietro
            </Button>
            {faseCorrente?.tipo !== 'riepilogo' ? (
              <Button variant="accent" onClick={vaiAvanti} disabled={salvando}>
                Continua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button variant="accent" onClick={invia} disabled={inviando || salvando}>
                {inviando ? 'Invio in corso…' : 'Invia il progetto'}
                {!inviando && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
