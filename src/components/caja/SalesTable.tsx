"use client";

import { useMemo, useState } from "react";
import { formatCOP } from "@/lib/currency";
import { formatHoraBogota } from "@/lib/dates";
import { cancelarPedidoCajaAction } from "@/app/caja/actions";
import { CancelPedidoCajaModal } from "@/components/caja/CancelPedidoCajaModal";
import {
  destinoPedido,
  FORMA_PAGO_LABEL,
  resumirItems,
  type PedidoCaja,
} from "@/data/caja";
import { getAllMenuProducts } from "@/data/menu";

interface SalesTableProps {
  pedidos: PedidoCaja[];
  titulo?: string;
  mensajeVacio?: string;
  onPedidoCancelado?: () => void;
}

const columnas = [
  "Pedido",
  "Hora",
  "Items",
  "Destino",
  "Pago",
  "Total",
  "Paga con",
  "Devuelta",
  "Acciones",
];

const PRODUCTOS_MENU = getAllMenuProducts();

function pedidoContieneProducto(
  pedido: PedidoCaja,
  productoId: string,
  nombreBase: string,
): boolean {
  const nombreLower = nombreBase.toLowerCase();
  return (pedido.items ?? []).some(
    (i) =>
      i.producto_id === productoId ||
      i.nombre.toLowerCase().includes(nombreLower),
  );
}

function contarUnidadesProducto(
  pedidos: PedidoCaja[],
  productoId: string,
  nombreBase: string,
): number {
  const nombreLower = nombreBase.toLowerCase();
  let total = 0;
  for (const p of pedidos) {
    for (const i of p.items ?? []) {
      if (
        i.producto_id === productoId ||
        i.nombre.toLowerCase().includes(nombreLower)
      ) {
        total += i.cantidad;
      }
    }
  }
  return total;
}

export function SalesTable({
  pedidos,
  titulo = "Ventas del día — detalle",
  mensajeVacio = "No hay ventas registradas en este período.",
  onPedidoCancelado,
}: SalesTableProps) {
  const [productoFiltroId, setProductoFiltroId] = useState("");
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [pedidoACancelar, setPedidoACancelar] = useState<PedidoCaja | null>(
    null,
  );

  const productoSeleccionado = useMemo(
    () => PRODUCTOS_MENU.find((p) => p.id === productoFiltroId) ?? null,
    [productoFiltroId],
  );

  const sugerenciasProducto = useMemo(() => {
    const q = busquedaProducto.trim().toLowerCase();
    if (!q) return [];
    return PRODUCTOS_MENU.filter((p) => p.name.toLowerCase().includes(q)).slice(
      0,
      8,
    );
  }, [busquedaProducto]);

  const pedidosFiltrados = useMemo(() => {
    if (!productoSeleccionado) return pedidos;
    return pedidos.filter((p) =>
      pedidoContieneProducto(
        p,
        productoSeleccionado.id,
        productoSeleccionado.name,
      ),
    );
  }, [pedidos, productoSeleccionado]);

  const resumenFiltro = useMemo(() => {
    if (!productoSeleccionado) return null;
    const activos = pedidosFiltrados.filter((p) => p.estado !== "cancelado");
    return {
      unidades: contarUnidadesProducto(
        activos,
        productoSeleccionado.id,
        productoSeleccionado.name,
      ),
      pedidos: activos.length,
    };
  }, [pedidosFiltrados, productoSeleccionado]);

  const ordenados = [...pedidosFiltrados].sort(
    (a, b) => a.numero_pedido - b.numero_pedido,
  );

  const itemsResumen = (p: PedidoCaja) =>
    resumirItems(
      (p.items ?? []).map((i) => ({ nombre: i.nombre, cantidad: i.cantidad })),
    );

  async function confirmarCancelacion() {
    if (!pedidoACancelar) return;
    await cancelarPedidoCajaAction(pedidoACancelar.id);
    onPedidoCancelado?.();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 px-5 py-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-bold uppercase tracking-wide">
            {titulo}
          </div>
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            {pedidosFiltrados.length} registros
          </span>
        </div>

        <div className="relative">
          <input
            type="search"
            value={busquedaProducto}
            onChange={(e) => {
              setBusquedaProducto(e.target.value);
              if (!e.target.value.trim()) setProductoFiltroId("");
            }}
            placeholder="Filtrar por producto vendido..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-neon focus:outline-none"
          />
          {productoSeleccionado && (
            <button
              type="button"
              onClick={() => {
                setProductoFiltroId("");
                setBusquedaProducto("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 hover:text-white"
            >
              Limpiar
            </button>
          )}
          {sugerenciasProducto.length > 0 && !productoSeleccionado && (
            <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-zinc-700 bg-zinc-950 shadow-lg">
              {sugerenciasProducto.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setProductoFiltroId(p.id);
                      setBusquedaProducto(p.name);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {resumenFiltro && productoSeleccionado && (
          <p className="mt-3 rounded-lg border border-neon/20 bg-neon/5 px-4 py-2.5 text-sm text-zinc-200">
            <span className="font-bold text-white">{productoSeleccionado.name}</span>
            {" · "}
            {resumenFiltro.unidades} unidad
            {resumenFiltro.unidades === 1 ? "" : "es"} vendida
            {resumenFiltro.unidades === 1 ? "" : "s"} · {resumenFiltro.pedidos}{" "}
            pedido{resumenFiltro.pedidos === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
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
            {ordenados.map((p) => {
              const cancelado = p.estado === "cancelado";
              return (
                <tr
                  key={p.id}
                  className={`border-b border-zinc-800 last:border-none ${
                    cancelado ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-5 py-3.5 text-sm font-black text-white">
                    #{p.numero_pedido}
                    {p.estado === "abierto" && (
                      <span className="ml-2 text-[10px] font-bold text-amber-400">
                        ABIERTO
                      </span>
                    )}
                    {cancelado && (
                      <span className="ml-2 text-[10px] font-bold text-zinc-500">
                        CANCELADO
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
                  <td className="px-5 py-3.5 text-sm text-zinc-400">
                    {p.forma_pago === "efectivo" && p.paga_con != null
                      ? formatCOP(Number(p.paga_con))
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-amber-400">
                    {p.forma_pago === "efectivo" &&
                    p.devuelta != null &&
                    Number(p.devuelta) > 0
                      ? formatCOP(Number(p.devuelta))
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    {!cancelado && (
                      <button
                        type="button"
                        onClick={() => setPedidoACancelar(p)}
                        className="rounded border border-zinc-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400 hover:border-amber-600 hover:text-amber-300"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {pedidosFiltrados.length === 0 && (
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

          {pedidosFiltrados.length > 0 && (
            <tfoot>
              <tr>
                <td
                  colSpan={8}
                  className="border-t border-zinc-800 bg-zinc-950/40 px-5 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-zinc-400"
                >
                  Total acumulado (pedidos cerrados)
                </td>
                <td className="border-t border-zinc-800 bg-zinc-950/40 px-5 py-3 font-[family-name:var(--font-display)] text-base text-neon">
                  {formatCOP(
                    pedidosFiltrados
                      .filter((p) => p.estado === "cerrado")
                      .reduce((s, p) => s + Number(p.total), 0),
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {pedidoACancelar && (
        <CancelPedidoCajaModal
          pedido={pedidoACancelar}
          onClose={() => setPedidoACancelar(null)}
          onConfirm={confirmarCancelacion}
        />
      )}
    </div>
  );
}
