'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { creaFasciaBudgetAzione } from '@/app/admin/azioni';

export function FormNuovaFascia() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [minimo, setMinimo] = useState('');
  const [massimo, setMassimo] = useState('');
  const [ordinamento, setOrdinamento] = useState('');
  const [inCorso, iniziaTransizione] = useTransition();

  function invia(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || minimo === '') return;
    iniziaTransizione(async () => {
      await creaFasciaBudgetAzione({
        nome: nome.trim(),
        minimo: Number(minimo),
        massimo: massimo === '' ? null : Number(massimo),
        ordinamento: ordinamento === '' ? 0 : Number(ordinamento),
      });
      setNome('');
      setMinimo('');
      setMassimo('');
      setOrdinamento('');
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={invia}
      className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-5"
    >
      <div className="sm:col-span-2">
        <Label htmlFor="nome-fascia">Nome</Label>
        <Input
          id="nome-fascia"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="es. 6.000 - 10.000 €"
        />
      </div>
      <div>
        <Label htmlFor="minimo-fascia">Minimo (€)</Label>
        <Input
          id="minimo-fascia"
          type="number"
          value={minimo}
          onChange={(e) => setMinimo(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="massimo-fascia">Massimo (€, vuoto = illimitato)</Label>
        <Input
          id="massimo-fascia"
          type="number"
          value={massimo}
          onChange={(e) => setMassimo(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="ordinamento-fascia">Ordine</Label>
        <Input
          id="ordinamento-fascia"
          type="number"
          value={ordinamento}
          onChange={(e) => setOrdinamento(e.target.value)}
        />
      </div>
      <div className="sm:col-span-5">
        <Button type="submit" disabled={inCorso}>
          {inCorso ? 'Creazione…' : 'Aggiungi fascia'}
        </Button>
      </div>
    </form>
  );
}
