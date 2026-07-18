import type { EventoAttivita } from '@prisma/client';

const ETICHETTA_ATTORE: Record<string, string> = {
  CLIENTE: 'Cliente',
  TITOLARE: 'Titolare',
  SISTEMA: 'Sistema',
};

export function TimelineEventi({ eventi }: { eventi: EventoAttivita[] }) {
  if (eventi.length === 0) {
    return <p className="text-sm text-muted-foreground">Nessun evento registrato.</p>;
  }

  return (
    <ol className="space-y-4 border-l border-border pl-4">
      {eventi.map((evento) => (
        <li key={evento.id} className="relative">
          <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-accent" />
          <p className="text-sm">{evento.descrizione}</p>
          <p className="text-xs text-muted-foreground">
            {ETICHETTA_ATTORE[evento.attore] ?? evento.attore} ·{' '}
            {new Date(evento.createdAt).toLocaleString('it-IT')}
          </p>
        </li>
      ))}
    </ol>
  );
}
