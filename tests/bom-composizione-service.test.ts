import { beforeEach, describe, expect, it, vi } from 'vitest';
const { queryRaw, aggiungiRigaBom } = vi.hoisted(() => ({ queryRaw: vi.fn(), aggiungiRigaBom: vi.fn() }));
vi.mock('@/server/db', () => ({ db: { $queryRaw: queryRaw } }));
vi.mock('@/server/services/bom-service', () => ({ aggiungiRigaBom }));
import { aggiungiComposizioneABom, mappaRigaComposizioneInBom } from '@/server/services/bom-composizione-service';
beforeEach(() => { queryRaw.mockReset(); aggiungiRigaBom.mockReset(); });
describe('composizioni BOM', () => {
 it('mantiene quantità e costo snapshot', () => expect(mappaRigaComposizioneInBom({ componenteId:'x', categoria:'PANNELLO', codice:'P-1', descrizione:'Fianco', unita:'pz', quantita:2, materiale:'Betulla', costoUnitario:31.5 })).toEqual({ categoria:'PANNELLO', codice:'P-1', descrizione:'Fianco', unita:'pz', quantita:2, materiale:'Betulla', costoUnitario:31.5 }));
 it('trasferisce tutte le righe a una BOM BOZZA dello stesso tenant', async () => { queryRaw.mockResolvedValueOnce([{id:'bom',stato:'BOZZA'}]).mockResolvedValueOnce([{id:'comp'}]).mockResolvedValueOnce([{componenteId:'p1',categoria:'PANNELLO',codice:'P1',descrizione:'Fianco',unita:'pz',quantita:2,materiale:'Betulla',costoUnitario:31.5}]); aggiungiRigaBom.mockResolvedValue('riga'); await expect(aggiungiComposizioneABom('t','bom','comp')).resolves.toEqual({righeAggiunte:1}); expect(aggiungiRigaBom).toHaveBeenCalledWith('t','bom',{categoria:'PANNELLO',codice:'P1',descrizione:'Fianco',unita:'pz',quantita:2,materiale:'Betulla',costoUnitario:31.5}); });
 it('rifiuta BOM non modificabile', async () => { queryRaw.mockResolvedValueOnce([{id:'bom',stato:'CONFERMATA'}]); await expect(aggiungiComposizioneABom('t','bom','comp')).rejects.toThrow('La distinta non è più modificabile.'); expect(aggiungiRigaBom).not.toHaveBeenCalled(); });
});
