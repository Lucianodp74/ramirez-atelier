import { db } from '@/server/db';

export type BenchmarkPrezzo = {
  id: string;
  categoria: string;
  codice: string;
  nome: string;
  descrizione: string | null;
  unita: string;
  tipo: 'COSTO' | 'PREZZO_VENDITA';
  prezzoMin: number;
  prezzoMax: number;
  valuta: string;
  fonte: string;
  fonteUrl: string;
  rilevatoIl: Date;
  note: string | null;
  attivo: boolean;
};

export async function elencoBenchmarkPrezzi(tenantId: string): Promise<BenchmarkPrezzo[]> {
  return db.$queryRaw<BenchmarkPrezzo[]>`
    SELECT
      "id",
      "categoria",
      "codice",
      "nome",
      "descrizione",
      "unita",
      "tipo",
      "prezzoMin"::float8 AS "prezzoMin",
      "prezzoMax"::float8 AS "prezzoMax",
      "valuta",
      "fonte",
      "fonteUrl",
      "rilevatoIl",
      "note",
      "attivo"
    FROM "benchmark_prezzo"
    WHERE "tenantId" = ${tenantId}
      AND "attivo" = true
    ORDER BY
      CASE "tipo" WHEN 'COSTO' THEN 0 ELSE 1 END,
      "categoria",
      "nome"
  `;
}
