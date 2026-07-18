'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CampoRenderer } from './CampoRenderer';
import { ProgressoWizard } from './ProgressoWizard';
import { UploadDocumenti } from './UploadDocumenti';
import { RiepilogoRichiesta } from './RiepilogoRichiesta';
import { salvaStep, completaRichiesta } from '@/app/progetti/[chiave]/azioni';
import {
  calcolaStepMancanti,
  validaStep,
  type TipoProgettoConfigurazione,
} from '@/lib/tipo-progetto-schema';
import type { RichiestaProgetto, DocumentoRichiesta } from '@prisma/client';

type Fase = { tipo: 'campo'; indice: number } | { tipo: 'allegati' } | { tipo: 'riepilogo' };

interface Props {
  chiaveTipoProgetto: string;
  nomeTipoProgetto: string;
  configurazione: TipoProgettoConfigurazione;
  richiestaIniziale: RichiestaProgetto;
  documentiIniziali: DocumentoRichiesta[];
}

/** Ricostruisce la vista "piatta" dati riservati + JSON, identica a quella usata dal server action. */
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
}: Props) {
  const router = useRouter();
  const [richiesta, setRichiesta] = useState(richiestaIniziale);
  const [documenti, setDocumenti] = useState(documentiIniziali);
  const [datiForm, setDatiForm] = useState<Record<string, unknown>>(() =>
    richiestaADatiForm(richiestaIniziale),
  );
  const [errori, setErrori] = useState<Record<string, string>>({});
  const [salvando, startSalvataggio] = useTransition();
  const [inviando, startInvio] = useTransition();
  const [erroreInvio, setErroreInvio] = useState<string | null>(null);

  const fasi: Fase[] = useMemo(
    () => [
      ...configurazione.step.map((_, indice) => ({ tipo: 'campo' as const, indice })),
      { tipo: 'allegati' as const },
      { tipo: 'riepilogo' as const },
    ],
    [configurazione],
  );

  const [faseIndice, setFaseIndice] = useState(() => {
    if (!richiestaIniziale.ultimoStepChiave) return 0;
    const indiceRipreso = configurazione.step.findIndex(
      (s) => s.chiave === richiestaIniziale.ultimoStepChiave,
    );
    return indiceRipreso >= 0 ? indiceRipreso : 0;
  });

  const faseCorrente = fasi[faseIndice];
  const stepCorrente =
    faseCorrente.tipo === 'campo' ? configurazione.step[faseCorrente.indice] : null;

  const stepMancanti = useMemo(
    () => calcolaStepMancanti(configurazione, datiForm),
    [configurazione, datiForm],
  );

  // Salvataggio automatico con debounce - Requisito 1: nessuna azione esplicita
  // dell'utente necessaria per non perdere i dati.
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
      // Salvataggio esplicito immediato al cambio step (oltre al debounce), per
      // garantire che "ultimoStepChiave" sia sempre coerente con lo step visitato.
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
        setErroreInvio(
          'Alcune informazioni necessarie mancano ancora - controlla lo step "Contatti".',
        );
        return;
      }
      router.push(`/progetti/${chiaveTipoProgetto}/completato?id=${richiesta.id}`);
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="mb-2 text-sm text-muted-foreground">{nomeTipoProgetto}</p>
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">
        {faseCorrente.tipo === 'campo' && stepCorrente?.titolo}
        {faseCorrente.tipo === 'allegati' && 'Documenti e riferimenti'}
        {faseCorrente.tipo === 'riepilogo' && 'Il tuo progetto, in sintesi'}
      </h1>

      <div className="mb-8">
        <ProgressoWizard percentuale={richiesta.indiceCompletezza} stepMancanti={stepMancanti} />
      </div>

      {faseCorrente.tipo === 'campo' && stepCorrente && (
        <div className="space-y-6">
          {stepCorrente.sottotitolo && (
            <p className="-mt-4 text-sm text-muted-foreground">{stepCorrente.sottotitolo}</p>
          )}
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

      {faseCorrente.tipo === 'allegati' && (
        <UploadDocumenti
          richiestaId={richiesta.id}
          documenti={documenti}
          onDocumentiChange={setDocumenti}
        />
      )}

      {faseCorrente.tipo === 'riepilogo' && (
        <div className="space-y-6">
          <RiepilogoRichiesta
            configurazione={configurazione}
            datiForm={datiForm}
            documenti={documenti}
          />
          {erroreInvio && <p className="text-sm text-destructive">{erroreInvio}</p>}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <Button variant="ghost" onClick={vaiIndietro} disabled={faseIndice === 0}>
          Indietro
        </Button>
        <span className="text-xs text-muted-foreground">
          {salvando ? 'Salvataggio in corso…' : 'Salvato automaticamente'}
        </span>
        {faseCorrente.tipo !== 'riepilogo' ? (
          <Button variant="accent" onClick={vaiAvanti}>
            Avanti
          </Button>
        ) : (
          <Button variant="accent" onClick={invia} disabled={inviando}>
            {inviando ? 'Invio in corso…' : 'Invia la richiesta'}
          </Button>
        )}
      </div>
    </div>
  );
}
