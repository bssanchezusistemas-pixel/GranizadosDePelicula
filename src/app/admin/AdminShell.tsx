"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BUSINESS } from "@/data/menu";
import { logoutMeseroAction } from "@/app/caja/actions";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const linkBase =
    "rounded-full px-4 py-2 text-xs font-bold tracking-wide transition border";
  const active = "border-neon bg-neon/15 text-white neon-border";
  const inactive = "border-white/10 text-white/60 hover:border-white/30";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    await logoutMeseroAction();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cinema-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-cinema-dark/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin/productos" className="font-[family-name:var(--font-display)] text-base uppercase">
            {BUSINESS.name}
            <span className="mt-0.5 block text-[10px] font-bold tracking-[0.25em] text-neon">
              Panel admin
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/productos"
              className={`${linkBase} ${
                pathname?.startsWith("/admin/productos") ? active : inactive
              }`}
            >
              Productos
            </Link>
            <Link
              href="/admin/registro"
              className={`${linkBase} ${
                pathname?.startsWith("/admin/registro") ? active : inactive
              }`}
            >
              Registro
            </Link>
            <Link href="/" className={`${linkBase} ${inactive}`} target="_blank">
              Ver sitio
            </Link>
            <button type="button" onClick={handleLogout} className={`${linkBase} ${inactive}`}>
              Salir
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
