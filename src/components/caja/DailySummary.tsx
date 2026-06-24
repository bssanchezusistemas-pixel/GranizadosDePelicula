"use client";

import { MetricCard } from "@/components/admin/MetricCard";
import { formatCOP } from "@/lib/currency";
import {
  TIPO_ENTREGA_LABEL,
  type PedidoCaja,
  type TipoEntrega,
} from "@/data/caja";

interface DailySummaryProps {
  pedidos: PedidoCaja[];
  tituloTotal?: string;
}

const TIPOS: TipoEntrega[] = ["mesa", "recoger", "domicilio"];

export function DailySummary({
  pedidos,
  tituloTotal = "Total vendido hoy",
}: DailySummaryProps) {
  const cerrados = pedidos.filter((p) => p.estado === "cerrado");
  const abiertos = pedidos.filter((p) => p.estado === "abierto");
  const totalVendido = cerrados.reduce((s, p) => s + Number(p.total), 0);
  const totalEfectivo = cerrados
    .filter((p) => p.forma_pago === "efectivo")
    .reduce((s, p) => s + Number(p.total), 0);
  const totalTransferencia = cerrados
    .filter((p) => p.forma_pago === "transferencia")
    .reduce((s, p) => s + Number(p.total), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
        <MetricCard
          label={tituloTotal}
          value={formatCOP(totalVendido)}
          sub={`${cerrados.length} cerrados · ${abiertos.length} abiertos en mesa`}
          subVariant="ok"
        />
        <MetricCard
          label="Efectivo"
          value={formatCOP(totalEfectivo)}
          sub={`${cerrados.filter((p) => p.forma_pago === "efectivo").length} pagos`}
        />
        <MetricCard
          label="Transferencia"
          value={formatCOP(totalTransferencia)}
          sub={`${cerrados.filter((p) => p.forma_pago === "transferencia").length} pagos`}
        />
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {TIPOS.map((tipo) => {
          const delTipo = pedidos.filter((p) => p.tipo_entrega === tipo);
          const sumaCerrados = delTipo
            .filter((p) => p.estado === "cerrado")
            .reduce((s, p) => s + Number(p.total), 0);
          return (
            <MetricCard
              key={tipo}
              label={TIPO_ENTREGA_LABEL[tipo]}
              value={String(delTipo.length)}
              sub={formatCOP(sumaCerrados)}
            />
          );
        })}
      </div>
    </div>
  );
}
