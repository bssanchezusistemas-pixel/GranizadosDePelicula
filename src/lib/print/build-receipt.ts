import {
  FORMA_PAGO_LABEL,
  formatModificadores,
  destinoPedido,
  type PedidoCaja,
  type PedidoItemCaja,
} from "@/data/caja";
import { formatHoraBogota } from "@/lib/dates";
import type { OrderTicket } from "@/lib/print/types";

export interface BuildReceiptInput {
  pedido: PedidoCaja;
  items: PedidoItemCaja[];
  pagaCon?: number;
  devuelta?: number;
  kind?: "recibo" | "completo";
}

export function buildReceiptTicket(input: BuildReceiptInput): OrderTicket {
  const { pedido, items, pagaCon, devuelta, kind = "recibo" } = input;

  const subtotal = items.reduce(
    (s, i) => s + Number(i.precio_unitario) * i.cantidad,
    0,
  );

  const total = Number(pedido.total);
  const comisionDomicilio =
    pedido.tipo_entrega === "domicilio" && total > subtotal
      ? total - subtotal
      : undefined;

  const pagaConVal =
    pagaCon != null && pagaCon > 0
      ? pagaCon
      : pedido.paga_con != null
        ? Number(pedido.paga_con)
        : undefined;

  const devueltaVal =
    devuelta != null && devuelta > 0
      ? devuelta
      : pedido.devuelta != null && Number(pedido.devuelta) > 0
        ? Number(pedido.devuelta)
        : undefined;

  const meseroNombre =
    pedido.mesero && typeof pedido.mesero === "object" && "nombre" in pedido.mesero
      ? String(pedido.mesero.nombre)
      : undefined;

  return {
    numeroPedido: pedido.numero_pedido,
    hora: formatHoraBogota(pedido.cerrado_en ?? pedido.creado_en),
    destino: destinoPedido(pedido),
    mesero: meseroNombre,
    formaPago: FORMA_PAGO_LABEL[pedido.forma_pago],
    items: items.map((item) => {
      const mods = formatModificadores(item);
      return {
        cantidad: item.cantidad,
        nombre: item.nombre,
        precioLinea: Number(item.precio_unitario) * item.cantidad,
        modificadores: mods || undefined,
      };
    }),
    subtotal,
    comisionDomicilio,
    total,
    pagaCon: pagaConVal,
    devuelta: devueltaVal,
    station: "caja",
    kind,
  };
}
