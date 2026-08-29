import { describe, expect, it } from 'vitest';
import {
  prossimiStatiCommessa,
  transizioneCommessaAmmessa,
} from './commessa-service';

describe('workflow commessa', () => {
  it('consente il percorso lineare della produzione', () => {
    expect(prossimiStatiCommessa('DA_AVVIARE')).toEqual(['IN_PRODUZIONE', 'ANNULLATA']);
    expect(transizioneCommessaAmmessa('DA_AVVIARE', 'IN_PRODUZIONE')).toBe(true);
    expect(transizioneCommessaAmmessa('IN_PRODUZIONE', 'PRONTA')).toBe(true);
    expect(transizioneCommessaAmmessa('PRONTA', 'CONSEGNATA')).toBe(true);
    expect(transizioneCommessaAmmessa('CONSEGNATA', 'CHIUSA')).toBe(true);
  });

  it('non consente salti all'indietro o chiusure premature', () => {
    expect(transizioneCommessaAmmessa('DA_AVVIARE', 'PRONTA')).toBe(false);
    expect(transizioneCommessaAmmessa('IN_PRODUZIONE', 'CONSEGNATA')).toBe(false);
    expect(transizioneCommessaAmmessa('PRONTA', 'IN_PRODUZIONE')).toBe(false);
    expect(transizioneCommessaAmmessa('CHIUSA', 'IN_PRODUZIONE')).toBe(false);
  });
});
