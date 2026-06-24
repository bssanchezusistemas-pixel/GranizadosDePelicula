"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPedidosDelDiaAction,
  reiniciarDiaCajaAction,
} from "@/app/caja/actions";
import { DailySummary } from "@/components/caja/DailySummary";
import { SalesTable } from "@/components/caja/SalesTable";
import type { PedidoCaja } from "@/data/caja";

export default function RegistroPage() {
  const [pedidos, setPedidos] = useState<PedidoCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [reiniciando, setReiniciando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPedidosDelDiaAction();
      setPedidos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el registro.");
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleReiniciar() {
    if (
      !confirm(
        "¿Cerrar operación del día? Se liberarán mesas y cocina. El registro de ventas de hoy se conserva.",
      )
    ) {
      return;
    }
    setReiniciando(true);
    try {
      await reiniciarDiaCajaAction();
      await cargar();
    } finally {
      setReiniciando(false);
    }
  }

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
            {loading ? "Cargando..." : `${pedidos.length} pedidos registrados`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleReiniciar}
          disabled={reiniciando}
          className="rounded-full border border-amber-700/50 px-5 py-2 text-xs font-bold uppercase tracking-wide text-amber-300 transition hover:border-amber-500 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
        >
          {reiniciando ? "Cerrando..." : "Cerrar operación"}
        </button>
      </div>

      <div className="space-y-8">
        {error && (
          <div className="rounded-xl border border-red-700/40 bg-red-900/15 px-5 py-3 text-sm font-bold text-red-300">
            {error}
          </div>
        )}
        <DailySummary pedidos={pedidos} />
        <SalesTable pedidos={pedidos} />
      </div>
    </main>
  );
}
