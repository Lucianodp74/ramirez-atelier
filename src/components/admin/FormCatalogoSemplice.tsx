'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface RigaEsistente {
  id: string;
  categoria: string;
  nome: string;
  descrizione: string | null;
  ordinamento: number;
}

interface Dati {
  categoria: string;
  nome: string;
  descrizione?: string | null;
  ordinamento?: number;
}

interface Props {
  categorieEsistenti: string[];
  rigaEsistente?: RigaEsistente;
  azioneCrea: (dati: Dati) => Promise<unknown>;
  azioneAggiorna: (id: string, dati: Partial<Dati>) => Promise<unknown>;
  onCompletato?: () => void;
}

/**
 * Generico per Ferramenta e Accessorio - stessa forma di FormFinitura.tsx ma
 * senza colore/texture (non rappresentano superfici, un campione visivo non
 * li descriverebbe onestamente). Nessuno slug qui: generato e congelato lato
 * server, mai un campo che il titolare deve capire (Configurazione a Valore).
 */
export function FormCatalogoSemplice({
  categorieEsistenti,
  rigaEsistente,
  azioneCrea,
  azioneAggiorna,
  onCompletato,
}: Props) {
  const router = useRouter();
  const modificaEsistente = !!rigaEsistente;

  const [categoria, setCategoria] = useState(
    rigaEsistente?.categoria ?? categorieEsistenti[0] ?? '',
  );
  const [categoriaNuova, setCategoriaNuova] = useState('');
  const [nome, setNome] = useState(rigaEsistente?.nome ?? '');
  const [descrizione, setDescrizione] = useState(rigaEsistente?.descrizione ?? '');
  const [ordinamento, setOrdinamento] = useState(
    rigaEsistente ? String(rigaEsistente.ordinamento) : '',
  );
  const [inCorso, iniziaTransizione] = useTransition();

  const categoriaEffettiva = categoria === '__nuova__' ? categoriaNuova.trim() : categoria;

  function invia(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !categoriaEffettiva) return;

    const dati: Dati = {
      categoria: categoriaEffettiva,
      nome: nome.trim(),
      descrizione: descrizione.trim() || null,
      ...(modificaEsistente ? { ordinamento: Number(ordinamento) || 0 } : {}),
    };

    iniziaTransizione(async () => {
      if (modificaEsistente) {
        await azioneAggiorna(rigaEsistente.id, dati);
      } else {
        await azioneCrea(dati);
        setNome('');
        setDescrizione('');
      }
      router.refresh();
      onCompletato?.();
    });
  }

  return (
    <form onSubmit={invia} className="grid gap-3 sm:grid-cols-5">
      <div className="sm:col-span-2">
        <Label htmlFor="nome-catalogo">Nome</Label>
        <Input id="nome-catalogo" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="categoria-catalogo">Categoria</Label>
        <select
          id="categoria-catalogo"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
        >
          {categorieEsistenti.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value="__nuova__">+ Nuova categoria...</option>
        </select>
        {categoria === '__nuova__' && (
          <Input
            className="mt-2"
            value={categoriaNuova}
            onChange={(e) => setCategoriaNuova(e.target.value)}
            placeholder="Nome della nuova categoria"
          />
        )}
      </div>

      {modificaEsistente && (
        <div>
          <Label htmlFor="ordine-catalogo">Ordine</Label>
          <Input
            id="ordine-catalogo"
            type="number"
            value={ordinamento}
            onChange={(e) => setOrdinamento(e.target.value)}
          />
        </div>
      )}

      <div className="sm:col-span-5">
        <Label htmlFor="descrizione-catalogo">Descrizione (facoltativa)</Label>
        <Textarea
          id="descrizione-catalogo"
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
        />
      </div>

      <div className="sm:col-span-5 flex gap-2">
        <Button type="submit" disabled={inCorso}>
          {inCorso ? 'Salvataggio…' : modificaEsistente ? 'Salva modifiche' : 'Aggiungi'}
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
