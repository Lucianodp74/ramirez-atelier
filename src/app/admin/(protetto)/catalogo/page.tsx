import Link from 'next/link';
import { redirect } from 'next/navigation';
import { richiediContesto } from '@/server/identity/contesto';
import { db } from '@/server/db';
import { elencoFiniture } from '@/server/services/catalogo-service';
import { elencoFerramenta } from '@/server/services/ferramenta-service';
import { elencoAccessori } from '@/server/services/accessorio-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const SEZIONI_CATALOGO = [
  { chiave: 'finiture', nome: 'Finiture', href: '/admin/catalogo/finiture' },
  { chiave: 'ferramenta', nome: 'Ferramenta', href: '/admin/catalogo/ferramenta' },
  { chiave: 'accessori', nome: 'Accessori', href: '/admin/catalogo/accessori' },
  { chiave: 'varianti', nome: 'Stili di partenza', href: '/admin/catalogo/varianti' },
];

export default async function CatalogoPage() {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });

  if (SEZIONI_CATALOGO.length === 1) redirect(SEZIONI_CATALOGO[0].href);

  const [finiture, ferramenta, accessori, varianti] = await Promise.all([
    elencoFiniture(contesto.tenantId),
    elencoFerramenta(contesto.tenantId),
    elencoAccessori(contesto.tenantId),
    db.variantePreimpostata.findMany({ where: { tenantId: contesto.tenantId } }),
  ]);

  const sezioni = [
    { ...SEZIONI_CATALOGO[0], righe: finiture },
    { ...SEZIONI_CATALOGO[1], righe: ferramenta },
    { ...SEZIONI_CATALOGO[2], righe: accessori },
    { ...SEZIONI_CATALOGO[3], righe: varianti },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Catalogo Tecnico</h1>
      <p className="mb-8 text-sm text-muted-foreground">Materiali, finiture e altri elementi scelti nel configuratore, gestiti dall&apos;area operativa.</p>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/catalogo/preventivatore">
          <Card className="h-full border-primary/30 transition-colors hover:border-primary">
            <CardHeader><CardTitle>Controllo Preventivatore</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Verifica che tutte le tariffe tecniche richieste dal motore siano presenti, attive e con l&apos;unità corretta.</p></CardContent>
          </Card>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sezioni.map((s) => {
          const attive = s.righe.filter((r) => r.attiva).length;
          return <Link key={s.chiave} href={s.href}><Card className="h-full transition-colors hover:border-accent"><CardHeader><CardTitle>{s.nome}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{attive} attiv{attive === 1 ? 'a' : 'e'} su {s.righe.length} total{s.righe.length === 1 ? 'e' : 'i'}</p></CardContent></Card></Link>;
        })}
        <Link href="/admin/catalogo/listino"><Card className="h-full transition-colors hover:border-accent"><CardHeader><CardTitle>Listino del falegname</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Prezzi reali interni, aggiornabili e storicizzati.</p></CardContent></Card></Link>
        <Link href="/admin/catalogo/benchmark"><Card className="h-full transition-colors hover:border-accent"><CardHeader><CardTitle>Listino benchmark</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Riferimenti di mercato separati dai costi reali.</p></CardContent></Card></Link>
      </div>
    </div>
  );
}
