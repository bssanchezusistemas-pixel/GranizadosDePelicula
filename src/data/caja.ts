import type { MenuCategoryId } from "@/data/menu";
import type { FormaPago } from "@/data/domicilios";

/** Dónde se entrega el pedido tomado en caja. */
export type TipoEntrega = "mesa" | "recoger" | "domicilio";

export type EstadoPedidoCaja = "abierto" | "cerrado";
export type EstadoUbicacion = "libre" | "ocupada";
export type EstadoItemCocina = "pendiente" | "listo";
export type TipoUbicacion = "mesa" | "banco" | "barra";
export type TipoComision = "cliente" | "restaurante";

export const PEDIDO_INICIAL = 5750;
export const COMISION_DOMICILIO = 3_000;

export const TIPO_ENTREGA_LABEL: Record<TipoEntrega, string> = {
  mesa: "En mesa",
  recoger: "Para recoger",
  domicilio: "Domicilio",
};

export const FORMA_PAGO_LABEL: Record<FormaPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

export const TIPO_COMISION_LABEL: Record<TipoComision, string> = {
  cliente: "El cliente paga",
  restaurante: "El restaurante paga",
};

export interface ItemPedidoCarrito {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  categoriaId?: MenuCategoryId;
  sinIngredientes: string[];
  notasExtra?: string;
}

export interface Mesero {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface Ubicacion {
  id: string;
  tipo: TipoUbicacion;
  numero: number | null;
  label: string;
  estado: EstadoUbicacion;
  pedido_abierto_id: string | null;
}

export interface PedidoItemCaja {
  id: string;
  pedido_id: string;
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  categoria_id: string | null;
  sin_ingredientes: string[];
  notas_extra: string | null;
  estado_cocina: EstadoItemCocina;
  creado_en: string;
}

export interface PedidoCaja {
  id: string;
  numero_pedido: number;
  mesero_id: string | null;
  tipo_entrega: TipoEntrega;
  ubicacion_id: string | null;
  nombre_recoge: string | null;
  direccion: string | null;
  forma_pago: FormaPago;
  total: number;
  estado: EstadoPedidoCaja;
  paga_con: number | null;
  devuelta: number | null;
  comision_pagada_por: TipoComision | null;
  creado_en: string;
  cerrado_en: string | null;
  mesero?: { nombre: string } | null;
  ubicacion?: { label: string; tipo: TipoUbicacion } | null;
  items?: PedidoItemCaja[];
}

export interface NuevoPedidoInput {
  items: ItemPedidoCarrito[];
  tipoEntrega: TipoEntrega;
  formaPago: FormaPago;
  ubicacionId?: string;
  nombreRecoge?: string;
  direccion?: string;
  pagaCon?: number;
  comisionPagadaPor?: TipoComision;
  domiciliarioId?: string;
}

export interface DomiciliarioConJornada {
  id: string;
  nombre: string;
  turno_id: string;
}

export interface ResumenDiaCaja {
  fecha: string;
  etiqueta: string;
  pedidos: number;
  cerrados: number;
  total: number;
  efectivo: number;
  transferencia: number;
}

export interface ResumenSemanalCaja {
  lunes: string;
  domingo: string;
  dias: ResumenDiaCaja[];
  totales: {
    pedidos: number;
    total: number;
    efectivo: number;
    transferencia: number;
  };
}

export interface ResumenRepartidorDia {
  id: string;
  nombre: string;
  pedidos: number;
  totalVentas: number;
  ventasEfectivo: number;
  debeEntregar: number;
  efectivoEntregado: number;
  diferencia: number;
  cuadrado: boolean;
}

export interface ProductoTopDia {
  nombre: string;
  cantidad: number;
  total: number;
}

export interface CierreDiarioCompleto {
  fecha: string;
  caja: {
    pedidos: number;
    cerrados: number;
    total: number;
    efectivo: number;
    transferencia: number;
    porTipo: { mesa: number; recoger: number; domicilio: number };
  };
  domicilios: {
    pedidos: number;
    total: number;
    efectivo: number;
    transferencia: number;
    debeEntregarTotal: number;
    efectivoEntregadoTotal: number;
    diferenciaTotal: number;
  };
  repartidores: ResumenRepartidorDia[];
  topProductos: ProductoTopDia[];
  granTotal: number;
}

export function resumirItems(
  items: Pick<ItemPedidoCarrito, "nombre" | "cantidad">[],
  max = 3,
): string {
  if (items.length === 0) return "—";
  const visibles = items.slice(0, max).map((i) => `${i.cantidad}x ${i.nombre}`);
  const extra = items.length > max ? ` · +${items.length - max}` : "";
  return `${visibles.join(" · ")}${extra}`;
}

export function destinoPedido(p: PedidoCaja): string {
  if (p.tipo_entrega === "mesa" && p.ubicacion?.label) {
    return p.ubicacion.label;
  }
  if (p.tipo_entrega === "recoger" && p.nombre_recoge) {
    return `Recoger — ${p.nombre_recoge}`;
  }
  if (p.tipo_entrega === "domicilio" && p.direccion) {
    return `Domicilio — ${p.direccion}`;
  }
  return TIPO_ENTREGA_LABEL[p.tipo_entrega];
}

export function formatModificadores(item: PedidoItemCaja | ItemPedidoCarrito): string {
  const partes: string[] = [];
  const sin =
    "sin_ingredientes" in item ? item.sin_ingredientes : item.sinIngredientes;
  const extra =
    "notas_extra" in item ? item.notas_extra : item.notasExtra;
  if (sin?.length) partes.push(`Sin: ${sin.join(", ")}`);
  if (extra?.trim()) partes.push(`Extra: ${extra.trim()}`);
  return partes.join(" · ");
}

/** Opciones rápidas de “sin ingrediente” en el modal. */
export const SIN_INGREDIENTE_OPCIONES = [
  "Sin salsas",
  "Sin piña",
  "Sin cebolla",
  "Sin queso",
  "Sin tocineta",
  "Sin maíz",
] as const;
