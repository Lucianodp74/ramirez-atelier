export type BomPrezzoInput = { ricaricoPercentuale?: number; costiFissi?: number; lavorazioni?: number; manodopera?: number; spese?: number; scontoPercentuale?: number; ivaPercentuale?: number };
export type BomPrezzoSummary = { costoProduzione:number; costiFissi:number; lavorazioni:number; manodopera:number; spese:number; costiAggiuntivi:number; baseConRicarico:number; sconto:number; imponibile:number; iva:number; totale:number; ricaricoPercentuale:number; scontoPercentuale:number; ivaPercentuale:number };
const arrotonda=(v:number)=>Math.round((v+Number.EPSILON)*1000)/1000;
const percentuale=(n:string,v:number)=>{if(!Number.isFinite(v)||v<0||v>100)throw new Error(`${n} deve essere compresa tra 0 e 100.`)};
const importo=(n:string,v:number)=>{if(!Number.isFinite(v)||v<0)throw new Error(`${n} deve essere maggiore o uguale a zero.`)};
export function calcolaPrezzoBom(costoProduzione:number,input:BomPrezzoInput={}):BomPrezzoSummary{
 importo('Il costo di produzione',costoProduzione); const ricaricoPercentuale=input.ricaricoPercentuale??0,costiFissi=input.costiFissi??0,lavorazioni=input.lavorazioni??0,manodopera=input.manodopera??0,spese=input.spese??0,scontoPercentuale=input.scontoPercentuale??0,ivaPercentuale=input.ivaPercentuale??0;
 percentuale('Il ricarico',ricaricoPercentuale); importo('I costi fissi',costiFissi); importo('Le lavorazioni',lavorazioni); importo('La manodopera',manodopera); importo('Le spese',spese); percentuale('Lo sconto',scontoPercentuale); percentuale("L'IVA",ivaPercentuale);
 const costiAggiuntivi=arrotonda(costiFissi+lavorazioni+manodopera+spese); const baseConRicarico=arrotonda(costoProduzione*(1+ricaricoPercentuale/100)+costiAggiuntivi); const sconto=arrotonda(baseConRicarico*scontoPercentuale/100); const imponibile=arrotonda(Math.max(0,baseConRicarico-sconto)); const iva=arrotonda(imponibile*ivaPercentuale/100); const totale=arrotonda(imponibile+iva);
 return {costoProduzione,costiFissi,lavorazioni,manodopera,spese,costiAggiuntivi,baseConRicarico,sconto,imponibile,iva,totale,ricaricoPercentuale,scontoPercentuale,ivaPercentuale};
}
