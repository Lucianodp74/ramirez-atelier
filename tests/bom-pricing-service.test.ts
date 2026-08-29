import { beforeEach, describe, expect, it, vi } from 'vitest';
const { dettaglioBom } = vi.hoisted(() => ({ dettaglioBom: vi.fn() }));
vi.mock('@/server/services/bom-service', () => ({ dettaglioBom }));
import { calcolaPrezzoBom, riepilogoCostoBom } from '@/server/services/bom-pricing-service';

describe('calcolaPrezzoBom', () => {
  it('calcola ricarico, costi fissi, sconto e IVA senza inventare valori', () => {
    expect(calcolaPrezzoBom(100,{ricaricoPercentuale:20,costiFissi:10,scontoPercentuale:10,ivaPercentuale:22})).toEqual({costoProduzione:100,costiFissi:10,lavorazioni:0,manodopera:0,spese:0,costiAggiuntivi:10,baseConRicarico:130,sconto:13,imponibile:117,iva:25.74,totale:142.74,ricaricoPercentuale:20,scontoPercentuale:10,ivaPercentuale:22});
  });
  it('calcola separatamente lavorazioni, manodopera e spese prima del ricarico', () => expect(calcolaPrezzoBom(1000,{lavorazioni:150,manodopera:200,spese:50,ricaricoPercentuale:25})).toMatchObject({costoProduzione:1000,costiAggiuntivi:400,baseConRicarico:1650,totale:1650}));
  it('usa zero come default per i parametri economici omessi',()=>expect(calcolaPrezzoBom(125)).toMatchObject({costoProduzione:125,costiFissi:0,costiAggiuntivi:0,totale:125}));
  it('rifiuta percentuali e importi non validi',()=>{expect(()=>calcolaPrezzoBom(100,{ricaricoPercentuale:101})).toThrow();expect(()=>calcolaPrezzoBom(100,{scontoPercentuale:-1})).toThrow();expect(()=>calcolaPrezzoBom(100,{ivaPercentuale:Number.NaN})).toThrow();expect(()=>calcolaPrezzoBom(-1)).toThrow();expect(()=>calcolaPrezzoBom(100,{costiFissi:-1})).toThrow();});
});
describe('riepilogoCostoBom',()=>{beforeEach(()=>dettaglioBom.mockReset());it('somma solo i costi presenti e ordina le categorie per totale',async()=>{dettaglioBom.mockResolvedValue({righe:[{categoria:'Pannelli',quantita:2,costoUnitario:50},{categoria:'Ferramenta',quantita:5,costoUnitario:4},{categoria:'Pannelli',quantita:1,costoUnitario:20},{categoria:'Finiture',quantita:1,costoUnitario:null}]});await expect(riepilogoCostoBom('tenant-1','bom-1')).resolves.toEqual({righeConCosto:3,righeSenzaCosto:1,subtotale:140,categorie:[{categoria:'Pannelli',totale:120,righe:2},{categoria:'Ferramenta',totale:20,righe:1}],completo:false});});it('considera completa una BOM non vuota quando tutte le righe hanno costo',async()=>{dettaglioBom.mockResolvedValue({righe:[{categoria:'Pannelli',quantita:3,costoUnitario:10}]});await expect(riepilogoCostoBom('tenant-1','bom-2')).resolves.toMatchObject({righeConCosto:1,righeSenzaCosto:0,subtotale:30,completo:true});});it('restituisce null quando la BOM non appartiene al tenant o non esiste',async()=>{dettaglioBom.mockResolvedValue(null);await expect(riepilogoCostoBom('tenant-1','bom-404')).resolves.toBeNull();});});
