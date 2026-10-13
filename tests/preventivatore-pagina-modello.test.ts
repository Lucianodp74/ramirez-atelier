import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { moduliPerPreventivatore } from '@/lib/catalogo-librerie/catalogo';

const mock = vi.hoisted(() => ({ anteprima: vi.fn() }));

vi.mock('@/components/preventivatore/PreventivatoreModulare', () => ({
  PreventivatoreModulare: () => null,
}));
vi.mock('@/server/identity/tenant-corrente', () => ({
  idTenantRamirezAtelier: vi.fn(async () => 'tenant-ramirez'),
}));
vi.mock('@/server/services/progetto-preimpostato-service', () => ({
  recuperaProgettoPreimpostatoPubblicato: vi.fn(async () => null),
}));
vi.mock('@/server/services/catalogo-librerie-accesso', () => ({
  anteprimaInternaConsentita: mock.anteprima,
}));

import PreventivatorePage from '@/app/preventivatore/page';

type PropsPreventivatore = { moduliIniziali?: unknown; codiceModelloOrigine?: string };

async function apri(searchParams: { preset?: string; modello?: string }) {
  const elemento = (await PreventivatorePage({
    searchParams: Promise.resolve(searchParams),
  })) as ReactElement<PropsPreventivatore>;
  return elemento.props;
}

describe('pagina /preventivatore?modello=… — passaggio dal catalogo', () => {
  beforeEach(() => mock.anteprima.mockReset());

  it('in anteprima interna LIB-ESS-01 passa la sua composizione e il codice d’origine', async () => {
    mock.anteprima.mockResolvedValue(true);
    const props = await apri({ modello: 'LIB-ESS-01' });
    expect(props.moduliIniziali).toEqual(
      moduliPerPreventivatore('LIB-ESS-01', { anteprimaInterna: true }),
    );
    expect(props.codiceModelloOrigine).toBe('LIB-ESS-01');
  });

  it('per il pubblico una bozza non apre il modello e non porta alcun codice', async () => {
    mock.anteprima.mockResolvedValue(false);
    const props = await apri({ modello: 'LIB-ESS-01' });
    expect(props.moduliIniziali).toBeUndefined();
    expect(props.codiceModelloOrigine).toBeUndefined();
  });

  it('senza parametri il Preventivatore si apre come sempre', async () => {
    const props = await apri({});
    expect(props.moduliIniziali).toBeUndefined();
    expect(props.codiceModelloOrigine).toBeUndefined();
    expect(mock.anteprima).not.toHaveBeenCalled();
  });
});
