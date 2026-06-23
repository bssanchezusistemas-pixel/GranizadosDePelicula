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

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPedidosDelDiaAction();
      setPedidos(data);
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
        "¿Reiniciar el registro del día? Se borrarán todos los pedidos de caja de hoy.",
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
          disabled={pedidos.length === 0 || reiniciando}
          className="rounded-full border border-amber-700/50 px-5 py-2 text-xs font-bold uppercase tracking-wide text-amber-300 transition hover:border-amber-500 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
        >
          {reiniciando ? "Reiniciando..." : "Reiniciar día"}
        </button>
      </div>

      <div className="space-y-8">
        <DailySummary pedidos={pedidos} />
        <SalesTable pedidos={pedidos} />
      </div>
    </main>
  );
}
