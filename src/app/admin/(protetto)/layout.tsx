import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { contestoOpzionale } from '@/server/identity/contesto';
import { db } from '@/server/db';
import { LogoutButton } from '@/components/admin/LogoutButton';

const LINK_NAV = [
  ['/admin', 'Home'],
  ['/admin/richieste', 'Richieste'],
  ['/admin/commesse', 'Commesse'],
  ['/admin/clienti', 'Clienti'],
  ['/admin/fasce-budget', 'Fasce di budget'],
  ['/admin/spese', 'Spese'],
  ['/admin/catalogo', 'Catalogo'],
  ['/admin/regole', 'Regole'],
  ['/admin/utenti', 'Utenti'],
  ['/admin/kpi', 'KPI'],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const contesto = await contestoOpzionale();
  if (!contesto) redirect('/admin/login');

  const tenant = await db.tenant.findUnique({ where: { id: contesto.tenantId } });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4">
            <span className="flex min-w-0 items-center gap-2 font-semibold">
              <Image src="/logo-monogramma.png" alt="Ramirez Atelier" width={24} height={17} className="shrink-0" />
              <span className="truncate">Ramirez Atelier — Area operativa</span>
            </span>
            <div className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
              <span className="hidden md:inline">{contesto.utenteNome} · {tenant?.nome}</span>
              <LogoutButton />
            </div>
          </div>
          <div className="mt-3 -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
            <div className="flex w-max min-w-full items-center gap-5 pb-1">
              {LINK_NAV.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className={`shrink-0 text-sm ${label === 'Commesse' ? 'font-medium text-foreground' : 'text-muted-foreground'} hover:text-foreground hover:underline`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
