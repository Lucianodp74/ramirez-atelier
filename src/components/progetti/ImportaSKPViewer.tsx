'use client';

import { useEffect, useState } from 'react';
import { Modello3DViewer } from './Modello3DViewer';

const MAX_FILE_BYTES = 40 * 1024 * 1024;

type ImportState =
  | { status: 'idle' }
  | { status: 'processing'; stage: string; percent: number }
  | { status: 'done'; fileName: string; size: number; objectUrl: string }
  | { status: 'error'; message: string };

export type ModelloSKPConvertito = {
  file: File;
  nomeOriginale: string;
  formatoSorgente: 'skp';
};

type ImportaSKPViewerProps = {
  onGlbReady?: (result: ModelloSKPConvertito) => void;
  className?: string;
};

/**
 * Importazione diretta di file SketchUp nell'area autenticata.
 * La conversione avviene localmente nel browser: il file sorgente non viene
 * inviato al server da questo componente. Il GLB prodotto può essere
 * successivamente caricato tramite l'API asset autorizzata.
 */
export function ImportaSKPViewer({ onGlbReady, className }: ImportaSKPViewerProps) {
  const [state, setState] = useState<ImportState>({ status: 'idle' });

  useEffect(() => {
    return () => {
      if (state.status === 'done') URL.revokeObjectURL(state.objectUrl);
    };
  }, [state]);

  async function importa(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.skp')) {
      setState({ status: 'error', message: 'Seleziona un file con estensione .skp.' });
      return;
    }
    if (file.size === 0) {
      setState({ status: 'error', message: 'Il file selezionato è vuoto.' });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setState({
        status: 'error',
        message: 'Per questa prima versione il limite è 40 MB. Per file più grandi useremo la conversione su worker dedicato.',
      });
      return;
    }

    setState({ status: 'processing', stage: 'Lettura del file SketchUp', percent: 5 });

    try {
      // Importazione lazy: OpenSKP non aumenta il bundle iniziale del sito.
      const openskp = await import('openskp');
      const buffer = await file.arrayBuffer();

      setState({ status: 'processing', stage: 'Analisi geometrie e componenti', percent: 20 });
      const scene = openskp.buildInstancedScene(buffer, {
        onProgress: (info) => {
          const percent = info.total > 0
            ? Math.min(82, 20 + Math.round((info.current / info.total) * 62))
            : 25;
          setState({
            status: 'processing',
            stage: info.stage === 'tlv_walk' ? 'Lettura della struttura SKP' : 'Preparazione della scena 3D',
            percent,
          });
        },
      });

      if (!scene.meshResources.length) {
        throw new Error('Il file è stato letto, ma non contiene geometrie 3D visibili da esportare.');
      }

      setState({ status: 'processing', stage: 'Esportazione GLB con componenti riutilizzati', percent: 88 });
      const bytes = openskp.toInstancedGLB(scene, { textures: true });
      // Copia in un ArrayBuffer autonomo per compatibilità con Blob/TS.
      const output = new Uint8Array(bytes.byteLength);
      output.set(bytes);
      const glb = new File([output.buffer], file.name.replace(/\.skp$/i, '.glb'), {
        type: 'model/gltf-binary',
        lastModified: Date.now(),
      });
      const objectUrl = URL.createObjectURL(glb);

      setState({
        status: 'done',
        fileName: glb.name,
        size: glb.size,
        objectUrl,
      });
      onGlbReady?.({ file: glb, nomeOriginale: file.name, formatoSorgente: 'skp' });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error
          ? error.message
          : 'Non è stato possibile convertire questo file SketchUp.',
      });
    }
  }

  return (
    <section className={className}>
      <div className="rounded-2xl border border-border/70 bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Ramirez Atelier · Importazione CAD
            </p>
            <h2 className="mt-2 font-serif text-2xl font-light">Importa un modello SketchUp</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Carica direttamente un file SKP. Il browser lo converte in GLB mantenendo, dove supportato,
              materiali, texture e componenti ripetuti.
            </p>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            SKP → GLB
          </span>
        </div>

        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 px-6 py-8 text-center transition hover:bg-secondary/40">
          <span className="text-sm font-medium">Seleziona file .SKP</span>
          <span className="mt-1 text-xs text-muted-foreground">Massimo 40 MB · conversione locale nel browser</span>
          <input
            className="sr-only"
            type="file"
            accept=".skp,application/octet-stream"
            onChange={(event) => importa(event.currentTarget.files?.[0])}
          />
        </label>

        {state.status === 'processing' && (
          <div className="mt-5" role="status" aria-live="polite">
            <div className="mb-2 flex justify-between gap-3 text-xs">
              <span>{state.stage}</span>
              <span>{state.percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${state.percent}%` }} />
            </div>
          </div>
        )}

        {state.status === 'error' && (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
            {state.message}
          </p>
        )}

        {state.status === 'done' && (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">{state.fileName}</p>
                <p className="text-xs text-muted-foreground">{(state.size / (1024 * 1024)).toFixed(2)} MB · conversione completata</p>
              </div>
              <a
                className="rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-secondary"
                href={state.objectUrl}
                download={state.fileName}
              >
                Scarica GLB
              </a>
            </div>
            <Modello3DViewer
              src={state.objectUrl}
              alt="Anteprima del modello SketchUp convertito"
              titolo="Anteprima del progetto"
            />
          </div>
        )}

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Nota: il file SKP originale non viene caricato né conservato da questo componente.
          Il GLB convertito deve essere salvato tramite il flusso documentale autenticato prima della pubblicazione.
          I file complessi o molto grandi richiederanno la conversione su server dedicato.
        </p>
      </div>
    </section>
  );
}
