'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { creaFinituraAzione, aggiornaFinituraAzione } from '@/app/admin/azioni';
import { TEXTURE_DISPONIBILI } from '@/lib/catalogo-costanti';

interface FinituraEsistente {
  id: string;
  categoria: string;
  nome: string;
  descrizione: string | null;
  coloreHex: string;
  texture: string;
  ordinamento: number;
}

interface Props {
  categorieEsistenti: string[];
  finituraEsistente?: FinituraEsistente;
  onCompletato?: () => void;
}

/**
 * Nessun campo "slug" qui: è un identificatore tecnico generato e congelato
 * lato server (v. catalogo-service.ts) - il titolare non deve mai sapere
 * cosa sia, coerente con Configurazione a Valore.
 */
export function FormFinitura({ categorieEsistenti, finituraEsistente, onCompletato }: Props) {
  const router = useRouter();
  const modificaEsistente = !!finituraEsistente;

  const [categoria, setCategoria] = useState(
    finituraEsistente?.categoria ?? categorieEsistenti[0] ?? '',
  );
  const [categoriaNuova, setCategoriaNuova] = useState('');
  const [nome, setNome] = useState(finituraEsistente?.nome ?? '');
  const [descrizione, setDescrizione] = useState(finituraEsistente?.descrizione ?? '');
  const [coloreHex, setColoreHex] = useState(finituraEsistente?.coloreHex ?? '#B08558');
  const [texture, setTexture] = useState(
    finituraEsistente?.texture ?? TEXTURE_DISPONIBILI[0].valore,
  );
  // "Ordine" ha senso solo in modifica: alla creazione non c'è alcun beneficio
  // immediato nel chiederlo (bisognerebbe già sapere quali numeri usano le
  // altre finiture della categoria) - il server lo calcola da sé, in coda.
  const [ordinamento, setOrdinamento] = useState(
    finituraEsistente ? String(finituraEsistente.ordinamento) : '',
  );
  const [inCorso, iniziaTransizione] = useTransition();

  const categoriaEffettiva = categoria === '__nuova__' ? categoriaNuova.trim() : categoria;

  function invia(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !categoriaEffettiva) return;

    const dati = {
      categoria: categoriaEffettiva,
      nome: nome.trim(),
      descrizione: descrizione.trim() || null,
      coloreHex,
      texture,
      ...(modificaEsistente ? { ordinamento: Number(ordinamento) || 0 } : {}),
    };

    iniziaTransizione(async () => {
      if (modificaEsistente) {
        await aggiornaFinituraAzione(finituraEsistente.id, dati);
      } else {
        await creaFinituraAzione(dati);
        setNome('');
        setDescrizione('');
        setOrdinamento('0');
      }
      router.refresh();
      onCompletato?.();
    });
  }

  return (
    <form onSubmit={invia} className="grid gap-3 sm:grid-cols-6">
      <div className="sm:col-span-2">
        <Label htmlFor="nome-finitura">Nome</Label>
        <Input
          id="nome-finitura"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="es. Rovere Naturale Spazzolato"
        />
      </div>

      <div>
        <Label htmlFor="categoria-finitura">Categoria</Label>
        <select
          id="categoria-finitura"
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

      <div>
        <Label htmlFor="texture-finitura">Effetto visivo</Label>
        <select
          id="texture-finitura"
          value={texture}
          onChange={(e) => setTexture(e.target.value)}
          className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
        >
          {TEXTURE_DISPONIBILI.map((t) => (
            <option key={t.valore} value={t.valore}>
              {t.etichetta}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="colore-finitura">Colore</Label>
        <input
          id="colore-finitura"
          type="color"
          value={coloreHex}
          onChange={(e) => setColoreHex(e.target.value)}
          className="h-10 w-full cursor-pointer rounded-md border border-input bg-secondary/40"
        />
      </div>

      {modificaEsistente && (
        <div>
          <Label htmlFor="ordine-finitura">Ordine</Label>
          <Input
            id="ordine-finitura"
            type="number"
            value={ordinamento}
            onChange={(e) => setOrdinamento(e.target.value)}
          />
        </div>
      )}

      <div className="sm:col-span-6">
        <Label htmlFor="descrizione-finitura">Descrizione (facoltativa)</Label>
        <Textarea
          id="descrizione-finitura"
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
          placeholder="Una riga che il cliente vedrà sotto il nome, nel wizard"
        />
      </div>

      <div className="sm:col-span-6 flex gap-2">
        <Button type="submit" disabled={inCorso}>
          {inCorso ? 'Salvataggio…' : modificaEsistente ? 'Salva modifiche' : 'Aggiungi finitura'}
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
