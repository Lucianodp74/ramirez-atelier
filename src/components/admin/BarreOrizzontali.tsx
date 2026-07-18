interface Riga {
  etichetta: string;
  valore: number;
}

export function BarreOrizzontali({
  righe,
  formattaValore,
}: {
  righe: Riga[];
  formattaValore?: (v: number) => string;
}) {
  const massimo = Math.max(...righe.map((r) => r.valore), 1);

  return (
    <div className="space-y-2">
      {righe.map((r) => (
        <div key={r.etichetta} className="flex items-center gap-3 text-sm">
          <span className="w-40 shrink-0 truncate text-muted-foreground">{r.etichetta}</span>
          <div className="h-2 flex-1 rounded-full bg-secondary/40">
            <div
              className="h-2 rounded-full bg-accent"
              style={{ width: `${Math.max((r.valore / massimo) * 100, 2)}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right font-medium">
            {formattaValore ? formattaValore(r.valore) : r.valore}
          </span>
        </div>
      ))}
      {righe.length === 0 && (
        <p className="text-sm text-muted-foreground">Nessun dato nel periodo selezionato.</p>
      )}
    </div>
  );
}
