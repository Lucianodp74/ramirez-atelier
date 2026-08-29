import { db } from '@/server/db';

export type ComposizioneListino = { id:string; codice:string; nome:string; descrizione:string|null; prezzo:number; materiale:string|null; larghezzaCm:number|null; altezzaCm:number|null; profonditaCm:number|null };
export type ComponenteListino = { id:string; tipo:'MATERIALE'|'COMPONENTE'; codice:string; nome:string; unita:string; prezzo:number; materiale:string|null };
export type RigaComposizione = { id:string; componenteId:string; codice:string; nome:string; tipo:'MATERIALE'|'COMPONENTE'; unita:string; quantita:number; costoUnitario:number; costoTotale:number };

export async function dettaglioComposizioneListino(tenantId:string, composizioneId:string){
 const composizioni=await db.$queryRaw<ComposizioneListino[]>`SELECT "id","codice","nome","descrizione","prezzo"::float8 AS "prezzo","materiale","larghezzaCm"::float8 AS "larghezzaCm","altezzaCm"::float8 AS "altezzaCm","profonditaCm"::float8 AS "profonditaCm" FROM "listino_prezzo" WHERE "tenantId"=${tenantId} AND "id"=${composizioneId} AND "tipo"='COMPOSIZIONE' LIMIT 1`;
 if(composizioni.length===0)return null;
 const righe=await db.$queryRaw<RigaComposizione[]>`SELECT r."id",r."componenteId",p."codice",p."nome",p."tipo",p."unita",r."quantita"::float8 AS "quantita",r."costoUnitario"::float8 AS "costoUnitario",(r."quantita"*r."costoUnitario")::float8 AS "costoTotale" FROM "listino_composizione_riga" r JOIN "listino_prezzo" p ON p."id"=r."componenteId" AND p."tenantId"=r."tenantId" WHERE r."tenantId"=${tenantId} AND r."composizioneId"=${composizioneId} ORDER BY p."tipo",p."nome"`;
 return {composizione:composizioni[0],righe,costoDistinta:righe.reduce((t,r)=>t+r.costoTotale,0)};
}
export async function elencoComponentiPerComposizione(tenantId:string, composizioneId:string):Promise<ComponenteListino[]>{
 return db.$queryRaw<ComponenteListino[]>`SELECT "id","tipo","codice","nome","unita","prezzo"::float8 AS "prezzo","materiale" FROM "listino_prezzo" WHERE "tenantId"=${tenantId} AND "attivo"=true AND "id"<>${composizioneId} AND "tipo" IN ('MATERIALE','COMPONENTE') ORDER BY "tipo","nome"`;
}
export async function aggiungiRigaComposizione(tenantId:string,composizioneId:string,componenteId:string,quantita:number){
 if(!Number.isFinite(quantita)||quantita<=0)throw new Error('Quantità non valida.');
 const componenti=await db.$queryRaw<Array<{prezzo:number}>>`SELECT "prezzo"::float8 AS "prezzo" FROM "listino_prezzo" WHERE "tenantId"=${tenantId} AND "id"=${componenteId} AND "attivo"=true AND "tipo" IN ('MATERIALE','COMPONENTE') LIMIT 1`;
 if(componenti.length===0)throw new Error('Componente non trovato o non attivo.');
 const composizioni=await db.$queryRaw<Array<{id:string}>>`SELECT "id" FROM "listino_prezzo" WHERE "tenantId"=${tenantId} AND "id"=${composizioneId} AND "tipo"='COMPOSIZIONE' LIMIT 1`;
 if(composizioni.length===0)throw new Error('Composizione non trovata.');
 await db.$executeRaw`INSERT INTO "listino_composizione_riga" ("id","tenantId","composizioneId","componenteId","quantita","costoUnitario") VALUES (${crypto.randomUUID()},${tenantId},${composizioneId},${componenteId},${quantita},${componenti[0].prezzo}) ON CONFLICT ("tenantId","composizioneId","componenteId") DO UPDATE SET "quantita"=EXCLUDED."quantita","updatedAt"=CURRENT_TIMESTAMP`;
}
export async function aggiornaRigaComposizione(tenantId:string,rigaId:string,quantita:number){if(!Number.isFinite(quantita)||quantita<=0)throw new Error('Quantità non valida.');const n=await db.$executeRaw`UPDATE "listino_composizione_riga" SET "quantita"=${quantita},"updatedAt"=CURRENT_TIMESTAMP WHERE "tenantId"=${tenantId} AND "id"=${rigaId}`;if(n===0)throw new Error('Riga composizione non trovata.');}
export async function rimuoviRigaComposizione(tenantId:string,rigaId:string){const n=await db.$executeRaw`DELETE FROM "listino_composizione_riga" WHERE "tenantId"=${tenantId} AND "id"=${rigaId}`;if(n===0)throw new Error('Riga composizione non trovata.');}
