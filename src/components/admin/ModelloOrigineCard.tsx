import Link from 'next/link';
import { leggiModelloOrigine } from '@/lib/catalogo-librerie/modello-origine';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Modello di catalogo da cui il cliente è partito. Compare solo quando la
 * richiesta lo riporta: nessuna scheda per le richieste nate senza catalogo.
 */
export function ModelloOrigineCard({ datiEstensione }: { datiEstensione: unknown }) {
  const origine = leggiModelloOrigine(datiEstensione);
  if (!origine) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modello di partenza</CardTitle>
        <p className="text-sm text-muted-foreground">
          Modello del Catalogo Librerie scelto dal cliente prima di configurare.
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {origine.codice} · {origine.nomeFamiglia}
          </p>
          <p className="font-medium">{origine.nome}</p>
          <Link
            href={`/librerie/${origine.codice}`}
            className="text-sm text-primary hover:underline"
          >
            Apri la scheda del modello
          </Link>
        </div>
        <Badge variant={origine.personalizzato ? 'accent' : 'outline'}>
          {origine.personalizzato ? 'Personalizzato dal cliente' : 'Configurazione originale'}
        </Badge>
      </CardContent>
    </Card>
  );
}
