"use server";

import { createClient } from "@/lib/supabase/server";
import { rangoDiaBogota, fechaHoyBogota } from "@/lib/dates";
import type {
  Domiciliario,
  DomiciliarioConResumen,
  PedidoDomicilio,
  NuevoDomicilioInput,
  EditarPedidoInput,
  Turno,
} from "@/data/domicilios";
import {
  calcularDevuelta,
  calcularDebeEntregar,
  calcularVentasEfectivo,
} from "@/data/domicilios";

function normalizeNumeroPedido(numero: string): string {
  return numero.trim();
}

function formatSupabaseError(message: string): string {
  if (message.includes("base_efectivo")) {
    return "Falta la columna base_efectivo en turnos. Ejecuta sql/004_turno_base_efectivo.sql en Supabase → SQL Editor.";
  }
  return message;
}

async function assertNumeroPedidoDisponible(
  supabase: Awaited<ReturnType<typeof createClient>>,
  numeroPedido: string,
  excludePedidoId?: string,
) {
  const numero = normalizeNumeroPedido(numeroPedido);
  if (!numero) {
    throw new Error("El número de pedido es obligatorio.");
  }

  let query = supabase
    .from("pedidos_domicilio")
    .select("id, numero_pedido")
    .eq("numero_pedido", numero);

  if (excludePedidoId) {
    query = query.neq("id", excludePedidoId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw new Error(error.message);
  if (data) {
    throw new Error(
      `El pedido #${numero} ya está registrado. Revisa la comanda del POS.`,
    );
  }
}

async function getTurnoDelDia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  domiciliarioId: string,
  fecha: string,
) {
  const { data, error } = await supabase
    .from("turnos")
    .select("*")
    .eq("domiciliario_id", domiciliarioId)
    .eq("fecha", fecha)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Turno | null;
}

function buildResumenDomiciliario(
  dom: Domiciliario,
  pedidosDelDom: PedidoDomicilio[],
  turno: Turno | null | undefined,
): DomiciliarioConResumen {
  const jornadaIniciada = turno != null;
  const baseEfectivo = Number(turno?.base_efectivo ?? 0);
  const ventasEfectivo = calcularVentasEfectivo(pedidosDelDom);
  const debeEntregar = jornadaIniciada
    ? calcularDebeEntregar(baseEfectivo, pedidosDelDom)
    : 0;
  const efectivoEntregado = Number(turno?.efectivo_entregado ?? 0);
  const cuadrado = jornadaIniciada && efectivoEntregado >= debeEntregar;

  const entregados = pedidosDelDom.filter(
    (p) => p.estado === "entregado",
  ).length;
  const enCamino = pedidosDelDom.filter(
    (p) => p.estado === "en_camino" || p.estado === "pendiente",
  ).length;

  return {
    ...dom,
    turnoId: turno?.id ?? null,
    jornadaIniciada,
    pedidos: pedidosDelDom,
    baseEfectivo,
    ventasEfectivo,
    debeEntregar,
    efectivoEntregado,
    cuadrado,
    entregados,
    enCamino,
    diferencia: debeEntregar - efectivoEntregado,
  };
}

export async function getResumenDomiciliariosAction(
  fecha: string,
): Promise<DomiciliarioConResumen[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para ver los domicilios.");
  }

  const { inicio, fin } = rangoDiaBogota(fecha);

  const { data: domiciliarios, error: errDom } = await supabase
    .from("domiciliarios")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (errDom) throw new Error(errDom.message);

  const { data: turnos, error: errTurnos } = await supabase
    .from("turnos")
    .select("*")
    .eq("fecha", fecha);

  if (errTurnos) throw new Error(errTurnos.message);

  const { data: pedidos, error: errPedidos } = await supabase
    .from("pedidos_domicilio")
    .select("*")
    .gte("creado_en", inicio)
    .lte("creado_en", fin)
    .order("creado_en", { ascending: true });

  if (errPedidos) throw new Error(errPedidos.message);

  if (!domiciliarios?.length) {
    throw new Error(
      "No hay domiciliarios visibles. Ejecuta sql/002_rls_policies.sql en Supabase.",
    );
  }

  return (domiciliarios as Domiciliario[]).map((dom) => {
    const pedidosDelDom =
      (pedidos as PedidoDomicilio[] | null)?.filter(
        (p) => p.domiciliario_id === dom.id,
      ) ?? [];
    const turno = turnos?.find((t) => t.domiciliario_id === dom.id) as
      | Turno
      | undefined;

    return buildResumenDomiciliario(dom, pedidosDelDom, turno);
  });
}

export async function iniciarJornadaAction(input: {
  domiciliario_id: string;
  fecha: string;
  base_efectivo: number;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para abrir la jornada.");
  }

  if (input.base_efectivo <= 0) {
    throw new Error("La base de efectivo debe ser mayor a cero.");
  }

  const turnoExistente = await getTurnoDelDia(
    supabase,
    input.domiciliario_id,
    input.fecha,
  );

  if (turnoExistente) {
    throw new Error("Este domiciliario ya tiene jornada iniciada hoy.");
  }

  const { data, error } = await supabase
    .from("turnos")
    .insert({
      domiciliario_id: input.domiciliario_id,
      fecha: input.fecha,
      base_efectivo: input.base_efectivo,
      efectivo_entregado: 0,
      cuadrado: false,
    })
    .select()
    .single();

  if (error) throw new Error(formatSupabaseError(error.message));

  return data as Turno;
}

export async function crearDomicilioAction(input: NuevoDomicilioInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para crear domicilios.");
  }

  const fecha = fechaHoyBogota();

  const turno = await getTurnoDelDia(supabase, input.domiciliario_id, fecha);

  if (!turno) {
    throw new Error(
      "Primero inicia la jornada del domiciliario antes de asignar pedidos.",
    );
  }

  const numeroPedido = normalizeNumeroPedido(input.numero_pedido);
  await assertNumeroPedidoDisponible(supabase, numeroPedido);

  const devuelta = calcularDevuelta(input);

  const { data, error } = await supabase
    .from("pedidos_domicilio")
    .insert({
      numero_pedido: numeroPedido,
      domiciliario_id: input.domiciliario_id,
      turno_id: turno.id,
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

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        `El pedido #${numeroPedido} ya está registrado. Revisa la comanda del POS.`,
      );
    }
    throw new Error(error.message);
  }

  return data as PedidoDomicilio;
}

export async function cuadrarCajaAction(input: {
  domiciliario_id: string;
  fecha: string;
  monto: number;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para cuadrar la caja.");
  }

  if (input.monto <= 0) {
    throw new Error("El monto entregado debe ser mayor a cero.");
  }

  const turnoExistente = await getTurnoDelDia(
    supabase,
    input.domiciliario_id,
    input.fecha,
  );

  if (!turnoExistente) {
    throw new Error("Primero inicia la jornada del domiciliario.");
  }

  const { inicio, fin } = rangoDiaBogota(input.fecha);

  const { data: pedidos, error: errPedidos } = await supabase
    .from("pedidos_domicilio")
    .select("*")
    .eq("domiciliario_id", input.domiciliario_id)
    .gte("creado_en", inicio)
    .lte("creado_en", fin);

  if (errPedidos) throw new Error(errPedidos.message);

  const baseEfectivo = Number(turnoExistente.base_efectivo ?? 0);
  const debeEntregar = calcularDebeEntregar(
    baseEfectivo,
    (pedidos as PedidoDomicilio[]) ?? [],
  );

  const entregadoPrevio = Number(turnoExistente.efectivo_entregado ?? 0);
  const nuevoEntregado = entregadoPrevio + input.monto;
  const cuadrado = nuevoEntregado >= debeEntregar;

  const { error } = await supabase
    .from("turnos")
    .update({
      efectivo_entregado: nuevoEntregado,
      cuadrado,
      ...(cuadrado ? { hora_fin: new Date().toISOString() } : {}),
    })
    .eq("id", turnoExistente.id);

  if (error) throw new Error(error.message);

  return { efectivoEntregado: nuevoEntregado, cuadrado };
}

export async function actualizarPedidoAction(input: EditarPedidoInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para editar pedidos.");
  }

  const fecha = fechaHoyBogota();
  const numeroPedido = normalizeNumeroPedido(input.numero_pedido);
  await assertNumeroPedidoDisponible(supabase, numeroPedido, input.id);

  const turno = await getTurnoDelDia(supabase, input.domiciliario_id, fecha);

  if (!turno) {
    throw new Error(
      "El domiciliario seleccionado no tiene jornada iniciada hoy.",
    );
  }

  const devuelta = calcularDevuelta(input);

  const { data, error } = await supabase
    .from("pedidos_domicilio")
    .update({
      numero_pedido: numeroPedido,
      domiciliario_id: input.domiciliario_id,
      turno_id: turno.id,
      canal: input.canal,
      items: input.items ?? null,
      direccion: input.direccion ?? null,
      valor_pedido: input.valor_pedido,
      forma_pago: input.forma_pago,
      paga_con: input.forma_pago === "efectivo" ? (input.paga_con ?? null) : null,
      devuelta,
    })
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        `El pedido #${numeroPedido} ya está registrado. Revisa la comanda del POS.`,
      );
    }
    throw new Error(error.message);
  }

  return data as PedidoDomicilio;
}

export async function eliminarPedidoAction(pedidoId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para eliminar pedidos.");
  }

  const { error } = await supabase
    .from("pedidos_domicilio")
    .delete()
    .eq("id", pedidoId);

  if (error) throw new Error(error.message);
}
