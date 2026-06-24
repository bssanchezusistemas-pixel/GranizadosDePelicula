"use client";

import { MetricCard } from "@/components/admin/MetricCard";
import { formatCOP } from "@/lib/currency";
import { formatRangoFechas } from "@/lib/dates";
import type { ResumenSemanalCaja } from "@/data/caja";

interface WeeklySummaryProps {
  resumen: ResumenSemanalCaja;
  onSeleccionarDia?: (fecha: string) => void;
}

export function WeeklySummary({ resumen, onSeleccionarDia }: WeeklySummaryProps) {
  const { lunes, domingo, dias, totales } = resumen;

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/50">
        Semana {formatRangoFechas(lunes, domingo)} · {totales.pedidos} pedidos
      </p>

      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <MetricCard
          label="Total semana"
          value={formatCOP(totales.total)}
          sub={`${totales.pedidos} pedidos`}
          subVariant="ok"
        />
        <MetricCard
          label="Efectivo"
          value={formatCOP(totales.efectivo)}
          sub="pedidos cerrados"
        />
        <MetricCard
          label="Transferencia"
          value={formatCOP(totales.transferencia)}
          sub="pedidos cerrados"
        />
        <MetricCard
          label="Promedio / día"
          value={formatCOP(Math.round(totales.total / 7))}
          sub="con ventas cerradas"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {dias.map((dia) => {
          const contenido = (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">
                {dia.etiqueta}
              </p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-lg text-white">
                {formatCOP(dia.total)}
              </p>
              <p className="mt-1 text-[11px] text-white/40">
                {dia.pedidos} pedido{dia.pedidos === 1 ? "" : "s"}
              </p>
            </>
          );

          if (onSeleccionarDia) {
            return (
              <button
                key={dia.fecha}
                type="button"
                onClick={() => onSeleccionarDia(dia.fecha)}
                className="rounded-xl border border-white/10 bg-cinema-gray p-4 text-left transition hover:border-neon/40 hover:bg-neon/5"
              >
                {contenido}
              </button>
            );
          }

          return (
            <div
              key={dia.fecha}
              className="rounded-xl border border-white/10 bg-cinema-gray p-4"
            >
              {contenido}
            </div>
          );
        })}
      </div>
    </div>
  );
}
