"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatHoraBogota } from "@/lib/dates";
import {
  destinoPedido,
  formatModificadores,
  type PedidoCaja,
  type PedidoItemCaja,
} from "@/data/caja";
import {
  getPedidosCocinaAction,
  marcarItemListoAction,
} from "@/app/caja/actions";

export function CocinaBoard() {
  const [pedidos, setPedidos] = useState<PedidoCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [marcandoId, setMarcandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await getPedidosCocinaAction();
      setPedidos(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los pedidos.");
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 10_000);
    return () => clearInterval(interval);
  }, [cargar]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const supabase = createClient();
    const channel = supabase
      .channel("cocina-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos_caja" },
        () => {
          if (debounce) clearTimeout(debounce);
          debounce = setTimeout(() => cargar(), 400);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedido_items_caja" },
        () => {
          if (debounce) clearTimeout(debounce);
          debounce = setTimeout(() => cargar(), 400);
        },
      )
      .subscribe();

    return () => {
      if (debounce) clearTimeout(debounce);
      supabase.removeChannel(channel);
    };
  }, [cargar]);

  async function marcarListo(item: PedidoItemCaja) {
    setMarcandoId(item.id);
    try {
      await marcarItemListoAction(item.id);
      setPedidos((prev) =>
        prev
          .map((p) => ({
            ...p,
            items: (p.items ?? []).filter((i) => i.id !== item.id),
          }))
          .filter((p) => (p.items ?? []).length > 0),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo marcar como listo.");
      await cargar();
    } finally {
      setMarcandoId(null);
    }
  }

  if (loading) {
    return (
      <p className="py-20 text-center text-lg text-white/50">
        Cargando pedidos...
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-700/40 bg-red-900/15 px-5 py-4 text-sm font-bold text-red-300">
        {error}
      </div>
    );
  }

  const pendientes = pedidos.flatMap((p) =>
    (p.items ?? [])
      .filter((i) => i.estado_cocina === "pendiente")
      .map((i) => ({ pedido: p, item: i })),
  );

  if (pendientes.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <span className="mb-4 text-5xl opacity-30">✓</span>
        <p className="font-[family-name:var(--font-display)] text-2xl uppercase text-white/40">
          Sin pedidos pendientes
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {pedidos.map((pedido) => {
        const itemsPendientes = (pedido.items ?? []).filter(
          (i) => i.estado_cocina === "pendiente",
        );
        if (itemsPendientes.length === 0) return null;

        return (
          <article
            key={pedido.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
          >
            <header className="border-b border-white/10 bg-zinc-950/60 px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-2xl text-neon">
                    #{pedido.numero_pedido}
                  </p>
                  <p className="mt-1 text-sm font-bold uppercase text-white">
                    {destinoPedido(pedido)}
                  </p>
                  {pedido.mesero?.nombre && (
                    <p className="text-[11px] text-white/40">
                      Mesero: {pedido.mesero.nombre}
                    </p>
                  )}
                </div>
                <time className="text-[11px] font-bold text-white/40">
                  {formatHoraBogota(pedido.creado_en)}
                </time>
              </div>
            </header>

            <ul className="divide-y divide-white/5">
              {itemsPendientes.map((item) => {
                const mods = formatModificadores(item);
                return (
                  <li key={item.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black uppercase text-white">
                          {item.cantidad}x {item.nombre}
                        </p>
                        {mods && (
                          <p className="mt-1 text-sm font-bold text-amber-400">
                            {mods}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={marcandoId === item.id}
                        onClick={() => marcarListo(item)}
                        className="shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {marcandoId === item.id ? "..." : "Listo"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
