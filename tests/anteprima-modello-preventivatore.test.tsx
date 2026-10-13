import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const mock = vi.hoisted(() => ({ richiediContesto: vi.fn() }));

vi.mock('@/server/identity/contesto', () => {
  class ErroreNonAutenticato extends Error {}
  class ErroreAccessoNegato extends Error {}
  return { ErroreNonAutenticato, ErroreAccessoNegato, richiediContesto: mock.richiediContesto };
});
// Il wizard è un componente client: qui interessa solo che cosa gli viene passato.
vi.mock('@/components/preventivatore/PreventivatoreModulare', () => ({
  PreventivatoreModulare: () => null,
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import { ErroreAccessoNegato, ErroreNonAutenticato } from '@/server/identity/contesto';
import AnteprimaModelloPage from '@/app/admin/(protetto)/catalogo/librerie/[codice]/anteprima/page';
import PreventivatorePage from '@/app/preventivatore/page';
import { PreventivatoreModulare } from '@/components/preventivatore/PreventivatoreModulare';
import {
  MODELLI_LIBRERIE,
  modelliVisibili,
  moduliPerPreventivatore,
  trovaModelloVisibile,
} from '@/lib/catalogo-librerie/catalogo';
import type { ModuloConfigurato } from '@/lib/preventivatore/moduli';
import {
  confermaSostituzione,
  effettoSceltaTipoProgetto,
  tipoProgettoIniziale,
} from '@/lib/preventivatore/tipo-progetto';

type PropsPreventivatore = { moduliIniziali?: ModuloConfigurato[]; codiceModelloOrigine?: string };

const apriAnteprima = (codice: string) =>
  AnteprimaModelloPage({ params: Promise.resolve({ codice }) }) as Promise<ReactElement>;

/** Proprietà passate al Preventivatore dentro la pagina resa. */
function propsPreventivatore(pagina: ReactNode): PropsPreventivatore | null {
  if (!isValidElement<{ children?: ReactNode }>(pagina)) return null;
  if (pagina.type === PreventivatoreModulare) return pagina.props as PropsPreventivatore;
  const figli = pagina.props.children;
  for (const figlio of Array.isArray(figli) ? figli : [figli]) {
    const trovate = propsPreventivatore(figlio);
    if (trovate) return trovate;
  }
  return null;
}

/** La composizione di LIB-ESS-01 dichiarata nel catalogo: due colonne uguali. */
const MODULO_ESSENZIALE = {
  tipo: 'LIBRERIA',
  larghezzaCm: 90,
  altezzaCm: 220,
  profonditaCm: 35,
  ripiani: 5,
  materiale: 'TRUCIOLARE',
  finitura: 'MELAMINICO',
  configurazione: 'APERTO',
};

describe('anteprima interna di un modello nel Preventivatore', () => {
  beforeEach(() => {
    mock.richiediContesto.mockReset();
  });

  describe('utente non autorizzato', () => {
    it('senza sessione la pagina si interrompe prima di caricare la bozza', async () => {
      mock.richiediContesto.mockRejectedValue(new ErroreNonAutenticato());

      await expect(apriAnteprima('LIB-ESS-01')).rejects.toBeInstanceOf(ErroreNonAutenticato);
    });

    it('con una sessione senza permesso sul catalogo la pagina si interrompe', async () => {
      mock.richiediContesto.mockRejectedValue(new ErroreAccessoNegato('catalogo', 'leggi'));

      await expect(apriAnteprima('LIB-ESS-01')).rejects.toBeInstanceOf(ErroreAccessoNegato);
    });

    it('il rifiuto è identico per un codice inesistente: non rivela quali modelli esistono', async () => {
      mock.richiediContesto.mockRejectedValue(new ErroreNonAutenticato());

      await expect(apriAnteprima('LIB-ZZZ-99')).rejects.toBeInstanceOf(ErroreNonAutenticato);
    });

    it('il permesso richiesto è la lettura del catalogo, verificata lato server', async () => {
      mock.richiediContesto.mockResolvedValue({ tenantId: 't1' });

      await apriAnteprima('LIB-ESS-01');

      expect(mock.richiediContesto).toHaveBeenCalledExactlyOnceWith({
        modulo: 'catalogo',
        azione: 'leggi',
      });
    });
  });

  describe('utente operativo autorizzato', () => {
    beforeEach(() => {
      mock.richiediContesto.mockResolvedValue({ tenantId: 't1', utenteNome: 'Titolare' });
    });

    it('LIB-ESS-01 arriva al Preventivatore come due moduli da 90 × 220 × 35 cm con 5 ripiani', async () => {
      const props = propsPreventivatore(await apriAnteprima('LIB-ESS-01'));

      expect(props?.moduliIniziali).toHaveLength(2);
      for (const modulo of props!.moduliIniziali!) expect(modulo).toMatchObject(MODULO_ESSENZIALE);
      expect(props?.codiceModelloOrigine).toBe('LIB-ESS-01');
      // Identificativi distinti: i due moduli sono modificabili separatamente.
      expect(new Set(props!.moduliIniziali!.map((modulo) => modulo.id)).size).toBe(2);
    });

    it('la fascia di anteprima dichiara stato e composizione attesa', async () => {
      const html = renderToStaticMarkup(await apriAnteprima('LIB-ESS-01'));

      expect(html).toContain('Anteprima interna');
      expect(html).toContain('Bozza');
      expect(html).toContain('LIB-ESS-01');
      expect(html.split('L 90 × H 220 × P 35 cm · 5 ripiani')).toHaveLength(3);
    });

    it('un codice inesistente o malformato dà pagina non trovata', async () => {
      for (const codice of ['LIB-ZZZ-99', 'non-un-codice', '../admin', '']) {
        await expect(apriAnteprima(codice), codice).rejects.toThrow('NEXT_NOT_FOUND');
      }
    });

    it('ogni modello in bozza del catalogo è provabile dal percorso protetto', async () => {
      for (const modello of MODELLI_LIBRERIE.filter((m) => m.stato === 'BOZZA')) {
        const props = propsPreventivatore(await apriAnteprima(modello.codice));
        expect(props?.moduliIniziali?.length, modello.codice).toBeGreaterThan(0);
        expect(props?.codiceModelloOrigine).toBe(modello.codice);
      }
    });
  });
});

describe('selezionare «Libreria» non azzera la composizione di LIB-ESS-01', () => {
  const moduli = moduliPerPreventivatore('LIB-ESS-01', { anteprimaInterna: true })!;

  it('il wizard si apre già su «Libreria»', () => {
    expect(tipoProgettoIniziale(moduli)).toBe('LIBRERIA');
  });

  it('la scelta non ha alcun effetto sui moduli, qualunque sia quello selezionato', () => {
    for (const modulo of moduli) {
      const effetto = effettoSceltaTipoProgetto('LIBRERIA', modulo, {
        composizioneDaConservare: true,
      });
      expect(effetto).toEqual({ tipo: 'NESSUNO' });
      // Nessuna modifica, quindi nessuna conferma da chiedere.
      expect(confermaSostituzione(effetto)).toBeNull();
    }
    // I moduli restano quelli del catalogo: misure e ripiani intatti.
    for (const modulo of moduli) expect(modulo).toMatchObject(MODULO_ESSENZIALE);
  });

  it('una scelta che cambierebbe davvero i moduli richiede una conferma esplicita', () => {
    for (const tipo of ['MADIA', 'ARMADIO'] as const) {
      const effetto = effettoSceltaTipoProgetto(tipo, moduli[0], {
        composizioneDaConservare: true,
      });
      expect(effetto.tipo, tipo).not.toBe('NESSUNO');
      expect(confermaSostituzione(effetto), tipo).not.toBeNull();
    }
  });
});

describe('percorso pubblico — invariato per i modelli non approvati', () => {
  beforeEach(() => {
    mock.richiediContesto.mockReset();
  });

  it('LIB-ESS-01 resta in bozza e invisibile al pubblico', () => {
    expect(MODELLI_LIBRERIE.find((m) => m.codice === 'LIB-ESS-01')?.stato).toBe('BOZZA');
    expect(modelliVisibili().map((m) => m.codice)).not.toContain('LIB-ESS-01');
    expect(trovaModelloVisibile('LIB-ESS-01')).toBeNull();
    expect(moduliPerPreventivatore('LIB-ESS-01')).toBeNull();
  });

  it('/preventivatore?modello=LIB-ESS-01 senza sessione si apre con i valori di sempre', async () => {
    mock.richiediContesto.mockRejectedValue(new ErroreNonAutenticato());

    const pagina = (await PreventivatorePage({
      searchParams: Promise.resolve({ modello: 'LIB-ESS-01' }),
    })) as ReactElement<PropsPreventivatore>;

    expect(pagina.props.moduliIniziali).toBeUndefined();
    expect(pagina.props.codiceModelloOrigine).toBeUndefined();
  });

  it('/preventivatore?modello=LIB-ESS-01 con sessione senza permesso si comporta allo stesso modo', async () => {
    mock.richiediContesto.mockRejectedValue(new ErroreAccessoNegato('catalogo', 'leggi'));

    const pagina = (await PreventivatorePage({
      searchParams: Promise.resolve({ modello: 'LIB-ESS-01' }),
    })) as ReactElement<PropsPreventivatore>;

    expect(pagina.props.moduliIniziali).toBeUndefined();
  });
});
