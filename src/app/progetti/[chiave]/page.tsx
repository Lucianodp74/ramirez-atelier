import { notFound } from 'next/navigation';
import { db } from '@/server/db';
import { idTenantRamirezAtelier } from '@/server/identity/tenant-corrente';
import { WizardBootstrap } from '@/components/wizard/WizardBootstrap';

export default async function WizardPage({
  params,
  searchParams,
}: {
  params: Promise<{ chiave: string }>;
  searchParams: Promise<{ bozza?: string }>;
}) {
  const { chiave } = await params;
  const { bozza } = await searchParams;
  const tenantId = await idTenantRamirezAtelier();

  const tipoProgetto = await db.tipoProgetto.findUnique({
    where: { tenantId_chiave: { tenantId, chiave } },
  });
  if (!tipoProgetto || !tipoProgetto.attivo) notFound();

  return <WizardBootstrap chiaveTipoProgetto={chiave} tokenEsplicito={bozza} />;
}
