import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const anteprima = vi.hoisted(() => vi.fn());

vi.mock('@/server/services/catalogo-librerie-accesso', () => ({
  anteprimaInternaConsentita: anteprima,
}));

import type { ModelloLibreria, StatoModello } from '@/lib/catalogo-librerie/catalogo';
import { moduliPreventivatoreDa } from '@/lib/catalogo-librerie/composizione';
import { modelloOriginePerRichiesta } from '@/server/services/modello-origine-service';

function modello(stato: StatoModello, codice: string): ModelloLibreria {
  return {
    codice,
    nome: 'Modello di prova',
    famiglia: 'ATELIER',
    descrizione: 'Solo per i test.',
    stato,
    dimostrativo: false,
    componibile: false,
    immagini: [],
    composizione: {
      profonditaCm: 40,
      schienale: true,
      materiale: 'TRUCIOLARE',
      finitura: 'MELAMINICO',
      colonne: [
        { id: 'c1', larghezzaCm: 90, vani: [{ tipo: 'VANO_APERTO', altezzaCm: 200, ripiani: 4 }] },
      ],
    },
  };
}

const BOZZA = 'LIB-TST-01';
const APPROVATO = 'LIB-TST-02';
const NON_DISPONIBILE = 'LIB-TST-03';
const catalogo = [
  modello('BOZZA', BOZZA),
  modello('APPROVATO', APPROVATO),
  modello('NON_DISPONIBILE', NON_DISPONIBILE),
];
const moduli = moduliPreventivatoreDa(APPROVATO, catalogo[1].composizione);
const risolvi = (codice: unknown) => modelloOriginePerRichiesta(codice, moduli, catalogo);

describe("modello d'origine per una richiesta — permessi ed errori", () => {
  let erroriRegistrati: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    anteprima.mockReset();
    erroriRegistrati = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    erroriRegistrati.mockRestore();
  });

  describe('modello pubblicabile', () => {
    it('viene registrato senza nemmeno verificare il permesso di anteprima', async () => {
      await expect(risolvi(APPROVATO)).resolves.toMatchObject({ codice: APPROVATO });
      expect(anteprima).not.toHaveBeenCalled();
    });

    it('viene registrato anche se il controllo permessi sarebbe fuori uso', async () => {
      anteprima.mockRejectedValue(new Error('database non raggiungibile'));

      await expect(risolvi(APPROVATO)).resolves.toMatchObject({ codice: APPROVATO });
      expect(anteprima).not.toHaveBeenCalled();
      expect(erroriRegistrati).not.toHaveBeenCalled();
    });
  });

  describe('modello in bozza', () => {
    it('viene registrato per chi ha il permesso di anteprima', async () => {
      anteprima.mockResolvedValue(true);

      await expect(risolvi(BOZZA)).resolves.toMatchObject({ codice: BOZZA });
      expect(anteprima).toHaveBeenCalledOnce();
    });

    it('non viene registrato per chi non ha il permesso', async () => {
      anteprima.mockResolvedValue(false);

      await expect(risolvi(BOZZA)).resolves.toBeNull();
    });

    it('non viene registrato se il controllo permessi fallisce, e non lancia', async () => {
      anteprima.mockRejectedValue(new Error('database non raggiungibile'));

      await expect(risolvi(BOZZA)).resolves.toBeNull();
      expect(erroriRegistrati).toHaveBeenCalledOnce();
    });

    it('non viene registrato se il controllo permessi restituisce un valore inatteso', async () => {
      // Solo `true` autorizza: qualunque altro esito del controllo non apre le bozze.
      for (const esito of [undefined, null, 'true', 1, {}]) {
        anteprima.mockResolvedValueOnce(esito);
        await expect(risolvi(BOZZA), String(esito)).resolves.toBeNull();
      }
    });
  });

  describe('codici che non possono essere registrati', () => {
    it('ignora modelli non disponibili, anche con il permesso di anteprima', async () => {
      anteprima.mockResolvedValue(true);

      await expect(risolvi(NON_DISPONIBILE)).resolves.toBeNull();
      expect(anteprima).not.toHaveBeenCalled();
    });

    it('ignora codici inesistenti, malformati o non testuali senza verificare permessi', async () => {
      anteprima.mockResolvedValue(true);

      for (const codice of ['LIB-ZZZ-99', 'non-un-codice', '', undefined, null, 42, {}, []]) {
        await expect(risolvi(codice), String(codice)).resolves.toBeNull();
      }
      expect(anteprima).not.toHaveBeenCalled();
    });
  });

  it('non lancia mai, nemmeno con una configurazione inattesa', async () => {
    const moduliRotti = null as unknown as typeof moduli;

    await expect(modelloOriginePerRichiesta(APPROVATO, moduliRotti, catalogo)).resolves.toBeNull();
    expect(erroriRegistrati).toHaveBeenCalledOnce();
  });
});
