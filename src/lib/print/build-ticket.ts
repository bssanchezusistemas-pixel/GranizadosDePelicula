import {
  COMISION_DOMICILIO,
  FORMA_PAGO_LABEL,
  formatModificadores,
  type ItemPedidoCarrito,
  type PedidoCaja,
  type TipoEntrega,
  type Ubicacion,
} from "@/data/caja";
import type { FormaPago } from "@/data/domicilios";
import { formatHoraBogota } from "@/lib/dates";
import type { OrderTicket } from "@/lib/print/types";

export interface BuildTicketInput {
  items: ItemPedidoCarrito[];
  pedido: PedidoCaja;
  tipoEntrega: TipoEntrega;
  formaPago: FormaPago;
  ubicaciones: Ubicacion[];
  ubicacionId: string | null;
  nombreRecoge: string;
  direccion: string;
  pagaCon: number;
}

function buildDestino(input: BuildTicketInput): string {
  const { pedido, tipoEntrega, ubicaciones, ubicacionId, nombreRecoge, direccion } =
    input;

  if (tipoEntrega === "mesa") {
    const label =
      pedido.ubicacion?.label ??
      ubicaciones.find((u) => u.id === ubicacionId)?.label;
    return label ?? "Mesa";
  }
  if (tipoEntrega === "recoger") {
    const nombre = nombreRecoge.trim() || pedido.nombre_recoge?.trim();
    return nombre ? `Recoger — ${nombre}` : "Para recoger";
  }
  const dir = direccion.trim() || pedido.direccion?.trim();
  return dir ? `Domicilio — ${dir}` : "Domicilio";
}

export function buildOrderTicket(input: BuildTicketInput): OrderTicket {
  const { items, pedido, tipoEntrega, formaPago, pagaCon } = input;

  const subtotal = items.reduce(
    (s, i) => s + i.precioUnitario * i.cantidad,
    0,
  );
  const comisionDomicilio =
    tipoEntrega === "domicilio" ? COMISION_DOMICILIO : undefined;
  const total = Number(pedido.total);

  const meseroNombre =
    pedido.mesero && typeof pedido.mesero === "object" && "nombre" in pedido.mesero
      ? String(pedido.mesero.nombre)
      : undefined;

  const pagaConVal =
    formaPago === "efectivo" && pagaCon > 0
      ? pagaCon
      : pedido.paga_con != null
        ? Number(pedido.paga_con)
        : undefined;

  const devueltaVal =
    pedido.devuelta != null && Number(pedido.devuelta) > 0
      ? Number(pedido.devuelta)
      : undefined;

  return {
    numeroPedido: pedido.numero_pedido,
    hora: formatHoraBogota(pedido.creado_en),
    destino: buildDestino(input),
    mesero: meseroNombre,
    formaPago: FORMA_PAGO_LABEL[formaPago],
    items: items.map((item) => {
      const mods = formatModificadores(item);
      return {
        cantidad: item.cantidad,
        nombre: item.nombre,
        precioLinea: item.precioUnitario * item.cantidad,
        modificadores: mods || undefined,
      };
    }),
    subtotal,
    comisionDomicilio,
    total:
      tipoEntrega === "domicilio"
        ? Number(pedido.total)
        : subtotal,
    pagaCon: pagaConVal,
    devuelta: devueltaVal,
  };
}
