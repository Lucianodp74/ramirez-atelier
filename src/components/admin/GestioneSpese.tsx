'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { creaSpesaAzione, aggiornaSpesaAzione, eliminaSpesaAzione } from '@/app/admin/azioni';

interface Spesa {
  id: string;
  nome: string;
  importoMensile: number;
}

interface Props {
  speseIniziali: Spesa[];
}

function formattaEuro(valore: number): string {
  return valore.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function GestioneSpese({ speseIniziali }: Props) {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [importo, setImporto] = useState('');
  const [rigaInModifica, setRigaInModifica] = useState<string | null>(null);
  const [nomeModifica, setNomeModifica] = useState('');
  const [importoModifica, setImportoModifica] = useState('');
  const [inCorso, iniziaTransizione] = useTransition();

  const totale = speseIniziali.reduce((somma, s) => somma + s.importoMensile, 0);

  function invia(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || importo === '') return;
    iniziaTransizione(async () => {
      await creaSpesaAzione(nome.trim(), Number(importo));
      setNome('');
      setImporto('');
      router.refresh();
    });
  }

  function iniziaModifica(s: Spesa) {
    setRigaInModifica(s.id);
    setNomeModifica(s.nome);
    setImportoModifica(String(s.importoMensile));
  }

  function salvaModifica(id: string) {
    if (!nomeModifica.trim() || importoModifica === '') return;
    iniziaTransizione(async () => {
      await aggiornaSpesaAzione(id, nomeModifica.trim(), Number(importoModifica));
      setRigaInModifica(null);
      router.refresh();
    });
  }

  function elimina(id: string) {
    iniziaTransizione(async () => {
      await eliminaSpesaAzione(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={invia} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="nome-spesa">Voce di spesa</Label>
              <Input
                id="nome-spesa"
                placeholder="es. Stipendi, Affitto, Utenze"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="importo-spesa">Importo mensile (€)</Label>
              <Input
                id="importo-spesa"
                type="number"
                min="0"
                step="0.01"
                value={importo}
                onChange={(e) => setImporto(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={inCorso} className="w-full sm:w-auto">
                Aggiungi
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-normal">Voce</th>
                <th className="px-4 py-3 font-normal">Importo mensile</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {speseIniziali.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  {rigaInModifica === s.id ? (
                    <>
                      <td className="px-4 py-3">
                        <Input
                          value={nomeModifica}
                          onChange={(e) => setNomeModifica(e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={importoModifica}
                          onChange={(e) => setImportoModifica(e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" disabled={inCorso} onClick={() => salvaModifica(s.id)}>
                            Salva
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRigaInModifica(null)}>
                            Annulla
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{s.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formattaEuro(s.importoMensile)} €
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => iniziaModifica(s)}>
                            Modifica
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={inCorso}
                            onClick={() => elimina(s.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            Elimina
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {speseIniziali.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    Nessuna voce di spesa registrata.
                  </td>
                </tr>
              )}
            </tbody>
            {speseIniziali.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border font-medium">
                  <td className="px-4 py-3">Totale mensile</td>
                  <td className="px-4 py-3" colSpan={2}>
                    {formattaEuro(totale)} €
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
