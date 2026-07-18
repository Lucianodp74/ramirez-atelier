import type { NodoCondizione, Fatti } from './tipi';

const OPERATORI_NUMERICI = new Set([
  'maggiore',
  'maggiore_uguale',
  'minore',
  'minore_uguale',
  'tra',
]);

function valutaOperatore(valoreFatto: unknown, operatore: string, valoreAtteso: unknown): boolean {
  // Un fatto assente (null/undefined) non deve mai essere trattato come 0 da un
  // confronto numerico - bug reale trovato in verifica (Incremento 7): una
  // richiesta senza larghezzaCm indicata risultava "minore di 250" perché
  // Number(null) === 0. Un dato mancante rende la condizione numerica sempre
  // falsa, mai un match per coincidenza aritmetica.
  if (OPERATORI_NUMERICI.has(operatore) && (valoreFatto === null || valoreFatto === undefined)) {
    return false;
  }

  switch (operatore) {
    case 'uguale':
      return valoreFatto === valoreAtteso;
    case 'diverso':
      return valoreFatto !== valoreAtteso;
    case 'maggiore':
      return Number(valoreFatto) > Number(valoreAtteso);
    case 'maggiore_uguale':
      return Number(valoreFatto) >= Number(valoreAtteso);
    case 'minore':
      return Number(valoreFatto) < Number(valoreAtteso);
    case 'minore_uguale':
      return Number(valoreFatto) <= Number(valoreAtteso);
    case 'contiene':
      return typeof valoreFatto === 'string' && valoreFatto.includes(String(valoreAtteso));
    case 'in':
      return Array.isArray(valoreAtteso) && valoreAtteso.includes(valoreFatto);
    case 'non_in':
      return Array.isArray(valoreAtteso) && !valoreAtteso.includes(valoreFatto);
    case 'tra': {
      const [minimo, massimo] = valoreAtteso as [number, number];
      const numero = Number(valoreFatto);
      return numero >= minimo && numero <= massimo;
    }
    case 'vuoto':
      return valoreFatto === null || valoreFatto === undefined || valoreFatto === '';
    case 'non_vuoto':
      return !(valoreFatto === null || valoreFatto === undefined || valoreFatto === '');
    default:
      throw new Error(`Operatore di condizione sconosciuto: "${operatore}"`);
  }
}

/**
 * Valuta ricorsivamente un albero di condizioni contro un oggetto di fatti.
 * Funzione pura: stesso input, stesso output, nessun effetto collaterale, nessuna
 * conoscenza di alcun dominio applicativo - per questo è testabile senza mock e
 * riusabile identica ovunque il motore venga applicato.
 */
export function valuta(nodo: NodoCondizione, fatti: Fatti): boolean {
  if ('operatoreLogico' in nodo) {
    if (nodo.operatoreLogico === 'E') return nodo.figli.every((figlio) => valuta(figlio, fatti));
    if (nodo.operatoreLogico === 'O') return nodo.figli.some((figlio) => valuta(figlio, fatti));
    return !valuta(nodo.figlio, fatti); // NON
  }

  return valutaOperatore(fatti[nodo.campo], nodo.operatore, nodo.valore);
}
