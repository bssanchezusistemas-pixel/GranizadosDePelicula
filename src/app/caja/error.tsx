"use client";

import Link from "next/link";

export default function CajaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-400">
        Error en caja
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl uppercase text-white">
        No se pudo cargar esta pantalla
      </h1>
      <p className="mt-3 text-sm text-white/50">
        Suele deberse a sesión vencida o variables de entorno faltantes en el
        servidor (SESSION_SECRET, SUPABASE_SERVICE_ROLE_KEY).
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-[10px] text-white/30">
          Ref: {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-neon/50 bg-neon/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white"
        >
          Reintentar
        </button>
        <Link
          href="/caja/login"
          className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white/70"
        >
          Ir al login
        </Link>
      </div>
    </main>
  );
}
