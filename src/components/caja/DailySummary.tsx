"use client";

import { MetricCard } from "@/components/admin/MetricCard";
import { formatCOP } from "@/lib/currency";
import {
  TIPO_ENTREGA_LABEL,
  type Pedido,
  type TipoEntrega,
} from "@/data/ventas";

interface DailySummaryProps {
  pedidos: Pedido[];
}

const TIPOS: TipoEntrega[] = ["local", "recoge", "domicilio"];

export function DailySummary({ pedidos }: DailySummaryProps) {
  const totalVendido = pedidos.reduce((s, p) => s + p.total, 0);
  const totalEfectivo = pedidos
    .filter((p) => p.formaPago === "efectivo")
    .reduce((s, p) => s + p.total, 0);
  const totalTransferencia = pedidos
    .filter((p) => p.formaPago === "transferencia")
    .reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-4">
      {/* Totales generales */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
        <MetricCard
          label="Total vendido hoy"
          value={formatCOP(totalVendido)}
          sub={`${pedidos.length} pedidos`}
          subVariant="ok"
        />
        <MetricCard
          label="Efectivo"
          value={formatCOP(totalEfectivo)}
          sub={`${pedidos.filter((p) => p.formaPago === "efectivo").length} pagos`}
        />
        <MetricCard
          label="Transferencia"
          value={formatCOP(totalTransferencia)}
          sub={`${pedidos.filter((p) => p.formaPago === "transferencia").length} pagos`}
        />
      </div>

      {/* Desglose por tipo de entrega */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {TIPOS.map((tipo) => {
          const delTipo = pedidos.filter((p) => p.tipoEntrega === tipo);
          const suma = delTipo.reduce((s, p) => s + p.total, 0);
          return (
            <MetricCard
              key={tipo}
              label={TIPO_ENTREGA_LABEL[tipo]}
              value={String(delTipo.length)}
              sub={`${formatCOP(suma)}`}
            />
          );
        })}
      </div>
    </div>
  );
}
