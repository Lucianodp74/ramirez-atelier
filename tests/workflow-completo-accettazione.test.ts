import { describe, expect, it } from 'vitest';
import { transizioneAmmessa } from '@/lib/workflow';
import { transizioneCommessaAmmessa } from '@/server/services/commessa-service';

describe('collaudo accettazione workflow Ramirez Atelier', () => {
  it('consente il percorso richiesta → preventivo inviato → richiesta convertita', () => {
    expect(transizioneAmmessa('NUOVA', 'IN_REVISIONE')).toBe(true);
    expect(transizioneAmmessa('IN_REVISIONE', 'PREVENTIVO_INVIATO')).toBe(true);
    expect(transizioneAmmessa('PREVENTIVO_INVIATO', 'CONVERTITA')).toBe(true);
  });

  it('impedisce di saltare la revisione o inviare un preventivo prima della revisione', () => {
    expect(transizioneAmmessa('NUOVA', 'PREVENTIVO_INVIATO')).toBe(false);
    expect(transizioneAmmessa('NUOVA', 'CONVERTITA')).toBe(false);
    expect(transizioneAmmessa('IN_REVISIONE', 'CONVERTITA')).toBe(false);
    expect(transizioneAmmessa('BOZZA', 'NUOVA')).toBe(false);
  });

  it('consente la produzione solo attraverso gli stati operativi previsti fino alla consegna', () => {
    expect(transizioneCommessaAmmessa('DA_AVVIARE', 'IN_PRODUZIONE')).toBe(true);
    expect(transizioneCommessaAmmessa('IN_PRODUZIONE', 'PRONTA')).toBe(true);
    expect(transizioneCommessaAmmessa('PRONTA', 'CONSEGNATA')).toBe(true);
    expect(transizioneCommessaAmmessa('CONSEGNATA', 'CHIUSA')).toBe(true);
  });

  it('impedisce consegna anticipata, chiusura prima della consegna e riapertura', () => {
    expect(transizioneCommessaAmmessa('DA_AVVIARE', 'PRONTA')).toBe(false);
    expect(transizioneCommessaAmmessa('IN_PRODUZIONE', 'CONSEGNATA')).toBe(false);
    expect(transizioneCommessaAmmessa('PRONTA', 'CHIUSA')).toBe(false);
    expect(transizioneCommessaAmmessa('CHIUSA', 'IN_PRODUZIONE')).toBe(false);
    expect(transizioneCommessaAmmessa('ANNULLATA', 'IN_PRODUZIONE')).toBe(false);
  });
});
