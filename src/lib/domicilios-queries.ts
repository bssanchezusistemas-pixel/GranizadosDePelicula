import { getSupabase } from "./supabase";
import type {
  Domiciliario,
  DomiciliarioConResumen,
  PedidoDomicilio,
  NuevoDomicilioInput,
} from "@/data/domicilios";
import { calcularDevuelta } from "@/data/domicilios";

export async function getResumenDomiciliariosDelDia(
  fecha: string,
): Promise<DomiciliarioConResumen[]> {
  const supabase = getSupabase();

  const { data: domiciliarios, error: errDom } = await supabase
    .from("domiciliarios")
    .select("*")
    .eq("activo", true);

  if (errDom) throw errDom;

  const { data: turnos, error: errTurnos } = await supabase
    .from("turnos")
    .select("*")
    .eq("fecha", fecha);

  if (errTurnos) throw errTurnos;

  const { data: pedidos, error: errPedidos } = await supabase
    .from("pedidos_domicilio")
    .select("*")
    .gte("creado_en", `${fecha}T00:00:00`)
    .lte("creado_en", `${fecha}T23:59:59`);

  if (errPedidos) throw errPedidos;

  return (domiciliarios as Domiciliario[]).map((dom) => {
    const pedidosDelDom = (pedidos as PedidoDomicilio[]).filter(
      (p) => p.domiciliario_id === dom.id,
    );
    const turno = turnos?.find((t) => t.domiciliario_id === dom.id);

    const efectivoEsperado = pedidosDelDom
      .filter((p) => p.forma_pago === "efectivo")
      .reduce((sum, p) => sum + p.valor_pedido, 0);

    const entregados = pedidosDelDom.filter(
      (p) => p.estado === "entregado",
    ).length;
    const enCamino = pedidosDelDom.filter(
      (p) => p.estado === "en_camino" || p.estado === "pendiente",
    ).length;
    const efectivoEntregado = turno?.efectivo_entregado ?? 0;

    return {
      ...dom,
      pedidos: pedidosDelDom,
      efectivoEsperado,
      entregados,
      enCamino,
      diferencia: efectivoEsperado - efectivoEntregado,
    };
  });
}

export async function crearDomicilio(input: NuevoDomicilioInput) {
  const supabase = getSupabase();
  const devuelta = calcularDevuelta(input);

  const { data, error } = await supabase
    .from("pedidos_domicilio")
    .insert({
      numero_pedido: input.numero_pedido,
      domiciliario_id: input.domiciliario_id,
      canal: input.canal,
      items: input.items ?? null,
      direccion: input.direccion ?? null,
      valor_pedido: input.valor_pedido,
      forma_pago: input.forma_pago,
      paga_con: input.forma_pago === "efectivo" ? (input.paga_con ?? null) : null,
      devuelta,
      estado: "pendiente",
    })
    .select()
    .single();

  if (error) throw error;
  return data as PedidoDomicilio;
}

export async function marcarEntregado(pedidoId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("pedidos_domicilio")
    .update({ estado: "entregado", entregado_en: new Date().toISOString() })
    .eq("id", pedidoId);

  if (error) throw error;
}
