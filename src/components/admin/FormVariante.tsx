'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { CampoPersonalizzabile } from '@/server/services/variante-preimpostata-service';

interface VarianteEsistente {
  id: string;
  nome: string;
  descrizione: string | null;
  scelte: Record<string, string>;
  ordinamento: number;
}

interface Dati {
  tipoProgettoId: string;
  nome: string;
  descrizione?: string | null;
  scelte: Record<string, string>;
  ordinamento?: number;
}

interface Props {
  tipoProgettoId: string;
  campiPersonalizzabili: CampoPersonalizzabile[];
  varianteEsistente?: VarianteEsistente;
  azioneCrea: (dati: Dati) => Promise<unknown>;
  azioneAggiorna: (id: string, dati: Partial<Omit<Dati, 'tipoProgettoId'>>) => Promise<unknown>;
  onCompletato?: () => void;
}

/** Non chiede mai "quale strategia di configurazione" - solo un nome, una
 * descrizione facoltativa, e per ciascun campo guidato da catalogo (materiale,
 * ferramenta...) un menu con l'opzione "non specificato" di default: il
 * titolare precompila solo ciò che vuole davvero fissare, il resto resta
 * libero per il cliente (Configurazione a Valore). */
export function FormVariante({
  tipoProgettoId,
  campiPersonalizzabili,
  varianteEsistente,
  azioneCrea,
  azioneAggiorna,
  onCompletato,
}: Props) {
  const router = useRouter();
  const modificaEsistente = !!varianteEsistente;

  const [nome, setNome] = useState(varianteEsistente?.nome ?? '');
  const [descrizione, setDescrizione] = useState(varianteEsistente?.descrizione ?? '');
  const [scelte, setScelte] = useState<Record<string, string>>(varianteEsistente?.scelte ?? {});
  const [inCorso, iniziaTransizione] = useTransition();

  function invia(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;

    const sceltePulite = Object.fromEntries(Object.entries(scelte).filter(([, v]) => v));

    iniziaTransizione(async () => {
      if (modificaEsistente) {
        await azioneAggiorna(varianteEsistente.id, {
          nome: nome.trim(),
          descrizione: descrizione.trim() || null,
          scelte: sceltePulite,
        });
      } else {
        await azioneCrea({
          tipoProgettoId,
          nome: nome.trim(),
          descrizione: descrizione.trim() || null,
          scelte: sceltePulite,
        });
        setNome('');
        setDescrizione('');
        setScelte({});
      }
      router.refresh();
      onCompletato?.();
    });
  }

  return (
    <form onSubmit={invia} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="nome-variante">Nome dello stile</Label>
          <Input
            id="nome-variante"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="es. Stile Classico Noce"
          />
        </div>
        <div>
          <Label htmlFor="descrizione-variante">Descrizione (facoltativa)</Label>
          <Input
            id="descrizione-variante"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
          />
        </div>
      </div>

      {campiPersonalizzabili.length > 0 && (
        <div className="space-y-3 rounded-md border border-dashed border-border p-4">
          <p className="text-xs text-muted-foreground">
            Precompila solo ciò che vuoi fissare per questo stile — il resto resta libero per il
            cliente.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {campiPersonalizzabili.map((campo) => (
              <div key={campo.chiave}>
                <Label htmlFor={`variante-campo-${campo.chiave}`}>{campo.etichetta}</Label>
                <select
                  id={`variante-campo-${campo.chiave}`}
                  value={scelte[campo.chiave] ?? ''}
                  onChange={(e) =>
                    setScelte((prec) => ({ ...prec, [campo.chiave]: e.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
                >
                  <option value="">Non specificato — libero per il cliente</option>
                  {campo.opzioni.map((o) => (
                    <option key={o.valore} value={o.valore}>
                      {o.etichetta}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={inCorso}>
          {inCorso ? 'Salvataggio…' : modificaEsistente ? 'Salva modifiche' : 'Crea stile'}
        </Button>
        {onCompletato && (
          <Button type="button" variant="outline" onClick={onCompletato}>
            Annulla
          </Button>
        )}
      </div>
    </form>
  );
}
