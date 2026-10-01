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

  it("non consente salti all'indietro o chiusure premature", () => {
    expect(transizioneCommessaAmmessa('DA_AVVIARE', 'PRONTA')).toBe(false);
    expect(transizioneCommessaAmmessa('IN_PRODUZIONE', 'CONSEGNATA')).toBe(false);
    expect(transizioneCommessaAmmessa('PRONTA', 'IN_PRODUZIONE')).toBe(false);
    expect(transizioneCommessaAmmessa('CHIUSA', 'IN_PRODUZIONE')).toBe(false);
  });

  it('rende terminali gli stati chiusa e annullata', () => {
    expect(prossimiStatiCommessa('CHIUSA')).toEqual([]);
    expect(prossimiStatiCommessa('ANNULLATA')).toEqual([]);

    expect(transizioneCommessaAmmessa('CHIUSA', 'CHIUSA')).toBe(false);
    expect(transizioneCommessaAmmessa('CHIUSA', 'DA_AVVIARE')).toBe(false);
    expect(transizioneCommessaAmmessa('CHIUSA', 'IN_PRODUZIONE')).toBe(false);
    expect(transizioneCommessaAmmessa('CHIUSA', 'PRONTA')).toBe(false);
    expect(transizioneCommessaAmmessa('CHIUSA', 'CONSEGNATA')).toBe(false);
    expect(transizioneCommessaAmmessa('CHIUSA', 'ANNULLATA')).toBe(false);

    expect(transizioneCommessaAmmessa('ANNULLATA', 'DA_AVVIARE')).toBe(false);
    expect(transizioneCommessaAmmessa('ANNULLATA', 'IN_PRODUZIONE')).toBe(false);
    expect(transizioneCommessaAmmessa('ANNULLATA', 'PRONTA')).toBe(false);
    expect(transizioneCommessaAmmessa('ANNULLATA', 'CONSEGNATA')).toBe(false);
    expect(transizioneCommessaAmmessa('ANNULLATA', 'CHIUSA')).toBe(false);
  });

  it('non consente di raggiungere uno stato terminale prima della consegna', () => {
    expect(transizioneCommessaAmmessa('DA_AVVIARE', 'CHIUSA')).toBe(false);
    expect(transizioneCommessaAmmessa('IN_PRODUZIONE', 'CHIUSA')).toBe(false);
    expect(transizioneCommessaAmmessa('PRONTA', 'CHIUSA')).toBe(false);
    expect(transizioneCommessaAmmessa('DA_AVVIARE', 'CONSEGNATA')).toBe(false);
    expect(transizioneCommessaAmmessa('IN_PRODUZIONE', 'CONSEGNATA')).toBe(false);
  });
});
