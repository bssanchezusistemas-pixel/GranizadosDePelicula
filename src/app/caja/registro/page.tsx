"use client";

import { DailySummary } from "@/components/caja/DailySummary";
import { SalesTable } from "@/components/caja/SalesTable";
import { useVentas } from "@/context/VentasContext";

export default function RegistroPage() {
  const { pedidos, reiniciarDia } = useVentas();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neon">
            Resumen de caja
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase text-white sm:text-3xl">
            Registro del día
          </h1>
          <p className="mt-1.5 text-sm text-white/40">
            {pedidos.length} pedidos registrados
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (
              confirm(
                "¿Reiniciar el registro del día? Se borrarán todos los pedidos en memoria.",
              )
            ) {
              reiniciarDia();
            }
          }}
          disabled={pedidos.length === 0}
          className="rounded-full border border-amber-700/50 px-5 py-2 text-xs font-bold uppercase tracking-wide text-amber-300 transition hover:border-amber-500 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
        >
          Reiniciar día
        </button>
      </div>

      <div className="space-y-8">
        <DailySummary pedidos={pedidos} />
        <SalesTable pedidos={pedidos} />
      </div>
    </main>
  );
}
