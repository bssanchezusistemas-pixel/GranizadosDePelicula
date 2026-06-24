"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BUSINESS } from "@/data/menu";
import type { CajaSession } from "@/lib/caja-session";
import { isAdminSession } from "@/lib/caja-session";
import { logoutMeseroAction } from "@/app/caja/actions";

interface CajaShellProps {
  session: CajaSession | null;
  children: React.ReactNode;
}

export function CajaShell({ session, children }: CajaShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const esAdmin = isAdminSession(session);

  if (pathname === "/caja/login") {
    return <>{children}</>;
  }

  const esRegistro = pathname?.startsWith("/caja/registro");
  const esMesas = pathname?.startsWith("/caja/mesas");

  const linkBase =
    "rounded-full px-4 py-2 text-xs font-bold tracking-wide transition";
  const linkActivo = "border-neon bg-neon/15 text-white neon-border";
  const linkInactivo = "border-white/10 text-white/60 hover:border-white/30";

  async function handleLogout() {
    if (esAdmin) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    await logoutMeseroAction();
    router.push("/caja/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cinema-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-cinema-dark/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/caja" className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-neon" />
            <span className="font-[family-name:var(--font-display)] text-base uppercase leading-none text-white sm:text-lg">
              {BUSINESS.name}
              <span className="mt-0.5 block text-[10px] font-bold tracking-[0.25em] text-neon">
                TOMA DE PEDIDOS
              </span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href="/caja"
              className={`${linkBase} border ${
                !esRegistro && !esMesas ? linkActivo : linkInactivo
              }`}
            >
              PEDIDOS
            </Link>
            {esAdmin && (
              <Link
                href="/caja/registro"
                className={`${linkBase} border ${
                  esRegistro ? linkActivo : linkInactivo
                }`}
              >
                REGISTRO
              </Link>
            )}
            <Link
              href="/caja/mesas"
              className={`${linkBase} border ${
                esMesas ? linkActivo : linkInactivo
              }`}
            >
              MESAS
            </Link>
            {esAdmin && (
              <Link
                href="/admin/domicilios"
                className={`${linkBase} border ${linkInactivo}`}
              >
                DOMICILIOS
              </Link>
            )}
            {esAdmin && (
              <Link
                href="/admin/meseros"
                className={`${linkBase} border ${linkInactivo}`}
              >
                MESEROS
              </Link>
            )}
            <Link
              href="/cocina"
              className={`${linkBase} border ${linkInactivo}`}
              target="_blank"
            >
              COCINA
            </Link>
            {session && (
              <span className="hidden rounded-full border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white/50 sm:inline">
                {session.nombre}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className={`${linkBase} border ${linkInactivo}`}
            >
              SALIR
            </button>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
