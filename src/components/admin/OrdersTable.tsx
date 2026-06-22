import type { PedidoDomicilio, Domiciliario } from "@/data/domicilios";

interface OrdersTableProps {
  pedidos: PedidoDomicilio[];
  domiciliarios: Domiciliario[];
}

function formatCOP(value: number) {
  return value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
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

export function OrdersTable({ pedidos, domiciliarios }: OrdersTableProps) {
  const nombrePor = (id: string | null) =>
    domiciliarios.find((d) => d.id === id)?.nombre ?? "Sin asignar";

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="text-sm font-bold">Pedidos del día — detalle</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              {["Pedido", "Domiciliario", "Valor", "Pago", "Estado", "Hora"].map(
                (h) => (
                  <th
                    key={h}
                    className="border-y border-zinc-800 bg-zinc-950/40 px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-zinc-500"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
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
                  {formatHora(p.creado_en)}
                </td>
              </tr>
            ))}
            {pedidos.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-8 text-center text-sm text-zinc-500"
                >
                  Todavía no hay domicilios registrados hoy.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
