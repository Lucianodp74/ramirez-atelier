import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { contestoOpzionale } from '@/server/identity/contesto';
import { db } from '@/server/db';
import { LogoutButton } from '@/components/admin/LogoutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const contesto = await contestoOpzionale();
  if (!contesto) redirect('/admin/login');

  const tenant = await db.tenant.findUnique({ where: { id: contesto.tenantId } });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-w-max items-center gap-4">
            <span className="flex shrink-0 items-center gap-2 font-semibold">
              <Image src="/logo-monogramma.png" alt="Ramirez Atelier" width={24} height={17} />
              Ramirez Atelier — Area operativa
            </span>
            <div className="flex shrink-0 items-center gap-4 overflow-x-auto pb-1">
              <Link href="/admin" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <Link href="/admin/richieste" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
                Richieste
              </Link>
              <Link href="/admin/commesse" className="shrink-0 text-sm font-medium text-foreground hover:underline">
                Commesse
              </Link>
              <Link href="/admin/clienti" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
                Clienti
              </Link>
              <Link href="/admin/fasce-budget" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
                Fasce di budget
              </Link>
              <Link href="/admin/spese" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
                Spese
              </Link>
              <Link href="/admin/catalogo" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
                Catalogo
              </Link>
              <Link href="/admin/regole" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
                Regole
              </Link>
              <Link href="/admin/utenti" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
                Utenti
              </Link>
              <Link href="/admin/kpi" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
                KPI
              </Link>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
              <span className="hidden sm:inline">
                {contesto.utenteNome} · {tenant?.nome}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
