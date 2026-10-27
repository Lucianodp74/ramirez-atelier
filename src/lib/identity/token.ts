import { randomBytes, createHash } from 'crypto';

/**
 * Genera un token opaco casuale (per il cookie di sessione, per il link di
 * invito, per il link di recupero password). Il valore grezzo viene mostrato
 * all'utente/nel cookie UNA SOLA VOLTA; nel database si salva solo il suo hash
 * (§11 - stesso principio della password: un dump del database non deve bastare
 * a impersonare una sessione o consumare un invito).
 */
export function generaTokenOpaco(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Token di ripresa di una richiesta: la credenziale con cui il cliente riprende
 * la propria bozza (cookie del wizard) e consulta lo stato (`/richiesta/<token>`).
 * 256 bit da un generatore crittografico, in base64url: va impostato
 * esplicitamente a ogni creazione, senza affidarsi al default `cuid()` della
 * colonna, che è prevedibile. Le richieste già esistenti conservano il proprio
 * token: la ricerca avviene per uguaglianza, qualunque sia il formato.
 */
export function generaTokenRipresa(): string {
  return generaTokenOpaco();
}

export function hashToken(tokenGrezzo: string): string {
  return createHash('sha256').update(tokenGrezzo).digest('hex');
}
