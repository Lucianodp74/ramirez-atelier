'use client';

import Script from 'next/script';
import type { CSSProperties } from 'react';
import { useState } from 'react';

const ModelViewer = 'model-viewer' as unknown as React.ElementType;

const modelStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'transparent',
  '--poster-color': 'transparent',
} as CSSProperties;

export function StellaHero3D() {
  const [ready, setReady] = useState(false);

  return (
    <div className="relative h-[420px] w-full sm:h-[540px] lg:h-[650px]">
      <Script
        src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
        strategy="afterInteractive"
        type="module"
        onLoad={() => setReady(true)}
      />

      <div className="absolute inset-x-8 bottom-8 top-8 rounded-[2rem] border border-border/70 bg-gradient-to-br from-card/90 via-card/40 to-secondary/20 shadow-[0_30px_80px_rgba(42,38,34,0.10)] sm:inset-x-12 sm:bottom-10 sm:top-10" />

      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Modello 3D
            </p>
            <p className="mt-3 font-serif text-2xl font-light">STELLA</p>
          </div>
        </div>
      )}

      <ModelViewer
        src="/madia-stella-sketchup-master.glb"
        alt="Madia STELLA di Ramirez Atelier, modello tridimensionale"
        camera-controls
        auto-rotate
        auto-rotate-delay="900"
        rotation-per-second="10deg"
        shadow-intensity="1.05"
        shadow-softness="0.75"
        exposure="0.95"
        environment-image="neutral"
        interaction-prompt="auto"
        loading="eager"
        reveal="auto"
        camera-orbit="25deg 72deg auto"
        min-camera-orbit="auto 55deg auto"
        max-camera-orbit="auto 82deg auto"
        disable-tap
        style={modelStyle}
        className="relative z-[1]"
      />

      <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border/70 bg-background/75 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur sm:bottom-10">
        Trascina per esplorare
      </div>

      <div className="pointer-events-none absolute left-6 top-8 z-10 hidden rounded-full border border-border/70 bg-background/70 px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur sm:block">
        RA · MS · 001
      </div>
    </div>
  );
}
