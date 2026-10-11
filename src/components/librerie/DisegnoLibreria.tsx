import {
  altezzaColonna,
  ingombroComposizione,
  type ComposizioneLibreria,
  type VanoComposizione,
} from '@/lib/catalogo-librerie/composizione';

const MARGINE = 6;
const SPESSORE = 2;

function Vano({
  vano,
  x,
  y,
  larghezza,
}: {
  vano: VanoComposizione;
  x: number;
  y: number;
  larghezza: number;
}) {
  const altezza = vano.altezzaCm;
  if (vano.tipo === 'VANO_APERTO') {
    const ripiani = vano.ripiani ?? 0;
    return (
      <g>
        <rect x={x} y={y} width={larghezza} height={altezza} fill="var(--card)" />
        {Array.from({ length: ripiani }, (_, i) => {
          const quota = y + (altezza / (ripiani + 1)) * (i + 1);
          return <line key={i} x1={x} x2={x + larghezza} y1={quota} y2={quota} />;
        })}
      </g>
    );
  }
  if (vano.tipo === 'BASE_ANTE') {
    const ante = vano.ante ?? 2;
    return (
      <g>
        <rect x={x} y={y} width={larghezza} height={altezza} fill="var(--secondary)" />
        {ante === 2 && (
          <line x1={x + larghezza / 2} x2={x + larghezza / 2} y1={y} y2={y + altezza} />
        )}
      </g>
    );
  }
  const cassetti = vano.cassetti ?? 3;
  return (
    <g>
      <rect x={x} y={y} width={larghezza} height={altezza} fill="var(--secondary)" />
      {Array.from({ length: cassetti - 1 }, (_, i) => {
        const quota = y + (altezza / cassetti) * (i + 1);
        return <line key={i} x1={x} x2={x + larghezza} y1={quota} y2={quota} />;
      })}
    </g>
  );
}

/**
 * Prospetto frontale schematico, disegnato dalla composizione del modello.
 * È un trattamento grafico neutro e in proporzione: non è una fotografia e
 * non rappresenta un lavoro realizzato.
 */
export function DisegnoLibreria({
  composizione,
  titolo,
  className,
}: {
  composizione: ComposizioneLibreria;
  titolo: string;
  className?: string;
}) {
  const ingombro = ingombroComposizione(composizione);
  const larghezzaVista = ingombro.larghezzaCm + MARGINE * 2;
  const altezzaVista = ingombro.altezzaCm + MARGINE * 2;
  const base = MARGINE + ingombro.altezzaCm;

  let xCorrente = MARGINE;
  const colonne = composizione.colonne.map((colonna) => {
    const x = xCorrente;
    xCorrente += colonna.larghezzaCm;
    let quota = base;
    const vani = colonna.vani.map((vano, indice) => {
      quota -= vano.altezzaCm;
      return { vano, y: quota, chiave: `${colonna.id}-${indice}` };
    });
    return { colonna, x, vani };
  });

  return (
    <svg
      viewBox={`0 0 ${larghezzaVista} ${altezzaVista}`}
      role="img"
      aria-label={`Disegno schematico del modello ${titolo}`}
      className={className}
      stroke="var(--foreground)"
      strokeWidth={SPESSORE}
      strokeLinejoin="round"
      fill="none"
    >
      {colonne.map(({ colonna, x, vani }) => (
        <g key={colonna.id}>
          {vani.map(({ vano, y, chiave }) => (
            <Vano key={chiave} vano={vano} x={x} y={y} larghezza={colonna.larghezzaCm} />
          ))}
          {vani.map(({ vano, y, chiave }) => (
            <rect
              key={`bordo-${chiave}`}
              x={x}
              y={y}
              width={colonna.larghezzaCm}
              height={vano.altezzaCm}
            />
          ))}
          <rect
            x={x}
            y={base - altezzaColonna(colonna)}
            width={colonna.larghezzaCm}
            height={altezzaColonna(colonna)}
          />
        </g>
      ))}
    </svg>
  );
}
