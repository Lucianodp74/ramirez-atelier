import { elencoSpese } from '@/server/services/spesa-service';
import { richiediContesto } from '@/server/identity/contesto';
import { GestioneSpese } from '@/components/admin/GestioneSpese';

export const dynamic = 'force-dynamic';

export default async function SpesePage() {
  const contesto = await richiediContesto({ modulo: 'spese', azione: 'leggi' });
  const spese = await elencoSpese(contesto.tenantId);

  const speseSerializzate = spese.map((s) => ({
    id: s.id,
    nome: s.nome,
    importoMensile: Number(s.importoMensile),
  }));

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Spese</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Un primo quadro dei costi mensili ricorrenti dell&apos;atelier — personale, affitto, utenze,
        e qualunque altra voce ricorrente. Non calcola ancora il costo di una singola commessa: dà
        solo una prima visibilità sul totale mensile, un punto di partenza, non un gestionale
        completo.
      </p>

      <GestioneSpese speseIniziali={speseSerializzate} />
    </div>
  );
}
