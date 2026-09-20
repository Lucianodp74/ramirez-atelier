import Link from 'next/link';
import { richiediContesto } from '@/server/identity/contesto';
import { elencoProgettiPreimpostati } from '@/server/services/progetto-preimpostato-service';
import {
  creaProgettoPreimpostatoAzione,
  aggiornaProgettoPreimpostatoAzione,
  impostaPubblicazioneProgettoPreimpostatoAzione,
  eliminaProgettoPreimpostatoAzione,
} from '@/app/admin/azioni';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormProgettoPreimpostato } from '@/components/admin/FormProgettoPreimpostato';
import { RigaProgettoPreimpostato } from '@/components/admin/RigaProgettoPreimpostato';

export const dynamic = 'force-dynamic';

export default async function ProgettiPreimpostatiPage() {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });
  const progetti = await elencoProgettiPreimpostati(contesto.tenantId);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/admin/catalogo" className="text-sm text-muted-foreground hover:underline">
        ← Catalogo Tecnico
      </Link>
      <h1 className="mb-2 mt-2 text-2xl font-semibold tracking-tight">Progetti preimpostati</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Catalogo di progetti pronti che il cliente può scegliere come punto di partenza del
        Preventivatore, invece di configurare tutto da zero. Solo i progetti pubblicati compaiono
        nella galleria pubblica. Nessun prezzo viene salvato qui: la stima è sempre calcolata dal
        Preventivatore con il Listino corrente al momento della selezione.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Nuovo progetto preimpostato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormProgettoPreimpostato
            azioneCrea={creaProgettoPreimpostatoAzione}
            azioneAggiorna={aggiornaProgettoPreimpostatoAzione}
          />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {progetti.map((p) => (
          <RigaProgettoPreimpostato
            key={p.id}
            progetto={p}
            azioneCrea={creaProgettoPreimpostatoAzione}
            azioneAggiorna={aggiornaProgettoPreimpostatoAzione}
            azioneImpostaPubblicazione={impostaPubblicazioneProgettoPreimpostatoAzione}
            azioneElimina={eliminaProgettoPreimpostatoAzione}
          />
        ))}
        {progetti.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Nessun progetto preimpostato ancora.
          </p>
        )}
      </div>
    </div>
  );
}
