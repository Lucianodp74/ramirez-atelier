import { db } from '@/server/db';
import { registraGestoreAzione, azioneRegistrata } from './registro-azioni';
import type { PrioritaCommerciale } from '@prisma/client';

/**
 * Primo caso d'uso reale del motore: priorità commerciale (BASSA/MEDIA/ALTA),
 * più semplice da verificare end-to-end. Imposta RichiestaProgetto.
 * prioritaCommerciale quando una regola del contesto
 * "richiesta_priorita_commerciale" ha condizione vera.
 */
function registraGestoriRichiesta(): void {
  registraGestoreAzione('imposta_priorita_commerciale', async (parametri, _fatti, contesto) => {
    if (contesto.entitaTipo !== 'richiesta_progetto') {
      throw new Error(
        'L\'azione "imposta_priorita_commerciale" si applica solo a entità "richiesta_progetto".',
      );
    }
    const priorita = parametri.priorita as PrioritaCommerciale;
    await db.richiestaProgetto.update({
      where: { id: contesto.entitaId },
      data: { prioritaCommerciale: priorita },
    });
    return { prioritaImpostata: priorita };
  });

  /**
   * Secondo caso d'uso reale, quello che conta davvero (ADR-0003: "il pricing
   * sarà il primo caso d'uso" del motore generico - qui lo diventa nei fatti).
   * Nessuna formula: `min`/`max` sono dati dichiarati nella Regola stessa
   * (parametri dell'azione), il motore si limita a scriverli sulla richiesta,
   * insieme a `regolaPrezzoApplicataId` per tracciabilità (quale regola ha
   * prodotto questo prezzo, verificabile in ogni momento).
   */
  registraGestoreAzione('imposta_fascia_prezzo', async (parametri, _fatti, contesto) => {
    if (contesto.entitaTipo !== 'richiesta_progetto') {
      throw new Error(
        'L\'azione "imposta_fascia_prezzo" si applica solo a entità "richiesta_progetto".',
      );
    }
    const min = Number(parametri.min);
    const max = Number(parametri.max);
    if (Number.isNaN(min) || Number.isNaN(max)) {
      throw new Error('Parametri "min"/"max" mancanti o non numerici per "imposta_fascia_prezzo".');
    }

    await db.richiestaProgetto.update({
      where: { id: contesto.entitaId },
      data: {
        fasciaPrezzoMin: min,
        fasciaPrezzoMax: max,
        regolaPrezzoApplicataId: contesto.regolaId,
      },
    });

    return { fasciaPrezzoMin: min, fasciaPrezzoMax: max, regolaId: contesto.regolaId };
  });
}

/**
 * Idempotente: chiamabile più volte senza duplicare le registrazioni (il registro
 * è una Map, una nuova registrazione con la stessa chiave sovrascrive la precedente).
 * Va invocata prima di qualunque chiamata a `eseguiRegolePerContesto` che utilizzi
 * queste azioni - in questo progetto, dentro azioni.ts (completaRichiesta).
 */
export function assicuraGestoriRegistrati(): void {
  if (!azioneRegistrata('imposta_priorita_commerciale')) {
    registraGestoriRichiesta();
  }
}
