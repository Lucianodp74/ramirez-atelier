import { notFound } from 'next/navigation';
import { db } from '@/server/db';
import { WizardBootstrap } from '@/components/wizard/WizardBootstrap';

export default async function WizardPage({ params }: { params: Promise<{ chiave: string }> }) {
  const { chiave } = await params;

  const tipoProgetto = await db.tipoProgetto.findUnique({ where: { chiave } });
  if (!tipoProgetto || !tipoProgetto.attivo) notFound();

  return <WizardBootstrap chiaveTipoProgetto={chiave} />;
}
