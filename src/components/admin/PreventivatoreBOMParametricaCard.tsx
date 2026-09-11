import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { richiediContesto } from '@/server/identity/contesto';
import { caricaTariffePreventivatore } from '@/server/services/preventivatore-listino-service';
import { calcolaPreventivoModulare } from '@/lib/preventivatore/prezzo-modulare';
import { PreventivatoreBOMParametrica } from './PreventivatoreBOMParametrica';
import type { ModuloConfigurato } from '@/lib/preventivatore/moduli';

type Props = { datiEstensione: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isModuloConfigurato(value: unknown): value is ModuloConfigurato {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.tipo === 'string' &&
    typeof value.larghezzaCm === 'number' &&
    typeof value.altezzaCm === 'number' &&
    typeof value.profonditaCm === 'number' &&
    typeof value.materiale === 'string' &&
    typeof value.finitura === 'string' &&
    typeof value.configurazione === 'string' &&
    (value.ripiani === undefined || typeof value.ripiani === 'number')
  );
}

export async function PreventivatoreBOMParametricaCard({ datiEstensione }: Props) {
  if (!isRecord(datiEstensione)) return null;
  const snapshot = datiEstensione.preventivatoreModulare;
  if (!isRecord(snapshot)) return null;
  const moduli = Array.isArray(snapshot.moduli) ? snapshot.moduli.filter(isModuloConfigurato) : [];
  if (moduli.length === 0) return null;

  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
  const tariffe = await caricaTariffePreventivatore(contesto.tenantId);
  const preventivo = calcolaPreventivoModulare(moduli, tariffe);
  if (preventivo.errori.length || preventivo.righe.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distinta parametrica</CardTitle>
        <p className="text-sm text-muted-foreground">
          Scomposizione tecnica preliminare ricalcolata con il listino attivo. Le quote sono parametriche e vanno verificate prima della produzione.
        </p>
      </CardHeader>
      <CardContent>
        <PreventivatoreBOMParametrica righe={preventivo.righe} />
      </CardContent>
    </Card>
  );
}
