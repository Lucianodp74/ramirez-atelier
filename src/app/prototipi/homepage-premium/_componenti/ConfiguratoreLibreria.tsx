'use client';

import Image from 'next/image';
import { Minus, Plus, RotateCcw, RotateCw, Undo2 } from 'lucide-react';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ASSET } from './contenuti';

// Stessa libreria (model-viewer) e stesso host già usati da StellaHero3D, con versione fissata.
const SCRIPT_MODEL_VIEWER = 'https://unpkg.com/@google/model-viewer@4.4.0/dist/model-viewer.min.js';
const ModelViewer = 'model-viewer' as unknown as ElementType;

type Rgba = [number, number, number, number];
type Finitura = {
  id: string;
  nome: string;
  texture?: string;
  colore: Rgba;
  ruvidita: number;
  campione: string;
};

const FINITURE: Finitura[] = [
  {
    id: 'rovere',
    nome: 'Rovere naturale',
    texture: `${ASSET}/texture/rovere.jpg`,
    colore: [1, 1, 1, 1],
    ruvidita: 0.55,
    campione: `${ASSET}/texture/rovere.jpg`,
  },
  {
    id: 'noce',
    nome: 'Noce',
    texture: `${ASSET}/texture/noce.jpg`,
    colore: [1, 1, 1, 1],
    ruvidita: 0.45,
    campione: `${ASSET}/texture/noce.jpg`,
  },
  {
    id: 'avorio',
    nome: 'Laccato avorio',
    colore: [0.8, 0.76, 0.68, 1],
    ruvidita: 0.38,
    campione: '#E6DED1',
  },
  {
    id: 'antracite',
    nome: 'Laccato antracite',
    colore: [0.045, 0.043, 0.041, 1],
    ruvidita: 0.42,
    campione: '#2A2724',
  },
];
const LARGHEZZE = [180, 240, 300] as const;
const ALTEZZE = [220, 260] as const;
const ORBITA_INIZIALE = { theta: -22, phi: 78 };
const INIZIALE = {
  finitura: 'rovere',
  larghezza: 240 as number,
  altezza: 260 as number,
  led: true,
};

type MaterialeMV = {
  name: string;
  setEmissiveFactor: (c: [number, number, number]) => void;
  pbrMetallicRoughness: {
    setBaseColorFactor: (c: Rgba) => void;
    setRoughnessFactor: (r: number) => void;
    baseColorTexture: { setTexture: (t: unknown) => void };
  };
};
type ModelViewerElement = HTMLElement & {
  model?: { materials: MaterialeMV[] };
  createTexture: (uri: string) => Promise<unknown>;
  getCameraOrbit: () => { theta: number; phi: number; radius: number };
  getFieldOfView: () => number;
  cameraOrbit: string;
  fieldOfView: string;
};

type Stato = 'attesa' | 'caricamento' | 'pronto' | 'non-supportato' | 'errore';

function webglDisponibile() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

let promessaScript: Promise<void> | null = null;
function caricaModelViewer() {
  if (customElements.get('model-viewer')) return Promise.resolve();
  promessaScript ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.type = 'module';
    s.src = SCRIPT_MODEL_VIEWER;
    s.onerror = () => {
      promessaScript = null;
      reject(new Error('model-viewer non disponibile'));
    };
    document.head.appendChild(s);
    customElements.whenDefined('model-viewer').then(() => resolve());
  });
  return promessaScript;
}

const focusAnello =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pa-antracite)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pa-avorio)]';

function Gruppo({ legenda, children }: { legenda: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[var(--pa-grigio)]">
        {legenda}
      </legend>
      {children}
    </fieldset>
  );
}

function Opzione({
  nome,
  valore,
  selezionato,
  onSeleziona,
  children,
}: {
  nome: string;
  valore: string;
  selezionato: boolean;
  onSeleziona: () => void;
  children: ReactNode;
}) {
  return (
    <label
      className={`relative flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--pa-antracite)] has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-[var(--pa-avorio)] ${
        selezionato
          ? 'border-[var(--pa-antracite)] bg-[var(--pa-antracite)] text-[var(--pa-avorio)]'
          : 'border-[var(--pa-linea-forte)] text-[var(--pa-antracite)] hover:border-[var(--pa-antracite)]'
      }`}
    >
      <input
        type="radio"
        name={nome}
        value={valore}
        checked={selezionato}
        onChange={onSeleziona}
        className="sr-only"
      />
      {children}
    </label>
  );
}

export function ConfiguratoreLibreria() {
  const descrizioneId = useId();
  const contenitore = useRef<HTMLDivElement>(null);
  const viewer = useRef<ModelViewerElement | null>(null);
  const [stato, setStato] = useState<Stato>('attesa');
  const [modelloCaricato, setModelloCaricato] = useState(false);
  // il render statico sparisce dopo il primo caricamento e non ricompare ai cambi di misura
  const [modelloVisto, setModelloVisto] = useState(false);
  const [finitura, setFinitura] = useState(INIZIALE.finitura);
  const [larghezza, setLarghezza] = useState(INIZIALE.larghezza);
  const [altezza, setAltezza] = useState(INIZIALE.altezza);
  const [led, setLed] = useState(INIZIALE.led);
  const [movimentoRidotto, setMovimentoRidotto] = useState(false);
  const textureCache = useRef(new Map<string, unknown>());

  const src = `${ASSET}/modelli/libreria-${larghezza}x${altezza}.glb`;

  // Il visualizzatore si carica solo quando la sezione sta per entrare nello schermo.
  useEffect(() => {
    setMovimentoRidotto(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el = contenitore.current;
    if (!el) return;
    const osservatore = new IntersectionObserver(
      (voci) => {
        if (!voci.some((v) => v.isIntersecting)) return;
        osservatore.disconnect();
        if (!webglDisponibile()) {
          setStato('non-supportato');
          return;
        }
        setStato('caricamento');
        caricaModelViewer()
          .then(() => setStato('pronto'))
          .catch(() => setStato('errore'));
      },
      { rootMargin: '300px 0px' },
    );
    osservatore.observe(el);
    return () => osservatore.disconnect();
  }, []);

  const applicaAspetto = useCallback(async () => {
    const mv = viewer.current;
    const materiali = mv?.model?.materials;
    if (!mv || !materiali) return;
    const scelta = FINITURE.find((f) => f.id === finitura) ?? FINITURE[0];
    let texture: unknown = null;
    if (scelta.texture) {
      texture = textureCache.current.get(scelta.texture);
      if (!texture) {
        texture = await mv.createTexture(scelta.texture);
        textureCache.current.set(scelta.texture, texture);
      }
    }
    for (const m of materiali) {
      if (m.name === 'finitura' || m.name === 'schienale') {
        const pbr = m.pbrMetallicRoughness;
        pbr.baseColorTexture.setTexture(texture);
        const scurisci = m.name === 'schienale' ? 0.88 : 1;
        pbr.setBaseColorFactor([
          scelta.colore[0] * scurisci,
          scelta.colore[1] * scurisci,
          scelta.colore[2] * scurisci,
          1,
        ]);
        pbr.setRoughnessFactor(scelta.ruvidita);
      }
      if (m.name === 'led') m.setEmissiveFactor(led ? [1, 0.78, 0.52] : [0, 0, 0]);
    }
  }, [finitura, led]);

  // collega il riferimento al custom element e ascolta i caricamenti del modello
  const collegaViewer = useCallback((el: ModelViewerElement | null) => {
    viewer.current = el;
  }, []);

  useEffect(() => {
    const mv = viewer.current;
    if (stato !== 'pronto' || !mv) return;
    const alCaricamento = () => {
      setModelloCaricato(true);
      setModelloVisto(true);
    };
    const alErrore = () => setStato('errore');
    mv.addEventListener('load', alCaricamento);
    mv.addEventListener('error', alErrore);
    return () => {
      mv.removeEventListener('load', alCaricamento);
      mv.removeEventListener('error', alErrore);
    };
  }, [stato]);

  // cambiando misura cambia il file: si attende il nuovo "load" prima di riapplicare le finiture
  useEffect(() => {
    setModelloCaricato(false);
  }, [src]);

  useEffect(() => {
    if (modelloCaricato) void applicaAspetto();
  }, [modelloCaricato, applicaAspetto]);

  const ruota = (gradi: number) => {
    const mv = viewer.current;
    if (!mv) return;
    const o = mv.getCameraOrbit();
    const theta = (o.theta * 180) / Math.PI + gradi;
    mv.cameraOrbit = `${theta}deg ${(o.phi * 180) / Math.PI}deg ${o.radius}m`;
  };
  const zoom = (fattore: number) => {
    const mv = viewer.current;
    if (!mv) return;
    const fov = Math.min(42, Math.max(14, mv.getFieldOfView() * fattore));
    mv.fieldOfView = `${fov}deg`;
  };
  const ripristina = () => {
    setFinitura(INIZIALE.finitura);
    setLarghezza(INIZIALE.larghezza);
    setAltezza(INIZIALE.altezza);
    setLed(INIZIALE.led);
    const mv = viewer.current;
    if (mv) {
      mv.cameraOrbit = `${ORBITA_INIZIALE.theta}deg ${ORBITA_INIZIALE.phi}deg auto`;
      mv.fieldOfView = 'auto';
    }
  };

  const finituraScelta = FINITURE.find((f) => f.id === finitura) ?? FINITURE[0];
  const comandiAttivi = stato === 'pronto';

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
      <div
        ref={contenitore}
        className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[var(--pa-avorio-2)] shadow-[0_30px_80px_-30px_rgba(30,27,24,0.35)]"
      >
        {/* render statico: anteprima mentre il 3D carica e ripiego se non è disponibile */}
        <Image
          src={`${ASSET}/libreria.jpg`}
          alt={
            stato === 'pronto'
              ? ''
              : 'Render della libreria in rovere: quattro moduli con ante basse e ripiani illuminati'
          }
          fill
          sizes="(min-width: 1024px) 58vw, 100vw"
          className={`object-cover transition-opacity duration-700 ${modelloVisto ? 'opacity-0' : 'opacity-100'}`}
        />
        {stato === 'pronto' && (
          <ModelViewer
            ref={collegaViewer}
            src={src}
            alt={`Modello 3D dimostrativo di una libreria su misura, finitura ${finituraScelta.nome.toLowerCase()}, ${larghezza} per ${altezza} centimetri`}
            aria-describedby={descrizioneId}
            camera-controls
            disable-zoom
            touch-action="pan-y"
            interaction-prompt="none"
            camera-orbit={`${ORBITA_INIZIALE.theta}deg ${ORBITA_INIZIALE.phi}deg auto`}
            min-camera-orbit="-75deg 55deg auto"
            max-camera-orbit="75deg 95deg auto"
            interpolation-decay={movimentoRidotto ? 1 : 160}
            shadow-intensity="1"
            shadow-softness="0.8"
            environment-image="neutral"
            tone-mapping="agx"
            exposure="1.05"
            loading="eager"
            style={
              {
                width: '100%',
                height: '100%',
                background: 'transparent',
                '--poster-color': 'transparent',
              } as CSSProperties
            }
            className={`absolute inset-0 ${focusAnello}`}
          />
        )}
        <p id={descrizioneId} className="sr-only">
          Usa i pulsanti Ruota e Zoom sotto il modello, oppure le frecce della tastiera quando il
          modello ha il focus.
        </p>

        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-[var(--pa-avorio)]/90 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-[var(--pa-grigio)] backdrop-blur">
          {stato === 'non-supportato' || stato === 'errore'
            ? 'Anteprima statica'
            : 'Modello 3D dimostrativo'}
        </div>
        {(stato === 'caricamento' || (stato === 'pronto' && !modelloCaricato)) && (
          <div
            role="status"
            className="absolute bottom-4 left-4 rounded-full bg-[var(--pa-antracite)]/85 px-3 py-1.5 text-xs text-[var(--pa-avorio)]"
          >
            Caricamento del modello…
          </div>
        )}
        {(stato === 'non-supportato' || stato === 'errore') && (
          <p
            role="status"
            className="absolute inset-x-4 bottom-4 rounded-xl bg-[var(--pa-antracite)]/85 px-4 py-3 text-sm text-[var(--pa-avorio)]"
          >
            {stato === 'non-supportato'
              ? 'Il tuo dispositivo non supporta la visualizzazione 3D: ecco un’immagine della stessa libreria.'
              : 'Il modello 3D non si è caricato. Puoi comunque vedere l’immagine della libreria.'}
          </p>
        )}

        {comandiAttivi && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            {[
              { etichetta: 'Ruota a sinistra', icona: RotateCcw, azione: () => ruota(-30) },
              { etichetta: 'Ruota a destra', icona: RotateCw, azione: () => ruota(30) },
              { etichetta: 'Avvicina', icona: Plus, azione: () => zoom(0.82) },
              { etichetta: 'Allontana', icona: Minus, azione: () => zoom(1.2) },
            ].map(({ etichetta, icona: Icona, azione }) => (
              <button
                key={etichetta}
                type="button"
                onClick={azione}
                aria-label={etichetta}
                title={etichetta}
                className={`inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-[var(--pa-avorio)]/92 text-[var(--pa-antracite)] shadow-sm backdrop-blur transition-colors duration-200 hover:bg-[var(--pa-avorio)] ${focusAnello}`}
              >
                <Icona aria-hidden="true" className="size-4" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-7">
        <Gruppo legenda="Finitura">
          <div className="grid grid-cols-2 gap-2">
            {FINITURE.map((f) => (
              <Opzione
                key={f.id}
                nome="finitura"
                valore={f.id}
                selezionato={finitura === f.id}
                onSeleziona={() => setFinitura(f.id)}
              >
                <span
                  aria-hidden="true"
                  className="size-5 shrink-0 rounded-full border border-black/10 bg-cover"
                  style={
                    f.campione.startsWith('#')
                      ? { background: f.campione }
                      : { backgroundImage: `url(${f.campione})` }
                  }
                />
                <span className="text-left leading-tight">{f.nome}</span>
              </Opzione>
            ))}
          </div>
        </Gruppo>

        <Gruppo legenda="Larghezza">
          <div className="grid grid-cols-3 gap-2">
            {LARGHEZZE.map((l) => (
              <Opzione
                key={l}
                nome="larghezza"
                valore={String(l)}
                selezionato={larghezza === l}
                onSeleziona={() => setLarghezza(l)}
              >
                {l} cm
              </Opzione>
            ))}
          </div>
        </Gruppo>

        <Gruppo legenda="Altezza">
          <div className="grid grid-cols-3 gap-2">
            {ALTEZZE.map((a) => (
              <Opzione
                key={a}
                nome="altezza"
                valore={String(a)}
                selezionato={altezza === a}
                onSeleziona={() => setAltezza(a)}
              >
                {a} cm
              </Opzione>
            ))}
          </div>
        </Gruppo>

        <div className="flex items-center justify-between gap-4">
          <span id="etichetta-led" className="text-sm text-[var(--pa-antracite)]">
            Luce sotto i ripiani
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={led}
            aria-labelledby="etichetta-led"
            onClick={() => setLed((v) => !v)}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 before:absolute before:-inset-1.5 before:content-[''] ${
              led ? 'bg-[var(--pa-bronzo)]' : 'bg-[var(--pa-linea-forte)]'
            } ${focusAnello}`}
          >
            <span
              aria-hidden="true"
              className={`inline-block size-6 rounded-full bg-[var(--pa-avorio)] shadow transition-transform duration-200 ${
                led ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="border-t border-[var(--pa-linea)] pt-5">
          <p className="text-sm text-[var(--pa-grigio)]">
            Misure indicative: L {larghezza} × H {altezza} × P 40 cm
          </p>
          <button
            type="button"
            onClick={ripristina}
            className={`mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--pa-linea-forte)] px-5 text-sm text-[var(--pa-antracite)] transition-colors duration-200 hover:border-[var(--pa-antracite)] ${focusAnello}`}
          >
            <Undo2 aria-hidden="true" className="size-4" />
            Ripristina configurazione iniziale
          </button>
          <p className="mt-5 text-xs leading-relaxed text-[var(--pa-grigio)]">
            Configurazione dimostrativa: finiture, proporzioni e misure servono a dare un’idea e non
            costituiscono un preventivo né una specifica costruttiva.
          </p>
        </div>
      </div>
    </div>
  );
}
