"use client";

import type { PedidoDomicilio, Domiciliario } from "@/data/domicilios";
import { formatCOP } from "@/lib/currency";
import { formatHoraBogota } from "@/lib/dates";

interface OrdersTableProps {
  pedidos: PedidoDomicilio[];
  domiciliarios: Domiciliario[];
  filtroNombre?: string;
  onLimpiarFiltro?: () => void;
  onEditar: (pedido: PedidoDomicilio) => void;
  onEliminar: (pedido: PedidoDomicilio) => void;
}

const estadoStyles: Record<string, string> = {
  entregado: "bg-emerald-900/30 text-emerald-400",
  en_camino: "bg-amber-900/30 text-amber-400",
  pendiente: "bg-amber-900/30 text-amber-400",
  cancelado: "bg-zinc-800 text-zinc-500",
};

const estadoLabel: Record<string, string> = {
  entregado: "Entregado",
  en_camino: "En camino",
  pendiente: "Pendiente",
  cancelado: "Cancelado",
};

export function OrdersTable({
  pedidos,
  domiciliarios,
  filtroNombre,
  onLimpiarFiltro,
  onEditar,
  onEliminar,
}: OrdersTableProps) {
  const nombrePor = (id: string | null) =>
    domiciliarios.find((d) => d.id === id)?.nombre ?? "Sin asignar";

  const pedidosOrdenados = [...pedidos].sort((a, b) => {
    const nombreA = nombrePor(a.domiciliario_id);
    const nombreB = nombrePor(b.domiciliario_id);
    if (nombreA !== nombreB) return nombreA.localeCompare(nombreB, "es");
    return a.creado_en.localeCompare(b.creado_en);
  });

  const columnas = [
    "Pedido",
    "Domiciliario",
    "Valor",
    "Pago",
    "Estado",
    "Hora",
    "",
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="text-sm font-bold">
          {filtroNombre
            ? `Pedidos de ${filtroNombre} — detalle`
            : "Pedidos del día — detalle"}
        </div>
        {onLimpiarFiltro && (
          <button
            type="button"
            onClick={onLimpiarFiltro}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-[11px] font-bold text-zinc-300 transition hover:bg-zinc-800"
          >
            Ver todos
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              {columnas.map((h) => (
                <th
                  key={h || "acciones"}
                  className="border-y border-zinc-800 bg-zinc-950/40 px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-zinc-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedidosOrdenados.map((p) => (
              <tr key={p.id} className="border-b border-zinc-800 last:border-none">
                <td className="px-5 py-3.5 text-sm">#{p.numero_pedido}</td>
                <td className="px-5 py-3.5 text-sm">
                  {nombrePor(p.domiciliario_id)}
                </td>
                <td className="px-5 py-3.5 text-sm">
                  {formatCOP(p.valor_pedido)}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                      p.forma_pago === "efectivo"
                        ? "bg-red-900/20 text-red-300"
                        : "bg-blue-900/20 text-blue-300"
                    }`}
                  >
                    {p.forma_pago === "efectivo" ? "EFECTIVO" : "TRANSFER."}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${estadoStyles[p.estado]}`}
                  >
                    ● {estadoLabel[p.estado]}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-zinc-400">
                  {formatHoraBogota(p.creado_en)}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEditar(p)}
                      className="rounded border border-zinc-700 px-2.5 py-1 text-[10px] font-bold text-zinc-300 hover:bg-zinc-800"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onEliminar(p)}
                      className="rounded border border-red-800/50 px-2.5 py-1 text-[10px] font-bold text-red-400 hover:bg-red-900/20"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pedidos.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-8 text-center text-sm text-zinc-500"
                >
                  Todavía no hay domicilios registrados
                  {filtroNombre ? ` para ${filtroNombre}` : " hoy"}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
