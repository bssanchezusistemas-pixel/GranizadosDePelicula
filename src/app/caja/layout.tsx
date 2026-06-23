"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VentasProvider } from "@/context/VentasContext";
import { BUSINESS } from "@/data/menu";

export default function CajaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VentasProvider>
      <div className="min-h-screen bg-cinema-black text-white">
        <CajaHeader />
        {children}
      </div>
    </VentasProvider>
  );
}

function CajaHeader() {
  const pathname = usePathname();
  const esRegistro = pathname?.startsWith("/caja/registro");
  const esReparto = pathname?.startsWith("/caja/reparto");

  const linkBase =
    "rounded-full px-4 py-2 text-xs font-bold tracking-wide transition";
  const linkActivo = "border-neon bg-neon/15 text-white neon-border";
  const linkInactivo = "border-white/10 text-white/60 hover:border-white/30";

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-cinema-dark/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/caja" className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-neon" />
          <span className="font-[family-name:var(--font-display)] text-base uppercase leading-none text-white sm:text-lg">
            {BUSINESS.name}
            <span className="mt-0.5 block text-[10px] font-bold tracking-[0.25em] text-neon">
              TOMA DE PEDIDOS
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/caja"
            className={`${linkBase} border ${
              !esRegistro && !esReparto ? linkActivo : linkInactivo
            }`}
          >
            PEDIDOS
          </Link>
          <Link
            href="/caja/registro"
            className={`${linkBase} border ${
              esRegistro ? linkActivo : linkInactivo
            }`}
          >
            REGISTRO
          </Link>
          <Link
            href="/caja/reparto"
            className={`${linkBase} border ${
              esReparto ? linkActivo : linkInactivo
            }`}
          >
            REPARTO
          </Link>
          <Link
            href="/"
            className={`${linkBase} border ${linkInactivo}`}
            title="Volver a la landing"
          >
            ← INICIO
          </Link>
        </nav>
      </div>
    </header>
  );
}
