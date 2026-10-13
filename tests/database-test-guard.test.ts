import { describe, expect, it } from 'vitest';
import { databaseUrlLocaleDiTest } from './helpers/database-test';

describe('protezione delle prove PostgreSQL — database ammesso', () => {
  it('ammette solo localhost o 127.0.0.1 con un database di test', () => {
    expect(databaseUrlLocaleDiTest('postgresql://u:p@localhost:5432/ramirez_atelier_test')).toBe(
      true,
    );
    expect(databaseUrlLocaleDiTest('postgresql://u:p@127.0.0.1:5432/prova_test?schema=x')).toBe(
      true,
    );
  });

  it('rifiuta host che contengono localhost o 127.0.0.1 senza esserlo', () => {
    for (const host of [
      'localhost.example.com',
      'mylocalhost',
      '127.0.0.1.example.net',
      'db-127.0.0.1.example.org',
    ]) {
      expect(databaseUrlLocaleDiTest(`postgresql://u:p@${host}:5432/db_test`), host).toBe(false);
    }
  });

  it('rifiuta database remoti, nomi senza "test", URL assenti o malformati', () => {
    for (const url of [
      'postgresql://u:p@db.example.com:5432/db_test',
      'postgresql://u:p@localhost:5432/produzione',
      undefined,
      '',
      'non-un-url',
    ]) {
      expect(databaseUrlLocaleDiTest(url), String(url)).toBe(false);
    }
  });
});
