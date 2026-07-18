import { AccettaInvitoForm } from './AccettaInvitoForm';

export default async function InvitoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AccettaInvitoForm token={token} />;
}
