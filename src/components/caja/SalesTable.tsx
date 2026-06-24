"use client";

import { formatCOP } from "@/lib/currency";
import { formatHoraBogota } from "@/lib/dates";
import {
  destinoPedido,
  FORMA_PAGO_LABEL,
  resumirItems,
  type PedidoCaja,
} from "@/data/caja";

interface SalesTableProps {
  pedidos: PedidoCaja[];
  titulo?: string;
  mensajeVacio?: string;
}

const columnas = [
  "Pedido",
  "Hora",
  "Items",
  "Destino",
  "Pago",
  "Total",
];

export function SalesTable({
  pedidos,
  titulo = "Ventas del día — detalle",
  mensajeVacio = "No hay ventas registradas en este período.",
}: SalesTableProps) {
  const ordenados = [...pedidos].sort(
    (a, b) => a.numero_pedido - b.numero_pedido,
  );

  const itemsResumen = (p: PedidoCaja) =>
    resumirItems(
      (p.items ?? []).map((i) => ({ nombre: i.nombre, cantidad: i.cantidad })),
    );

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="text-sm font-bold uppercase tracking-wide">
          {titulo}
        </div>
        <span className="rounded-full bg-zinc-800 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          {pedidos.length} registros
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              {columnas.map((h) => (
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
            {ordenados.map((p) => (
              <tr
                key={p.id}
                className="border-b border-zinc-800 last:border-none"
              >
                <td className="px-5 py-3.5 text-sm font-black text-white">
                  #{p.numero_pedido}
                  {p.estado === "abierto" && (
                    <span className="ml-2 text-[10px] font-bold text-amber-400">
                      ABIERTO
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-sm text-zinc-400">
                  {formatHoraBogota(p.creado_en)}
                </td>
                <td className="max-w-[280px] px-5 py-3.5 text-sm text-zinc-300">
                  <span className="line-clamp-2">{itemsResumen(p)}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      p.tipo_entrega === "domicilio"
                        ? "bg-amber-900/30 text-amber-400"
                        : p.tipo_entrega === "recoger"
                          ? "bg-blue-900/30 text-blue-300"
                          : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {destinoPedido(p)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      p.forma_pago === "efectivo"
                        ? "bg-red-900/20 text-red-300"
                        : "bg-blue-900/20 text-blue-300"
                    }`}
                  >
                    {FORMA_PAGO_LABEL[p.forma_pago].toUpperCase()}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm font-black text-white">
                  {formatCOP(Number(p.total))}
                </td>
              </tr>
            ))}

            {pedidos.length === 0 && (
              <tr>
                <td
                  colSpan={columnas.length}
                  className="px-5 py-8 text-center text-sm text-zinc-500"
                >
                  {mensajeVacio}
                </td>
              </tr>
            )}
          </tbody>

          {pedidos.length > 0 && (
            <tfoot>
              <tr>
                <td
                  colSpan={columnas.length - 1}
                  className="border-t border-zinc-800 bg-zinc-950/40 px-5 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-zinc-400"
                >
                  Total acumulado (pedidos cerrados)
                </td>
                <td className="border-t border-zinc-800 bg-zinc-950/40 px-5 py-3 font-[family-name:var(--font-display)] text-base text-neon">
                  {formatCOP(
                    pedidos
                      .filter((p) => p.estado === "cerrado")
                      .reduce((s, p) => s + Number(p.total), 0),
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
