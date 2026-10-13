import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { moduliPerPreventivatore } from '@/lib/catalogo-librerie/catalogo';
import type { ModuloConfigurato } from '@/lib/preventivatore/moduli';

// Le azioni server non servono al primo rendering: nessun accesso al database.
vi.mock('@/app/preventivatore/azioni', () => ({
  calcolaStimaPreventivatore: vi.fn(),
  salvaRichiestaPreventivatore: vi.fn(),
}));

import { PreventivatoreModulare } from '@/components/preventivatore/PreventivatoreModulare';

/** Prima schermata del wizard, resa come HTML statico. */
function primaSchermata(
  props: { moduliIniziali?: ModuloConfigurato[]; codiceModelloOrigine?: string } = {},
) {
  return renderToStaticMarkup(<PreventivatoreModulare {...props} />);
}

/** true se il pulsante del tipo di progetto con questa etichetta è selezionato. */
function selezionato(html: string, etichetta: string): boolean {
  const pulsante = html
    .split('<button')
    .find((parte) => parte.includes(`<span class="text-sm font-medium">${etichetta}</span>`));
  if (!pulsante) throw new Error(`Pulsante "${etichetta}" non trovato.`);
  return pulsante.includes('lucide-check');
}

describe('PreventivatoreModulare — prima schermata', () => {
  it('aperto da LIB-ESS-01 mostra "Libreria" selezionata, non "Mobile su misura"', () => {
    const moduli = moduliPerPreventivatore('LIB-ESS-01', { anteprimaInterna: true })!;
    const html = primaSchermata({ moduliIniziali: moduli, codiceModelloOrigine: 'LIB-ESS-01' });
    expect(selezionato(html, 'Libreria')).toBe(true);
    expect(selezionato(html, 'Mobile su misura')).toBe(false);
  });

  it('senza moduli iniziali mostra "Mobile su misura" selezionato, come sempre', () => {
    const html = primaSchermata();
    expect(selezionato(html, 'Mobile su misura')).toBe(true);
    expect(selezionato(html, 'Libreria')).toBe(false);
  });

  it('con moduli iniziali non tutti librerie resta "Mobile su misura"', () => {
    const [libreria] = moduliPerPreventivatore('LIB-ESS-01', { anteprimaInterna: true })!;
    const base: ModuloConfigurato = { ...libreria, id: 'b1', tipo: 'BASE', altezzaCm: 80 };
    const html = primaSchermata({ moduliIniziali: [libreria, base] });
    expect(selezionato(html, 'Mobile su misura')).toBe(true);
    expect(selezionato(html, 'Libreria')).toBe(false);
  });
});
