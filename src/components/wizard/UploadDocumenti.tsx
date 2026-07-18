'use client';

import { useState, useTransition } from 'react';
import { FileText, Image as ImageIcon, Box, Video, File as FileIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formattaDimensione } from '@/lib/utils';
import { caricaDocumento, eliminaDocumento } from '@/app/progetti/[chiave]/azioni';
import type { DocumentoRichiesta } from '@prisma/client';

const ICONA_PER_CATEGORIA: Record<string, typeof FileText> = {
  FOTO: ImageIcon,
  PDF: FileText,
  DWG_DXF: Box,
  RENDER: Box,
  VIDEO: Video,
  ALTRO: FileIcon,
};

const ETICHETTA_CATEGORIA: Record<string, string> = {
  FOTO: 'Foto',
  PDF: 'PDF',
  DWG_DXF: 'Disegno tecnico',
  RENDER: 'Render',
  VIDEO: 'Video',
  ALTRO: 'Altro',
};

interface Props {
  richiestaId: string;
  documenti: DocumentoRichiesta[];
  onDocumentiChange: (documenti: DocumentoRichiesta[]) => void;
}

export function UploadDocumenti({ richiestaId, documenti, onDocumentiChange }: Props) {
  const [inCorso, iniziaTransizione] = useTransition();
  const [errore, setErrore] = useState<string | null>(null);

  function gestisciSelezione(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setErrore(null);

    const formData = new FormData();
    formData.set('file', file);

    iniziaTransizione(async () => {
      try {
        const documento = await caricaDocumento(richiestaId, formData);
        onDocumentiChange([...documenti, documento]);
      } catch (e) {
        setErrore(e instanceof Error ? e.message : 'Caricamento non riuscito.');
      }
    });

    event.target.value = ''; // permette di ricaricare lo stesso file se necessario
  }

  function rimuovi(documentoId: string) {
    iniziaTransizione(async () => {
      await eliminaDocumento(documentoId);
      onDocumentiChange(documenti.filter((d) => d.id !== documentoId));
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 font-medium">Documenti e riferimenti</h3>
        <p className="text-sm text-muted-foreground">
          Planimetrie, foto, disegni tecnici, render, ispirazioni — qualunque cosa tu abbia già.
          Nessun formato specifico richiesto.
        </p>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 px-6 py-10 text-center transition-colors hover:border-accent">
        <span className="text-sm font-medium">Trascina un file qui, o clicca per selezionarlo</span>
        <span className="mt-1 text-xs text-muted-foreground">
          PDF, DWG, DXF, JPEG, PNG, video, ZIP — nessun limite di formato
        </span>
        <input type="file" className="hidden" onChange={gestisciSelezione} disabled={inCorso} />
      </label>

      {errore && <p className="text-sm text-destructive">{errore}</p>}

      {documenti.length > 0 && (
        <ul className="space-y-2">
          {documenti.map((documento) => {
            const Icona = ICONA_PER_CATEGORIA[documento.categoria] ?? FileIcon;
            return (
              <li
                key={documento.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icona className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{documento.nomeFileOriginale}</p>
                    <p className="text-xs text-muted-foreground">
                      {formattaDimensione(documento.dimensioneByte)} ·{' '}
                      {new Date(documento.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {ETICHETTA_CATEGORIA[documento.categoria] ?? documento.categoria}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => rimuovi(documento.id)}
                    aria-label="Rimuovi documento"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
