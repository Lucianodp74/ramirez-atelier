/**
 * Protezione delle prove d'integrazione PostgreSQL: ammette solo un database
 * locale (host esattamente `localhost` o `127.0.0.1`, mai un nome che li
 * "contiene") il cui nome contenga "test". Un URL assente o malformato non è
 * mai ammesso.
 */
export function databaseUrlLocaleDiTest(databaseUrl: string | undefined): boolean {
  if (!databaseUrl) return false;
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    return false;
  }
  return ['localhost', '127.0.0.1'].includes(url.hostname) && /test/i.test(url.pathname);
}
