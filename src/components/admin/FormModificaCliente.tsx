'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { aggiornaClienteAzione } from '@/app/admin/azioni';
import { nomeCompletoCliente } from '@/lib/utils';

const ETICHETTA_TIPO: Record<string, string> = {
  PRIVATO: 'Privato',
  ARCHITETTO: 'Architetto',
  IMPRESA: 'Impresa',
  STUDIO_TECNICO: 'Studio tecnico',
};

interface ClienteModificabile {
  id: string;
  nome: string;
  cognome: string | null;
  email: string | null;
  telefono: string | null;
  indirizzo: string | null;
  tipo: string;
  azienda: string | null;
}

export function FormModificaCliente({ cliente }: { cliente: ClienteModificabile }) {
  const router = useRouter();
  const [inModifica, setInModifica] = useState(false);
  const [inCorso, iniziaTransizione] = useTransition();

  const [nome, setNome] = useState(cliente.nome);
  const [cognome, setCognome] = useState(cliente.cognome ?? '');
  const [email, setEmail] = useState(cliente.email ?? '');
  const [telefono, setTelefono] = useState(cliente.telefono ?? '');
  const [indirizzo, setIndirizzo] = useState(cliente.indirizzo ?? '');
  const [azienda, setAzienda] = useState(cliente.azienda ?? '');

  function annulla() {
    setNome(cliente.nome);
    setCognome(cliente.cognome ?? '');
    setEmail(cliente.email ?? '');
    setTelefono(cliente.telefono ?? '');
    setIndirizzo(cliente.indirizzo ?? '');
    setAzienda(cliente.azienda ?? '');
    setInModifica(false);
  }

  function salva() {
    if (!nome.trim()) return;
    iniziaTransizione(async () => {
      await aggiornaClienteAzione(cliente.id, {
        nome: nome.trim(),
        cognome: cognome.trim() || null,
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        indirizzo: indirizzo.trim() || null,
        azienda: azienda.trim() || null,
      });
      setInModifica(false);
      router.refresh();
    });
  }

  if (!inModifica) {
    return (
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{nomeCompletoCliente(cliente)}</h1>
          <Button type="button" variant="ghost" size="sm" onClick={() => setInModifica(true)}>
            Modifica
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {[cliente.email, cliente.telefono].filter(Boolean).join(' · ') ||
            'Nessun contatto registrato'}
          {' · '}
          {ETICHETTA_TIPO[cliente.tipo] ?? cliente.tipo}
          {cliente.azienda && ` · ${cliente.azienda}`}
        </p>
        {cliente.indirizzo && <p className="text-sm text-muted-foreground">{cliente.indirizzo}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cliente-nome">Nome</Label>
          <Input id="cliente-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cliente-cognome">Cognome</Label>
          <Input
            id="cliente-cognome"
            value={cognome}
            onChange={(e) => setCognome(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cliente-email">Email</Label>
          <Input
            id="cliente-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cliente-telefono">Telefono</Label>
          <Input
            id="cliente-telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cliente-indirizzo">Indirizzo</Label>
          <Input
            id="cliente-indirizzo"
            value={indirizzo}
            onChange={(e) => setIndirizzo(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cliente-azienda">Ragione sociale (se professionista)</Label>
          <Input
            id="cliente-azienda"
            value={azienda}
            onChange={(e) => setAzienda(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={inCorso} onClick={salva}>
          {inCorso ? 'Salvataggio…' : 'Salva'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={annulla} disabled={inCorso}>
          Annulla
        </Button>
      </div>
    </div>
  );
}
