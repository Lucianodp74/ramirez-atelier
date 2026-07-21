import Link from 'next/link';
import { richiediContesto } from '@/server/identity/contesto';
import {
  elencoAccessori,
  categorieAccessorioEsistenti,
} from '@/server/services/accessorio-service';
import {
  creaAccessorioAzione,
  aggiornaAccessorioAzione,
  impostaAttivaAccessorioAzione,
  eliminaAccessorioAzione,
} from '@/app/admin/azioni';
import { Card, CardContent } from '@/components/ui/card';
import { FormCatalogoSemplice } from '@/components/admin/FormCatalogoSemplice';
import { RigaCatalogoSemplice } from '@/components/admin/RigaCatalogoSemplice';

export const dynamic = 'force-dynamic';

export default async function AccessoriPage() {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });
  const [righe, categorie] = await Promise.all([
    elencoAccessori(contesto.tenantId),
    categorieAccessorioEsistenti(contesto.tenantId),
  ]);
  const categorieForm = categorie.length > 0 ? categorie : ['interni_cabina'];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/admin/catalogo" className="text-sm text-muted-foreground hover:underline">
        ← Catalogo Tecnico
      </Link>
      <h1 className="mb-2 mt-2 text-2xl font-semibold tracking-tight">Accessori</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Attrezzature interne, illuminazione ed elettrodomestici visibili nel configuratore.
      </p>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <FormCatalogoSemplice
            categorieEsistenti={categorieForm}
            azioneCrea={creaAccessorioAzione}
            azioneAggiorna={aggiornaAccessorioAzione}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-normal">Nome</th>
                <th className="px-4 py-3 font-normal">Categoria</th>
                <th className="px-4 py-3 font-normal">Stato</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {righe.map((r) => (
                <RigaCatalogoSemplice
                  key={r.id}
                  riga={r}
                  categorieEsistenti={categorieForm}
                  azioneCrea={creaAccessorioAzione}
                  azioneAggiorna={aggiornaAccessorioAzione}
                  azioneImpostaAttiva={impostaAttivaAccessorioAzione}
                  azioneElimina={eliminaAccessorioAzione}
                />
              ))}
              {righe.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Nessun accessorio ancora. Aggiungine uno dal modulo sopra.
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
