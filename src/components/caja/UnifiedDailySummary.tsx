"use client";

import { MetricCard } from "@/components/admin/MetricCard";
import { formatCOP } from "@/lib/currency";
import type { CierreDiarioCompleto } from "@/data/caja";

interface UnifiedDailySummaryProps {
  cierre: CierreDiarioCompleto;
}

export function UnifiedDailySummary({ cierre }: UnifiedDailySummaryProps) {
  const { caja, domicilios } = cierre;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <MetricCard
          label="Gran total del día"
          value={formatCOP(cierre.granTotal)}
          sub={`POS ${formatCOP(caja.total)} + domicilios ${formatCOP(domicilios.total)}`}
          subVariant="ok"
        />
        <MetricCard
          label="Caja (POS)"
          value={formatCOP(caja.total)}
          sub={`${caja.cerrados} cerrados · ${caja.pedidos} pedidos`}
        />
        <MetricCard
          label="Domicilios"
          value={formatCOP(domicilios.total)}
          sub={`${domicilios.pedidos} pedidos`}
        />
        <MetricCard
          label="Cuadre repartidores"
          value={formatCOP(domicilios.diferenciaTotal)}
          sub={
            domicilios.diferenciaTotal === 0
              ? "Todo cuadrado"
              : `Falta entregar ${formatCOP(Math.abs(domicilios.diferenciaTotal))}`
          }
          subVariant={domicilios.diferenciaTotal === 0 ? "ok" : undefined}
        />
      </div>

      {cierre.repartidores.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="px-5 py-4 text-sm font-bold uppercase tracking-wide">
            Repartidores
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  {[
                    "Repartidor",
                    "Pedidos",
                    "Ventas",
                    "Debe entregar",
                    "Entregado",
                    "Diferencia",
                  ].map((h) => (
                    <th
                      key={h}
                      className="border-y border-zinc-800 bg-zinc-950/40 px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-zinc-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cierre.repartidores.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-zinc-800 last:border-none"
                  >
                    <td className="px-5 py-3.5 text-sm font-bold text-white">
                      {r.nombre}
                      {r.cuadrado && (
                        <span className="ml-2 text-[10px] font-bold text-emerald-400">
                          CUADRADO
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-300">
                      {r.pedidos}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-300">
                      {formatCOP(r.totalVentas)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-300">
                      {formatCOP(r.debeEntregar)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-300">
                      {formatCOP(r.efectivoEntregado)}
                    </td>
                    <td
                      className={`px-5 py-3.5 text-sm font-bold ${
                        r.diferencia === 0
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {formatCOP(r.diferencia)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
