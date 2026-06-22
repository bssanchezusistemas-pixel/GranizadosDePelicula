export type Canal = "local" | "whatsapp" | "web";
export type FormaPago = "efectivo" | "transferencia";
export type EstadoPedido = "pendiente" | "en_camino" | "entregado" | "cancelado";

export const BASE_EFECTIVO_DEFAULT = 200_000;

export interface Domiciliario {
  id: string;
  nombre: string;
  telefono: string | null;
  activo: boolean;
}

export interface Turno {
  id: string;
  domiciliario_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  base_efectivo: number;
  efectivo_entregado: number;
  cuadrado: boolean;
}

export interface PedidoDomicilio {
  id: string;
  numero_pedido: string;
  domiciliario_id: string | null;
  turno_id: string | null;
  canal: Canal;
  items: string | null;
  direccion: string | null;
  valor_pedido: number;
  forma_pago: FormaPago;
  paga_con: number | null;
  devuelta: number | null;
  estado: EstadoPedido;
  creado_en: string;
  entregado_en: string | null;
}

export interface DomiciliarioConResumen extends Domiciliario {
  turnoId: string | null;
  jornadaIniciada: boolean;
  pedidos: PedidoDomicilio[];
  sinBase: boolean;
  baseEfectivo: number;
  ventasEfectivo: number;
  cobroEfectivo: number;
  devueltasEfectivo: number;
  debeEntregar: number;
  efectivoEntregado: number;
  cuadrado: boolean;
  entregados: number;
  enCamino: number;
  diferencia: number;
}

export type PedidoEfectivoCalculo = Pick<
  PedidoDomicilio,
  "forma_pago" | "valor_pedido" | "paga_con" | "devuelta"
>;

export interface NuevoDomicilioInput {
  numero_pedido: string;
  domiciliario_id: string;
  canal: Canal;
  items?: string;
  direccion?: string;
  valor_pedido: number;
  forma_pago: FormaPago;
  paga_con?: number;
}

export interface EditarPedidoInput extends NuevoDomicilioInput {
  id: string;
}

export function calcularDevuelta(
  input: Pick<NuevoDomicilioInput, "forma_pago" | "valor_pedido" | "paga_con">,
): number | null {
  if (input.forma_pago !== "efectivo") return null;
  if (input.paga_con == null) return null;
  const devuelta = input.paga_con - input.valor_pedido;
  return devuelta >= 0 ? devuelta : null;
}

export function trabajaSinBase(baseEfectivo: number): boolean {
  return baseEfectivo === 0;
}

export function calcularVentasEfectivo(
  pedidos: Pick<PedidoDomicilio, "forma_pago" | "valor_pedido">[],
): number {
  return pedidos
    .filter((p) => p.forma_pago === "efectivo")
    .reduce((sum, p) => sum + Number(p.valor_pedido), 0);
}

/** Total cobrado al cliente en efectivo (paga_con o valor si paga exacto). */
export function calcularCobroEfectivo(pedidos: PedidoEfectivoCalculo[]): number {
  return pedidos
    .filter((p) => p.forma_pago === "efectivo")
    .reduce((sum, p) => sum + Number(p.paga_con ?? p.valor_pedido), 0);
}

/** Suma de cambio devuelto en pedidos en efectivo. */
export function calcularDevueltasEfectivo(
  pedidos: PedidoEfectivoCalculo[],
): number {
  return pedidos
    .filter((p) => p.forma_pago === "efectivo")
    .reduce((sum, p) => sum + Number(p.devuelta ?? 0), 0);
}

export function calcularDebeEntregar(
  baseEfectivo: number,
  pedidos: PedidoEfectivoCalculo[],
): number {
  if (trabajaSinBase(baseEfectivo)) {
    return calcularCobroEfectivo(pedidos);
  }
  return baseEfectivo + calcularVentasEfectivo(pedidos);
}
