'use client';

import Script from 'next/script';
import type { CSSProperties, ElementType } from 'react';
import { useState } from 'react';

const ModelViewer = 'model-viewer' as unknown as ElementType;

const viewerStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: '320px',
  background: 'transparent',
  '--poster-color': 'transparent',
  touchAction: 'pan-y',
} as CSSProperties;

type Modello3DViewerProps = {
  src: string;
  alt: string;
  poster?: string;
  titolo?: string;
  autoRotate?: boolean;
  className?: string;
};

/**
 * Viewer GLB/glTF condiviso dalle presentazioni Ramirez 3D.
 * La pagina chiamante deve fornire esclusivamente URL di asset già autorizzati.
 */
export function Modello3DViewer({
  src,
  alt,
  poster,
  titolo = 'Modello tridimensionale',
  autoRotate = false,
  className,
}: Modello3DViewerProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  return (
    <section className={className} aria-label={titolo}>
      <Script
        src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
        strategy="afterInteractive"
        type="module"
        onLoad={() => setReady(true)}
        onError={() => setError(true)}
      />

      <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-secondary/20">
        {!ready && !error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Ramirez Atelier · 3D
              </p>
              <p className="mt-3 font-serif text-xl font-light">{titolo}</p>
              <p className="mt-2 text-xs text-muted-foreground">Caricamento del modello…</p>
            </div>
          </div>
        )}

        {error && (
          <div
            role="status"
            className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center"
          >
            <p className="max-w-sm text-sm text-muted-foreground">
              Il visualizzatore non è disponibile. Puoi consultare le immagini del progetto.
            </p>
          </div>
        )}

        <ModelViewer
          src={src}
          alt={alt}
          poster={poster}
          camera-controls
          touch-action="pan-y"
          auto-rotate={autoRotate}
          auto-rotate-delay="3500"
          rotation-per-second="12deg"
          shadow-intensity="1"
          shadow-softness="0.8"
          exposure="1"
          environment-image="neutral"
          interaction-prompt="auto"
          loading="eager"
          reveal="auto"
          camera-orbit="0deg 70deg auto"
          min-camera-orbit="-180deg 20deg auto"
          max-camera-orbit="180deg 110deg auto"
          min-field-of-view="18deg"
          max-field-of-view="50deg"
          style={viewerStyle}
          className="relative z-[1] block"
          onError={() => setError(true)}
        />

        <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-border/70 bg-background/80 px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
          Trascina per ruotare · usa i controlli per ingrandire
        </div>
      </div>
    </section>
  );
}
