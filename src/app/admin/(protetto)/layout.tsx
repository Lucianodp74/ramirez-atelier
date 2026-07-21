import Link from 'next/link';
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
      <nav className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-6">
          <span className="font-semibold">Ramirez Atelier — Area operativa</span>
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
            Home
          </Link>
          <Link
            href="/admin/richieste"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Richieste
          </Link>
          <Link
            href="/admin/clienti"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clienti
          </Link>
          <Link
            href="/admin/fasce-budget"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Fasce di budget
          </Link>
          <Link
            href="/admin/catalogo"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Catalogo
          </Link>
          <Link
            href="/admin/regole"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Regole
          </Link>
          <Link
            href="/admin/utenti"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Utenti
          </Link>
          <Link href="/admin/kpi" className="text-sm text-muted-foreground hover:text-foreground">
            KPI
          </Link>
          <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {contesto.utenteNome} · {tenant?.nome}
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
