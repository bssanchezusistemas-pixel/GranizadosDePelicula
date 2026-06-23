"use client";

import { useState } from "react";
import { REPARTIDORES, type Pedido } from "@/data/ventas";
import { RepartoColumn } from "@/components/caja/RepartoColumn";

interface RepartoBoardProps {
  pedidos: Pedido[];
  bases: Record<string, number>;
  onToggleBase: (repartidorId: string) => void;
  onAceptar: (pedidoId: string) => void;
}

type Filtro = "todos" | string;

export function RepartoBoard({
  pedidos,
  bases,
  onToggleBase,
  onAceptar,
}: RepartoBoardProps) {
  const [filtro, setFiltro] = useState<Filtro>("todos");

  // Solo importan los domicilios (local/recoge no van a reparto).
  const domicilios = pedidos.filter((p) => p.tipoEntrega === "domicilio");

  const repartidoresVisibles =
    filtro === "todos"
      ? REPARTIDORES
      : REPARTIDORES.filter((r) => r.id === filtro);

  return (
    <div>
      {/* Filtro */}
      <nav
        aria-label="Filtrar por repartidor"
        className="mb-5 flex flex-wrap gap-2"
      >
        <FiltroChip
          activo={filtro === "todos"}
          onClick={() => setFiltro("todos")}
        >
          Todos · {domicilios.length}
        </FiltroChip>
        {REPARTIDORES.map((r) => {
          const cuenta = domicilios.filter(
            (p) => p.domiciliarioId === r.id,
          ).length;
          return (
            <FiltroChip
              key={r.id}
              activo={filtro === r.id}
              onClick={() => setFiltro(r.id)}
            >
              {r.nombre} · {cuenta}
            </FiltroChip>
          );
        })}
      </nav>

      {/* Columnas kanban */}
      <div
        className={`grid gap-5 ${
          repartidoresVisibles.length > 1
            ? "lg:grid-cols-2"
            : "grid-cols-1 max-w-xl"
        }`}
      >
        {repartidoresVisibles.map((r) => (
          <RepartoColumn
            key={r.id}
            repartidor={r}
            pedidos={domicilios.filter((p) => p.domiciliarioId === r.id)}
            base={bases[r.id] ?? 0}
            onToggleBase={() => onToggleBase(r.id)}
            onAceptar={onAceptar}
          />
        ))}
      </div>

      {domicilios.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-cinema-dark/40 px-6 py-12 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-white/40">
            Sin domicilios todavía
          </p>
          <p className="mt-1.5 text-xs text-white/25">
            Crea un pedido en{" "}
            <span className="text-neon">PEDIDOS</span> con tipo de entrega
            “Domicilio” y aparecerá aquí.
          </p>
        </div>
      )}
    </div>
  );
}

function FiltroChip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition ${
        activo
          ? "border-neon bg-neon/15 text-white neon-border"
          : "border-white/10 text-white/55 hover:border-white/30"
      }`}
    >
      {children}
    </button>
  );
}
