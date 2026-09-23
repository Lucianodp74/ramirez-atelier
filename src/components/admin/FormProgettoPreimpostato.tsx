'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { ModuloConfigurato } from '@/lib/preventivatore/moduli';
import type { DatiProgettoPreimpostato } from '@/server/services/progetto-preimpostato-service';

interface ProgettoEsistente {
  id: string;
  nome: string;
  categoria: string;
  descrizione: string | null;
  immagine: string | null;
  moduli: unknown;
  ordinamento: number;
}

interface Props {
  progettoEsistente?: ProgettoEsistente;
  azioneCrea: (dati: DatiProgettoPreimpostato) => Promise<unknown>;
  azioneAggiorna: (id: string, dati: Partial<DatiProgettoPreimpostato>) => Promise<unknown>;
  onCompletato?: () => void;
}

/**
 * V1 volutamente minimale: nessun editor visuale dei moduli, solo un campo
 * JSON grezzo (lo stesso ModuloConfigurato[] già usato dal Preventivatore).
 * La validazione vera resta server-side, con le stesse funzioni già usate
 * da azioni.ts (validaInputModuli) - qui si controlla solo che il testo sia
 * JSON sintatticamente valido, per dare un errore leggibile prima di inviare.
 */
export function FormProgettoPreimpostato({
  progettoEsistente,
  azioneCrea,
  azioneAggiorna,
  onCompletato,
}: Props) {
  const router = useRouter();
  const modificaEsistente = !!progettoEsistente;

  const [nome, setNome] = useState(progettoEsistente?.nome ?? '');
  const [categoria, setCategoria] = useState(progettoEsistente?.categoria ?? '');
  const [descrizione, setDescrizione] = useState(progettoEsistente?.descrizione ?? '');
  const [immagine, setImmagine] = useState(progettoEsistente?.immagine ?? '');
  const [moduliTesto, setModuliTesto] = useState(
    progettoEsistente ? JSON.stringify(progettoEsistente.moduli, null, 2) : '[]',
  );
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, iniziaTransizione] = useTransition();

  function invia(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    if (!nome.trim() || !categoria.trim()) return;

    let moduli: ModuloConfigurato[];
    try {
      const parsed = JSON.parse(moduliTesto);
      if (!Array.isArray(parsed)) throw new Error('I moduli devono essere un elenco (array JSON).');
      // Il tipo qui è solo per far combaciare la firma con il service: la
      // validazione vera (validaInputModuli/validaModulo, le stesse già
      // usate dal Preventivatore) avviene sempre server-side, non qui.
      moduli = parsed as ModuloConfigurato[];
    } catch (e) {
      setErrore(e instanceof Error ? `JSON moduli non valido: ${e.message}` : 'JSON moduli non valido.');
      return;
    }

    iniziaTransizione(async () => {
      try {
        if (modificaEsistente) {
          await azioneAggiorna(progettoEsistente.id, {
            nome: nome.trim(),
            categoria: categoria.trim(),
            descrizione: descrizione.trim() || null,
            immagine: immagine.trim() || null,
            moduli,
          });
        } else {
          await azioneCrea({
            nome: nome.trim(),
            categoria: categoria.trim(),
            descrizione: descrizione.trim() || null,
            immagine: immagine.trim() || null,
            moduli,
          });
          setNome('');
          setCategoria('');
          setDescrizione('');
          setImmagine('');
          setModuliTesto('[]');
        }
        router.refresh();
        onCompletato?.();
      } catch (e) {
        setErrore(e instanceof Error ? e.message : 'Errore sconosciuto durante il salvataggio.');
      }
    });
  }

  return (
    <form onSubmit={invia} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="nome-progetto-preimpostato">Nome del progetto</Label>
          <Input
            id="nome-progetto-preimpostato"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="es. Cabina armadio 3 metri"
          />
        </div>
        <div>
          <Label htmlFor="categoria-progetto-preimpostato">Categoria</Label>
          <Input
            id="categoria-progetto-preimpostato"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="es. ARMADIO"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="descrizione-progetto-preimpostato">Descrizione (facoltativa)</Label>
          <Input
            id="descrizione-progetto-preimpostato"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="immagine-progetto-preimpostato">Path immagine (facoltativo)</Label>
          <Input
            id="immagine-progetto-preimpostato"
            value={immagine}
            onChange={(e) => setImmagine(e.target.value)}
            placeholder="/foto-elemento-libreria.jpg"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="moduli-progetto-preimpostato">Moduli (JSON — ModuloConfigurato[])</Label>
        <Textarea
          id="moduli-progetto-preimpostato"
          value={moduliTesto}
          onChange={(e) => setModuliTesto(e.target.value)}
          rows={10}
          className="font-mono text-xs"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Stesso formato accettato dal Preventivatore. Viene rivalidato lato server con le stesse
          regole già usate per il calcolo della stima, prima di essere salvato o mostrato al pubblico.
        </p>
      </div>

      {errore && <p className="text-xs text-destructive">{errore}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={inCorso}>
          {inCorso ? 'Salvataggio…' : modificaEsistente ? 'Salva modifiche' : 'Crea progetto'}
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
