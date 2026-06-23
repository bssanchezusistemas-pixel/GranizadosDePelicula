import {
  calcularDevuelta,
  type FormaPago as FormaPagoDomicilio,
  type PedidoEfectivoCalculo,
} from "@/data/domicilios";

/** Dónde se entrega el pedido tomado en caja. */
export type TipoEntrega = "local" | "recoge" | "domicilio";

/** Reutilizamos la misma unión que usa el módulo de domicilios. */
export type FormaPago = FormaPagoDomicilio; // "efectivo" | "transferencia"

export interface ItemPedido {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

/** Estado de un pedido domiciliario en el tablero de reparto. */
export type EstadoDomicilio = "pendiente" | "aceptado";

/** ¿Quién asume el costo de la comisión del domiciliario? */
export type TipoComision = "cliente" | "restaurante";

export interface Pedido {
  id: string;
  numeroPedido: number;
  items: ItemPedido[];
  total: number;
  tipoEntrega: TipoEntrega;
  formaPago: FormaPago;
  direccion?: string;
  creadoEn: string; // ISO string
  // --- Solo para domicilio ---
  domiciliarioId?: string;
  domiciliarioNombre?: string;
  /** Con cuánto paga el cliente en efectivo (para calcular devuelta). */
  pagaCon?: number;
  estadoDomicilio?: EstadoDomicilio;
  /** Quién paga la comisión del domiciliario (solo aplica a domicilio). */
  comisionPagadaPor?: TipoComision;
}

export interface Repartidor {
  id: string;
  nombre: string;
}

/** Repartidores disponibles para el demo. */
export const REPARTIDORES: Repartidor[] = [
  { id: "fernando", nombre: "Fernando" },
  { id: "sebastian", nombre: "Sebastián" },
];

/** Comisión fija por entrega de domiciliario. */
export const COMISION_REPARTIDOR = 3_000;

export const TIPO_COMISION_LABEL: Record<TipoComision, string> = {
  cliente: "El cliente paga",
  restaurante: "El restaurante paga",
};

/** Número inicial de la secuencia de pedidos del día. */
export const PEDIDO_INICIAL = 5750;

export const TIPO_ENTREGA_LABEL: Record<TipoEntrega, string> = {
  local: "En local",
  recoge: "Recoge en local",
  domicilio: "Domicilio",
};

export const FORMA_PAGO_LABEL: Record<FormaPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

/**
 * Resumen corto de los items de un pedido (ej: "2x Tradicional · 1x Coca-Cola").
 * Pensado para mostrar en tablas donde no cabe el detalle completo.
 */
export function resumirItems(items: ItemPedido[], max = 3): string {
  if (items.length === 0) return "—";
  const visibles = items.slice(0, max).map((i) => `${i.cantidad}x ${i.nombre}`);
  const extra = items.length > max ? ` · +${items.length - max}` : "";
  return `${visibles.join(" · ")}${extra}`;
}

/**
 * Mapea un Pedido de caja al input que espera el flujo de admin/domicilios.
 *
 * TODO: conectar con el flujo de admin/domicilios cuando se implemente Supabase.
 * Cuando el tipo de entrega sea "domicilio", este objeto deberá insertarse como
 * un PedidoDomicilio (estado "pendiente") para que aparezca en el panel de
 * admin/domicilios y se le asigne repartidor. La estructura ya es compatible
 * (mismos nombres donde aplica: items, direccion, forma_pago) — solo falta
 * llamar a la action de creación cuando exista la capa de datos.
 */
export interface PedidoDomicilioInput {
  numero_pedido: string;
  canal: "local";
  items: string;
  direccion?: string;
  valor_pedido: number;
  forma_pago: FormaPago;
}

export function pedidoToDomicilioInput(pedido: Pedido): PedidoDomicilioInput {
  return {
    numero_pedido: String(pedido.numeroPedido),
    canal: "local",
    items: resumirItems(pedido.items),
    direccion: pedido.direccion,
    valor_pedido: pedido.total,
    forma_pago: pedido.formaPago,
  };
}

/**
 * Mapea un Pedido de caja a la forma que entienden las funciones de cálculo
 * de domicilios (calcularVentasEfectivo, calcularCobroEfectivo,
 * calcularDevueltasEfectivo, calcularDebeEntregar, calcularDevuelta).
 * Así reutilizamos la lógica ya probada de base/sin-base sin duplicarla.
 */
export function pedidoToDomicilioCalculo(pedido: Pedido): PedidoEfectivoCalculo {
  return {
    forma_pago: pedido.formaPago,
    valor_pedido: pedido.total,
    paga_con: pedido.pagaCon ?? null,
    devuelta:
      pedido.formaPago === "efectivo" && pedido.pagaCon != null
        ? calcularDevuelta({
            forma_pago: pedido.formaPago,
            valor_pedido: pedido.total,
            paga_con: pedido.pagaCon,
          })
        : null,
  };
}

// ---------------------------------------------------------------------------
// Datos de ejemplo (mock) para que la pantalla de registro no nazca vacía.
// ---------------------------------------------------------------------------
const hoy = new Date();
function isoHoy(hora: string, minuto: string): string {
  const [h, m] = [Number(hora), Number(minuto)];
  const d = new Date(hoy);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export const PEDIDOS_MOCK: Pedido[] = [
  {
    id: "mock-1",
    numeroPedido: 5750,
    items: [
      {
        productoId: "hd-tradicional",
        nombre: "Tradicional",
        cantidad: 2,
        precioUnitario: 16000,
      },
      {
        productoId: "beb-coca",
        nombre: "Coca-Cola Personal",
        cantidad: 2,
        precioUnitario: 4500,
      },
    ],
    total: 41000,
    tipoEntrega: "local",
    formaPago: "efectivo",
    creadoEn: isoHoy("17", "12"),
  },
  {
    id: "mock-2",
    numeroPedido: 5751,
    items: [
      {
        productoId: "sal-pelicula",
        nombre: "Salchi | Película (Mediana)",
        cantidad: 1,
        precioUnitario: 39000,
      },
    ],
    total: 39000,
    tipoEntrega: "recoge",
    formaPago: "transferencia",
    creadoEn: isoHoy("18", "05"),
  },
  {
    id: "mock-3",
    numeroPedido: 5752,
    items: [
      {
        productoId: "ham-chingona",
        nombre: "La Chingona",
        cantidad: 1,
        precioUnitario: 26000,
      },
      {
        productoId: "soda-maracuya",
        nombre: "Maracuyá",
        cantidad: 1,
        precioUnitario: 13000,
      },
    ],
    total: 39000,
    tipoEntrega: "domicilio",
    formaPago: "transferencia",
    direccion: "Cra 8 #5-18, barrio Centro",
    creadoEn: isoHoy("19", "33"),
    domiciliarioId: "fernando",
    domiciliarioNombre: "Fernando",
    estadoDomicilio: "pendiente",
    comisionPagadaPor: "cliente",
  },
  {
    id: "mock-4",
    numeroPedido: 5753,
    items: [
      {
        productoId: "tacos-birria",
        nombre: "Tacos de Birria (4 tacos)",
        cantidad: 1,
        precioUnitario: 28000,
      },
      {
        productoId: "lim-coco",
        nombre: "Limonada Coco",
        cantidad: 2,
        precioUnitario: 10000,
      },
    ],
    total: 48000,
    tipoEntrega: "domicilio",
    formaPago: "efectivo",
    direccion: "Calle 12 #3-40, Urb. Los Almendros",
    creadoEn: isoHoy("20", "10"),
    domiciliarioId: "sebastian",
    domiciliarioNombre: "Sebastián",
    pagaCon: 50000,
    estadoDomicilio: "aceptado",
    comisionPagadaPor: "restaurante",
  },
];
