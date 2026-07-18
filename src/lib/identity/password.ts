import { argon2id, argon2Verify } from 'hash-wasm';
import { randomBytes } from 'crypto';

/**
 * Argon2id, non bcrypt - raccomandazione OWASP corrente (ADR-0004 §9/§11).
 * Parametri di costo moderati: questo sandbox e un dev container non hanno la
 * stessa potenza di un server di produzione; in produzione andranno ricalibrati
 * misurando il tempo di risposta reale (obiettivo: 250-500ms per hash).
 */
const PARAMETRI_ARGON2 = {
  parallelism: 1,
  iterations: 3,
  memorySize: 19456, // 19 MiB, in linea con le raccomandazioni OWASP 2024 per argon2id
  hashLength: 32,
};

export async function calcolaHashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  return argon2id({
    password,
    salt,
    ...PARAMETRI_ARGON2,
    outputType: 'encoded', // include salt + parametri nell'output, come una stringa PHC standard
  });
}

export async function verificaPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2Verify({ password, hash });
  } catch {
    return false;
  }
}

/**
 * Politica password minima (ADR-0004: `PoliticaPassword`, oggi globale, non
 * per-Tenant - v. nota nell'ADR). Ritorna il messaggio d'errore, o null se valida.
 */
export function validaPassword(password: string): string | null {
  if (password.length < 10) return 'La password deve contenere almeno 10 caratteri.';
  if (!/[A-Z]/.test(password)) return 'La password deve contenere almeno una lettera maiuscola.';
  if (!/[0-9]/.test(password)) return 'La password deve contenere almeno un numero.';
  return null;
}
