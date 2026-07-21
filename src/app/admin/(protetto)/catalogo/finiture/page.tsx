import Link from 'next/link';
import { richiediContesto } from '@/server/identity/contesto';
import { elencoFiniture, categorieEsistenti } from '@/server/services/catalogo-service';
import { Card, CardContent } from '@/components/ui/card';
import { FormFinitura } from '@/components/admin/FormFinitura';
import { RigaFinitura } from '@/components/admin/RigaFinitura';

export const dynamic = 'force-dynamic';

export default async function FinitureePage() {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });
  const [finiture, categorie] = await Promise.all([
    elencoFiniture(contesto.tenantId),
    categorieEsistenti(contesto.tenantId),
  ]);

  // Almeno una categoria di partenza nel selettore, anche a catalogo vuoto -
  // altrimenti il primo titolare di un nuovo tenant non avrebbe nulla da
  // scegliere per la sua prima finitura (Time to First Value).
  const categorieForm = categorie.length > 0 ? categorie : ['legno'];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/admin/catalogo" className="text-sm text-muted-foreground hover:underline">
        ← Catalogo Tecnico
      </Link>
      <h1 className="mb-2 mt-2 text-2xl font-semibold tracking-tight">Finiture</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Aggiungi, modifica o disattiva le finiture visibili nel configuratore. Una finitura già
        usata in una richiesta non può essere cancellata, solo disattivata — lo storico resta sempre
        leggibile.
      </p>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <FormFinitura categorieEsistenti={categorieForm} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-normal">Finitura</th>
                <th className="px-4 py-3 font-normal">Categoria</th>
                <th className="px-4 py-3 font-normal">Stato</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {finiture.map((f) => (
                <RigaFinitura key={f.id} finitura={f} categorieEsistenti={categorieForm} />
              ))}
              {finiture.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Nessuna finitura ancora. Aggiungine una dal modulo sopra.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
