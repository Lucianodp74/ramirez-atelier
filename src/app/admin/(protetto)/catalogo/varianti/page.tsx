import Link from 'next/link';
import { richiediContesto } from '@/server/identity/contesto';
import { db } from '@/server/db';
import {
  elencoVarianti,
  campiPersonalizzabiliPerTipoProgetto,
} from '@/server/services/variante-preimpostata-service';
import {
  creaVarianteAzione,
  aggiornaVarianteAzione,
  impostaAttivaVarianteAzione,
  eliminaVarianteAzione,
} from '@/app/admin/azioni';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormVariante } from '@/components/admin/FormVariante';
import { RigaVariante } from '@/components/admin/RigaVariante';

export const dynamic = 'force-dynamic';

export default async function VariantiPage() {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });

  const tipiProgetto = await db.tipoProgetto.findMany({
    where: { tenantId: contesto.tenantId, attivo: true },
  });

  const sezioni = await Promise.all(
    tipiProgetto.map(async (tp) => ({
      tipoProgetto: tp,
      varianti: await elencoVarianti(contesto.tenantId, tp.id),
      campiPersonalizzabili: await campiPersonalizzabiliPerTipoProgetto(contesto.tenantId, tp.id),
    })),
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/admin/catalogo" className="text-sm text-muted-foreground hover:underline">
        ← Catalogo Tecnico
      </Link>
      <h1 className="mb-2 mt-2 text-2xl font-semibold tracking-tight">Stili di partenza</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Combinazioni pronte che il cliente può scegliere come primo passo del configuratore, invece
        di partire da zero. Senza nessuno stile qui sotto, quel passaggio del wizard non compare
        affatto.
      </p>

      <div className="space-y-10">
        {sezioni.map(({ tipoProgetto, varianti, campiPersonalizzabili }) => (
          <div key={tipoProgetto.id}>
            <h2 className="mb-4 text-lg font-medium">{tipoProgetto.nome}</h2>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  Nuovo stile per {tipoProgetto.nome}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormVariante
                  tipoProgettoId={tipoProgetto.id}
                  campiPersonalizzabili={campiPersonalizzabili}
                  azioneCrea={creaVarianteAzione}
                  azioneAggiorna={aggiornaVarianteAzione}
                />
              </CardContent>
            </Card>

            <div className="space-y-3">
              {varianti.map((v) => (
                <RigaVariante
                  key={v.id}
                  variante={{ ...v, scelte: (v.scelte as Record<string, string>) ?? {} }}
                  tipoProgettoId={tipoProgetto.id}
                  campiPersonalizzabili={campiPersonalizzabili}
                  azioneCrea={creaVarianteAzione}
                  azioneAggiorna={aggiornaVarianteAzione}
                  azioneImpostaAttiva={impostaAttivaVarianteAzione}
                  azioneElimina={eliminaVarianteAzione}
                />
              ))}
              {varianti.length === 0 && (
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Nessuno stile ancora per {tipoProgetto.nome}.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
