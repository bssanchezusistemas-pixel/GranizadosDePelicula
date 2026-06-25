"use server";

import { revalidatePath } from "next/cache";
import {
  calcularDebeEntregar,
  calcularDevuelta,
  calcularVentasEfectivo,
} from "@/data/domicilios";
import {
  COMISION_DOMICILIO,
  PEDIDO_INICIAL,
  type DomiciliarioConJornada,
  type ItemPedidoCarrito,
  type Mesero,
  type NuevoPedidoInput,
  type PedidoCaja,
  type PedidoItemCaja,
  type ResumenSemanalCaja,
  type CierreDiarioCompleto,
  type ResumenRepartidorDia,
  type ProductoTopDia,
  type PedidoAbiertoResumen,
  type Ubicacion,
  resumirItems,
} from "@/data/caja";
import { fechaHoyBogota, rangoDiaBogota, rangoSemanaBogota, fechaDesdeIsoBogota, diasDeSemana, formatFechaCorta } from "@/lib/dates";
import { isSupabaseAdmin } from "@/lib/admin-auth";
import { sanitizeCartItems } from "@/lib/menu-prices";
import {
  getTurnoDelDia,
  sincronizarTurnoConPedidos,
} from "@/app/admin/domicilios/actions";
import { trabajaSinBase } from "@/data/domicilios";
import {
  clearCajaSessionCookie,
  getCajaSession,
  setCajaSessionCookie,
} from "@/lib/mesero-session";
import { createServiceClient } from "@/lib/supabase/service";

/** FK explícita: pedidos_caja ↔ ubicaciones tiene dos relaciones (ubicacion_id y pedido_abierto_id). */
const UBICACION_EMBED =
  "ubicacion:ubicaciones!pedidos_caja_ubicacion_id_fkey(label, tipo)";

const PEDIDO_CAJA_DETALLE =
  `*, mesero:meseros(nombre), ${UBICACION_EMBED}, items:pedido_items_caja(*)`;

const PEDIDO_CAJA_RESUMEN = `*, mesero:meseros(nombre), ${UBICACION_EMBED}`;

const COCINA_ITEM_LIMIT = 500;

function revalidateCaja() {
  revalidatePath("/caja");
  revalidatePath("/caja/registro");
  revalidatePath("/caja/mesas");
  revalidatePath("/caja/domicilios");
  revalidatePath("/cocina");
  revalidatePath("/admin/mesas");
}

async function requireCajaSession() {
  const session = await getCajaSession();
  if (!session) {
    throw new Error("Debes iniciar sesión.");
  }
  return session;
}

async function requireAdmin() {
  const session = await getCajaSession();
  if (!session || session.rol !== "admin") {
    throw new Error("Solo el admin puede hacer esto.");
  }
  return session;
}

export async function loginMeseroAction(nombre: string) {
  const supabase = createServiceClient();
  const nombreNorm = nombre.trim();

  const { data, error } = await supabase
    .from("meseros")
    .select("id, nombre")
    .ilike("nombre", nombreNorm)
    .eq("activo", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Mesero no encontrado.");

  await setCajaSessionCookie({
    id: data.id,
    nombre: data.nombre,
    rol: "mesero",
  });

  return { id: data.id, nombre: data.nombre, rol: "mesero" as const };
}

export async function confirmAdminCajaSessionAction() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    throw new Error("Inicia sesión con correo y contraseña de admin.");
  }
  if (!isSupabaseAdmin(user)) {
    throw new Error("No tienes permisos de administrador.");
  }

  await setCajaSessionCookie({
    id: user.id,
    nombre: user.email ?? "Admin",
    rol: "admin",
  });

  return { id: user.id, nombre: user.email ?? "Admin", rol: "admin" as const };
}

export async function logoutMeseroAction() {
  await clearCajaSessionCookie();
}

/** Público: necesario para la pantalla de login de meseros. */
export async function getMeserosAction(): Promise<Mesero[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("meseros")
    .select("id, nombre, activo")
    .eq("activo", true)
    .order("nombre");

  if (error) throw new Error(error.message);
  return (data as Mesero[]) ?? [];
}

function normalizePedidoAbierto(raw: unknown): PedidoAbiertoResumen | null {
  if (!raw) return null;
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row || typeof row !== "object") return null;
  return row as PedidoAbiertoResumen;
}

function mapUbicacionRow(row: Record<string, unknown>): Ubicacion {
  const { pedido_abierto, ...rest } = row;
  return {
    ...(rest as unknown as Ubicacion),
    pedido_abierto: normalizePedidoAbierto(pedido_abierto),
  };
}

const UBICACION_PEDIDO_EMBED = `pedido_abierto:pedidos_caja!ubicaciones_pedido_abierto_id_fkey(
  id, numero_pedido, total, forma_pago
)`;

async function fetchPedidoAbiertoPorId(
  supabase: ReturnType<typeof createServiceClient>,
  pedidoId: string,
): Promise<PedidoAbiertoResumen | null> {
  const { data, error } = await supabase
    .from("pedidos_caja")
    .select("id, numero_pedido, total, forma_pago")
    .eq("id", pedidoId)
    .eq("estado", "abierto")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as PedidoAbiertoResumen | null;
}

export async function getUbicacionesAction(): Promise<Ubicacion[]> {
  await requireCajaSession();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ubicaciones")
    .select(`*, ${UBICACION_PEDIDO_EMBED}`)
    .order("tipo")
    .order("numero", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapUbicacionRow(row as Record<string, unknown>),
  );
}

export async function getPedidoParaCobroMesaAction(ubicacionId: string): Promise<{
  label: string;
  pedido: PedidoAbiertoResumen;
} | null> {
  await requireCajaSession();
  const supabase = createServiceClient();

  const { data: ubicacion, error } = await supabase
    .from("ubicaciones")
    .select(`id, label, pedido_abierto_id, ${UBICACION_PEDIDO_EMBED}`)
    .eq("id", ubicacionId)
    .single();

  if (error) throw new Error(error.message);

  let pedido = normalizePedidoAbierto(ubicacion.pedido_abierto);
  if (!pedido && ubicacion.pedido_abierto_id) {
    pedido = await fetchPedidoAbiertoPorId(
      supabase,
      ubicacion.pedido_abierto_id as string,
    );
  }

  if (!pedido) return null;

  return {
    label: ubicacion.label as string,
    pedido: {
      ...pedido,
      total: Number(pedido.total),
    },
  };
}

export async function getDomiciliariosConJornadaAction(): Promise<
  DomiciliarioConJornada[]
> {
  await requireCajaSession();
  const supabase = createServiceClient();
  const fecha = fechaHoyBogota();

  const { data: domiciliarios, error } = await supabase
    .from("domiciliarios")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre");

  if (error) throw new Error(error.message);

  const { data: turnos, error: errTurnos } = await supabase
    .from("turnos")
    .select("id, domiciliario_id")
    .eq("fecha", fecha);

  if (errTurnos) throw new Error(errTurnos.message);

  const turnoPorDomiciliario = new Map(
    (turnos ?? []).map((t) => [t.domiciliario_id as string, t.id as string]),
  );

  return (domiciliarios ?? [])
    .filter((d) => turnoPorDomiciliario.has(d.id))
    .map((d) => ({
      id: d.id,
      nombre: d.nombre,
      turno_id: turnoPorDomiciliario.get(d.id)!,
    }));
}

async function nextNumeroPedido(supabase: ReturnType<typeof createServiceClient>) {
  const fecha = fechaHoyBogota();
  const { inicio, fin } = rangoDiaBogota(fecha);

  const { data, error } = await supabase
    .from("pedidos_caja")
    .select("numero_pedido")
    .gte("creado_en", inicio)
    .lte("creado_en", fin)
    .order("numero_pedido", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return PEDIDO_INICIAL;
  return Math.max(PEDIDO_INICIAL, Number(data.numero_pedido) + 1);
}

function calcularTotalPedido(
  input: NuevoPedidoInput,
  items: ItemPedidoCarrito[],
): number {
  const subtotal = items.reduce(
    (s, i) => s + i.precioUnitario * i.cantidad,
    0,
  );
  if (
    input.tipoEntrega === "domicilio" &&
    input.comisionPagadaPor === "cliente"
  ) {
    return subtotal + COMISION_DOMICILIO;
  }
  return subtotal;
}

async function incrementPedidoTotal(
  supabase: ReturnType<typeof createServiceClient>,
  pedidoId: string,
  amount: number,
) {
  const { data, error } = await supabase.rpc("increment_pedido_total", {
    p_pedido_id: pedidoId,
    p_amount: amount,
  });

  if (error) {
    const { data: pedido } = await supabase
      .from("pedidos_caja")
      .select("total")
      .eq("id", pedidoId)
      .single();

    const nuevoTotal =
      Number(pedido?.total ?? 0) + amount;

    const { error: errUpd } = await supabase
      .from("pedidos_caja")
      .update({ total: nuevoTotal })
      .eq("id", pedidoId);

    if (errUpd) throw new Error(errUpd.message);
    return nuevoTotal;
  }

  return Number(data);
}

export async function confirmarPedidoAction(input: NuevoPedidoInput) {
  const session = await requireCajaSession();
  const mesero = session.rol === "mesero" ? session : null;
  const supabase = createServiceClient();

  const items = sanitizeCartItems(input.items);

  if (items.length === 0) {
    throw new Error("El carrito está vacío.");
  }

  if (input.tipoEntrega === "mesa" && !input.ubicacionId) {
    throw new Error("Selecciona una mesa, banco o la barra.");
  }
  if (input.tipoEntrega === "recoger" && !input.nombreRecoge?.trim()) {
    throw new Error("Escribe el nombre de quien recoge.");
  }
  if (input.tipoEntrega === "domicilio" && !input.direccion?.trim()) {
    throw new Error("Escribe la dirección del domicilio.");
  }
  if (input.tipoEntrega === "domicilio" && !input.comisionPagadaPor) {
    throw new Error("Indica quién paga la comisión del domicilio.");
  }
  if (input.tipoEntrega === "domicilio" && !input.domiciliarioId) {
    throw new Error("Selecciona un repartidor con jornada iniciada.");
  }

  const total = calcularTotalPedido(input, items);
  const incrementoItems = items.reduce(
    (s, i) => s + i.precioUnitario * i.cantidad,
    0,
  );
  let pagaCon = input.pagaCon ?? null;
  let devuelta: number | null = null;

  if (
    input.formaPago === "efectivo" &&
    (input.tipoEntrega === "domicilio" || input.tipoEntrega === "recoger")
  ) {
    if (!pagaCon || pagaCon < total) {
      throw new Error("Registra con cuánto paga el cliente en efectivo.");
    }
    devuelta = calcularDevuelta({
      forma_pago: "efectivo",
      valor_pedido: total,
      paga_con: pagaCon,
    });
  }

  let pedidoId: string;

  if (input.tipoEntrega === "mesa" && input.ubicacionId) {
    const { data: ubicacion, error: errUb } = await supabase
      .from("ubicaciones")
      .select("*")
      .eq("id", input.ubicacionId)
      .single();

    if (errUb) throw new Error(errUb.message);

    if (ubicacion.pedido_abierto_id && ubicacion.estado === "ocupada") {
      pedidoId = ubicacion.pedido_abierto_id;
      await incrementPedidoTotal(supabase, pedidoId, incrementoItems);
    } else {
      const numero = await nextNumeroPedido(supabase);
      const { data: pedido, error: errPed } = await supabase
        .from("pedidos_caja")
        .insert({
          numero_pedido: numero,
          mesero_id: mesero?.id ?? null,
          tipo_entrega: "mesa",
          ubicacion_id: input.ubicacionId,
          forma_pago: input.formaPago,
          total,
          estado: "abierto",
        })
        .select("id")
        .single();

      if (errPed) throw new Error(errPed.message);
      pedidoId = pedido.id;

      const { data: locked, error: errOcc } = await supabase
        .from("ubicaciones")
        .update({ estado: "ocupada", pedido_abierto_id: pedidoId })
        .eq("id", input.ubicacionId)
        .eq("estado", "libre")
        .is("pedido_abierto_id", null)
        .select("id")
        .maybeSingle();

      if (errOcc) throw new Error(errOcc.message);

      if (!locked) {
        await supabase.from("pedidos_caja").delete().eq("id", pedidoId);

        const { data: ub2, error: errUb2 } = await supabase
          .from("ubicaciones")
          .select("*")
          .eq("id", input.ubicacionId)
          .single();

        if (errUb2) throw new Error(errUb2.message);

        if (ub2.pedido_abierto_id && ub2.estado === "ocupada") {
          pedidoId = ub2.pedido_abierto_id;
          await incrementPedidoTotal(supabase, pedidoId, incrementoItems);
        } else {
          throw new Error(
            "La mesa fue tomada por otro mesero. Intenta de nuevo.",
          );
        }
      }
    }
  } else {
    const numero = await nextNumeroPedido(supabase);
    const { data: pedido, error: errPed } = await supabase
      .from("pedidos_caja")
      .insert({
        numero_pedido: numero,
        mesero_id: mesero?.id ?? null,
        tipo_entrega: input.tipoEntrega,
        ubicacion_id: null,
        nombre_recoge:
          input.tipoEntrega === "recoger" ? input.nombreRecoge?.trim() : null,
        direccion:
          input.tipoEntrega === "domicilio" ? input.direccion?.trim() : null,
        forma_pago: input.formaPago,
        total,
        estado: "cerrado",
        paga_con: input.formaPago === "efectivo" ? pagaCon : null,
        devuelta: input.formaPago === "efectivo" ? devuelta : null,
        comision_pagada_por:
          input.tipoEntrega === "domicilio" ? input.comisionPagadaPor : null,
        cerrado_en: new Date().toISOString(),
      })
      .select("id, numero_pedido")
      .single();

    if (errPed) throw new Error(errPed.message);
    pedidoId = pedido.id;

    if (input.tipoEntrega === "domicilio" && input.domiciliarioId) {
      const fecha = fechaHoyBogota();
      const turno = await getTurnoDelDia(
        supabase,
        input.domiciliarioId,
        fecha,
      );

      if (!turno) {
        throw new Error(
          "El repartidor seleccionado no tiene jornada iniciada hoy.",
        );
      }

      const baseEfectivo = Number(turno.base_efectivo ?? 0);
      const subtotal = incrementoItems;
      if (
        input.formaPago === "efectivo" &&
        trabajaSinBase(baseEfectivo) &&
        (!pagaCon || pagaCon < subtotal)
      ) {
        throw new Error(
          "Sin base de cambio debes registrar con cuánto paga el cliente.",
        );
      }

      const numeroStr = String(pedido.numero_pedido);
      const { data: duplicado } = await supabase
        .from("pedidos_domicilio")
        .select("id")
        .eq("numero_pedido", numeroStr)
        .maybeSingle();

      if (duplicado) {
        throw new Error(
          `El pedido #${numeroStr} ya está registrado en domicilios.`,
        );
      }

      const filaDomicilio: Record<string, unknown> = {
        numero_pedido: numeroStr,
        domiciliario_id: input.domiciliarioId,
        turno_id: turno.id,
        canal: "local",
        items: resumirItems(items),
        direccion: input.direccion?.trim() ?? null,
        valor_pedido: subtotal,
        forma_pago: input.formaPago,
        paga_con: input.formaPago === "efectivo" ? pagaCon : null,
        devuelta,
        estado: "pendiente",
        pedido_caja_id: pedidoId,
      };

      const { error: errDom } = await supabase
        .from("pedidos_domicilio")
        .insert(filaDomicilio);

      if (errDom) throw new Error(errDom.message);

      await sincronizarTurnoConPedidos(
        supabase,
        input.domiciliarioId,
        fecha,
      );
    }
  }

  const filas = items.map((item) => ({
    pedido_id: pedidoId,
    producto_id: item.productoId,
    nombre: item.nombre,
    cantidad: item.cantidad,
    precio_unitario: item.precioUnitario,
    categoria_id: item.categoriaId ?? null,
    sin_ingredientes: item.sinIngredientes,
    notas_extra: item.notasExtra?.trim() || null,
    estado_cocina: "pendiente",
  }));

  const { error: errItems } = await supabase
    .from("pedido_items_caja")
    .insert(filas);

  if (errItems) throw new Error(errItems.message);

  revalidateCaja();

  const { data: completo } = await supabase
    .from("pedidos_caja")
    .select(PEDIDO_CAJA_RESUMEN)
    .eq("id", pedidoId)
    .single();

  return completo as PedidoCaja;
}

export interface ResultadoLiberarUbicacion {
  label: string;
  numeroPedido: number | null;
  total: number | null;
  devuelta: number | null;
  pagaCon: number | null;
}

async function cerrarPedidoMesaAlLiberar(
  supabase: ReturnType<typeof createServiceClient>,
  pedidoId: string,
  pagaCon?: number,
) {
  const { data: pedido, error: errPedido } = await supabase
    .from("pedidos_caja")
    .select("total, forma_pago, numero_pedido")
    .eq("id", pedidoId)
    .single();

  if (errPedido) throw new Error(errPedido.message);

  const total = Number(pedido.total);
  const update: Record<string, unknown> = {
    estado: "cerrado",
    cerrado_en: new Date().toISOString(),
  };

  let devuelta: number | null = null;
  let pagaConGuardado: number | null = null;

  if (pedido.forma_pago === "efectivo") {
    if (!pagaCon || pagaCon < total) {
      throw new Error("Registra con cuánto paga el cliente en efectivo.");
    }
    devuelta = calcularDevuelta({
      forma_pago: "efectivo",
      valor_pedido: total,
      paga_con: pagaCon,
    });
    update.paga_con = pagaCon;
    update.devuelta = devuelta;
    pagaConGuardado = pagaCon;
  }

  const { error: errUpdate } = await supabase
    .from("pedidos_caja")
    .update(update)
    .eq("id", pedidoId);

  if (errUpdate) throw new Error(errUpdate.message);

  return {
    numeroPedido: Number(pedido.numero_pedido),
    total,
    devuelta,
    pagaCon: pagaConGuardado,
  };
}

export async function liberarUbicacionAction(
  ubicacionId: string,
  pagaCon?: number,
): Promise<ResultadoLiberarUbicacion> {
  await requireCajaSession();
  const supabase = createServiceClient();

  const { data: ubicacion, error: errUb } = await supabase
    .from("ubicaciones")
    .select("*")
    .eq("id", ubicacionId)
    .single();

  if (errUb) throw new Error(errUb.message);

  let cierre: {
    numeroPedido: number | null;
    total: number | null;
    devuelta: number | null;
    pagaCon: number | null;
  } = {
    numeroPedido: null,
    total: null,
    devuelta: null,
    pagaCon: null,
  };

  if (ubicacion.pedido_abierto_id) {
    cierre = await cerrarPedidoMesaAlLiberar(
      supabase,
      ubicacion.pedido_abierto_id,
      pagaCon,
    );
  }

  const { error } = await supabase
    .from("ubicaciones")
    .update({ estado: "libre", pedido_abierto_id: null })
    .eq("id", ubicacionId);

  if (error) throw new Error(error.message);
  revalidateCaja();

  return {
    label: ubicacion.label as string,
    ...cierre,
  };
}

export async function getPedidosDelDiaAction(): Promise<PedidoCaja[]> {
  return getPedidosPorFechaAction(fechaHoyBogota());
}

export async function getPedidosPorFechaAction(
  fecha: string,
): Promise<PedidoCaja[]> {
  await requireAdmin();
  const supabase = createServiceClient();
  const { inicio, fin } = rangoDiaBogota(fecha);

  const { data, error } = await supabase
    .from("pedidos_caja")
    .select(PEDIDO_CAJA_DETALLE)
    .gte("creado_en", inicio)
    .lte("creado_en", fin)
    .order("creado_en", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as PedidoCaja[]) ?? [];
}

export async function getResumenSemanalCajaAction(
  fechaReferencia?: string,
): Promise<ResumenSemanalCaja> {
  await requireAdmin();
  const supabase = createServiceClient();
  const ref = fechaReferencia ?? fechaHoyBogota();
  const { lunes, domingo, inicio, fin } = rangoSemanaBogota(ref);

  const { data, error } = await supabase
    .from("pedidos_caja")
    .select("creado_en, total, forma_pago, estado")
    .gte("creado_en", inicio)
    .lte("creado_en", fin);

  if (error) throw new Error(error.message);

  const porDia = new Map<
    string,
    { pedidos: number; cerrados: number; total: number; efectivo: number; transferencia: number }
  >();

  for (const fecha of diasDeSemana(lunes)) {
    porDia.set(fecha, {
      pedidos: 0,
      cerrados: 0,
      total: 0,
      efectivo: 0,
      transferencia: 0,
    });
  }

  for (const row of data ?? []) {
    const fecha = fechaDesdeIsoBogota(row.creado_en as string);
    const bucket = porDia.get(fecha);
    if (!bucket) continue;

    bucket.pedidos += 1;
    if (row.estado === "cerrado") {
      bucket.cerrados += 1;
      const monto = Number(row.total);
      bucket.total += monto;
      if (row.forma_pago === "efectivo") bucket.efectivo += monto;
      if (row.forma_pago === "transferencia") bucket.transferencia += monto;
    }
  }

  const dias = diasDeSemana(lunes).map((fecha) => {
    const b = porDia.get(fecha)!;
    return {
      fecha,
      etiqueta: formatFechaCorta(fecha),
      pedidos: b.pedidos,
      cerrados: b.cerrados,
      total: b.total,
      efectivo: b.efectivo,
      transferencia: b.transferencia,
    };
  });

  const totales = dias.reduce(
    (acc, d) => ({
      pedidos: acc.pedidos + d.pedidos,
      total: acc.total + d.total,
      efectivo: acc.efectivo + d.efectivo,
      transferencia: acc.transferencia + d.transferencia,
    }),
    { pedidos: 0, total: 0, efectivo: 0, transferencia: 0 },
  );

  return { lunes, domingo, dias, totales };
}

export async function getCierreDiarioCompletoAction(
  fecha: string,
): Promise<CierreDiarioCompleto> {
  await requireAdmin();
  const supabase = createServiceClient();
  const { inicio, fin } = rangoDiaBogota(fecha);

  const [
    { data: pedidosCaja, error: errCaja },
    { data: pedidosDom, error: errDom },
    { data: domiciliarios, error: errDomList },
    { data: turnos, error: errTurnos },
    { data: pedidosIds, error: errIds },
  ] = await Promise.all([
    supabase
      .from("pedidos_caja")
      .select("total, forma_pago, tipo_entrega, estado")
      .gte("creado_en", inicio)
      .lte("creado_en", fin),
    supabase
      .from("pedidos_domicilio")
      .select("domiciliario_id, valor_pedido, forma_pago, paga_con, devuelta")
      .gte("creado_en", inicio)
      .lte("creado_en", fin),
    supabase
      .from("domiciliarios")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
    supabase.from("turnos").select("*").eq("fecha", fecha),
    supabase
      .from("pedidos_caja")
      .select("id")
      .gte("creado_en", inicio)
      .lte("creado_en", fin),
  ]);

  if (errCaja) throw new Error(errCaja.message);
  if (errDom) throw new Error(errDom.message);
  if (errDomList) throw new Error(errDomList.message);
  if (errTurnos) throw new Error(errTurnos.message);
  if (errIds) throw new Error(errIds.message);

  const ids = (pedidosIds ?? []).map((p) => p.id as string);
  const items: { nombre: string; cantidad: number; precio_unitario: number }[] =
    [];

  if (ids.length > 0) {
    const chunkSize = 80;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const { data: itemsData, error: errItems } = await supabase
        .from("pedido_items_caja")
        .select("nombre, cantidad, precio_unitario")
        .in("pedido_id", chunk);

      if (errItems) throw new Error(errItems.message);
      if (itemsData) items.push(...itemsData);
    }
  }

  const pedidos = pedidosCaja ?? [];
  const cerrados = pedidos.filter((p) => p.estado === "cerrado");
  const totalCaja = cerrados.reduce((s, p) => s + Number(p.total), 0);
  const efectivoCaja = cerrados
    .filter((p) => p.forma_pago === "efectivo")
    .reduce((s, p) => s + Number(p.total), 0);
  const transferenciaCaja = cerrados
    .filter((p) => p.forma_pago === "transferencia")
    .reduce((s, p) => s + Number(p.total), 0);

  const domRows = pedidosDom ?? [];
  const totalDom = domRows.reduce((s, p) => s + Number(p.valor_pedido), 0);
  const efectivoDom = domRows
    .filter((p) => p.forma_pago === "efectivo")
    .reduce((s, p) => s + Number(p.valor_pedido), 0);
  const transferenciaDom = domRows
    .filter((p) => p.forma_pago === "transferencia")
    .reduce((s, p) => s + Number(p.valor_pedido), 0);

  const repartidores: ResumenRepartidorDia[] = (domiciliarios ?? []).map(
    (dom) => {
      const pedidosDelDom = domRows.filter((p) => p.domiciliario_id === dom.id);
      const turno = turnos?.find((t) => t.domiciliario_id === dom.id);
      const baseEfectivo = Number(turno?.base_efectivo ?? 0);
      const ventasEfectivo = calcularVentasEfectivo(pedidosDelDom);
      const debeEntregar = turno
        ? calcularDebeEntregar(baseEfectivo, pedidosDelDom)
        : 0;
      const efectivoEntregado = Number(turno?.efectivo_entregado ?? 0);
      const totalVentas = pedidosDelDom.reduce(
        (s, p) => s + Number(p.valor_pedido),
        0,
      );

      return {
        id: dom.id,
        nombre: dom.nombre,
        pedidos: pedidosDelDom.length,
        totalVentas,
        ventasEfectivo,
        debeEntregar,
        efectivoEntregado,
        diferencia: debeEntregar - efectivoEntregado,
        cuadrado: turno != null && efectivoEntregado >= debeEntregar,
      };
    },
  );

  const debeEntregarTotal = repartidores.reduce((s, r) => s + r.debeEntregar, 0);
  const efectivoEntregadoTotal = repartidores.reduce(
    (s, r) => s + r.efectivoEntregado,
    0,
  );

  const productoMap = new Map<string, { cantidad: number; total: number }>();
  for (const row of items) {
    const nombre = row.nombre;
    const cantidad = Number(row.cantidad);
    const total = cantidad * Number(row.precio_unitario);
    const prev = productoMap.get(nombre) ?? { cantidad: 0, total: 0 };
    productoMap.set(nombre, {
      cantidad: prev.cantidad + cantidad,
      total: prev.total + total,
    });
  }

  const topProductos: ProductoTopDia[] = Array.from(productoMap.entries())
    .map(([nombre, stats]) => ({ nombre, ...stats }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

  return {
    fecha,
    caja: {
      pedidos: pedidos.length,
      cerrados: cerrados.length,
      total: totalCaja,
      efectivo: efectivoCaja,
      transferencia: transferenciaCaja,
      porTipo: {
        mesa: pedidos.filter((p) => p.tipo_entrega === "mesa").length,
        recoger: pedidos.filter((p) => p.tipo_entrega === "recoger").length,
        domicilio: pedidos.filter((p) => p.tipo_entrega === "domicilio").length,
      },
    },
    domicilios: {
      pedidos: domRows.length,
      total: totalDom,
      efectivo: efectivoDom,
      transferencia: transferenciaDom,
      debeEntregarTotal,
      efectivoEntregadoTotal,
      diferenciaTotal: debeEntregarTotal - efectivoEntregadoTotal,
    },
    repartidores: repartidores.filter((r) => r.pedidos > 0 || r.debeEntregar > 0),
    topProductos,
    granTotal: totalCaja + totalDom,
  };
}

export async function getPedidosCocinaAction(): Promise<PedidoCaja[]> {
  await requireCajaSession();
  const supabase = createServiceClient();
  const fecha = fechaHoyBogota();
  const { inicio, fin } = rangoDiaBogota(fecha);

  const { data: rows, error } = await supabase
    .from("pedido_items_caja")
    .select(
      `
      id,
      pedido_id,
      producto_id,
      nombre,
      cantidad,
      precio_unitario,
      categoria_id,
      sin_ingredientes,
      notas_extra,
      estado_cocina,
      creado_en,
      pedido:pedidos_caja!inner(
        id,
        numero_pedido,
        mesero_id,
        tipo_entrega,
        ubicacion_id,
        nombre_recoge,
        direccion,
        forma_pago,
        total,
        estado,
        paga_con,
        devuelta,
        comision_pagada_por,
        creado_en,
        cerrado_en,
        mesero:meseros(nombre),
        ${UBICACION_EMBED}
      )
    `,
    )
    .eq("estado_cocina", "pendiente")
    .gte("creado_en", inicio)
    .lte("creado_en", fin)
    .order("creado_en", { ascending: true })
    .limit(COCINA_ITEM_LIMIT);

  if (error) throw new Error(error.message);

  const byPedido = new Map<string, PedidoCaja>();

  for (const row of rows ?? []) {
    const raw = row as Record<string, unknown>;
    const pedidoRaw = raw.pedido;
    const pedido = (
      Array.isArray(pedidoRaw) ? pedidoRaw[0] : pedidoRaw
    ) as PedidoCaja;

    const item = {
      id: raw.id,
      pedido_id: raw.pedido_id,
      producto_id: raw.producto_id,
      nombre: raw.nombre,
      cantidad: raw.cantidad,
      precio_unitario: raw.precio_unitario,
      categoria_id: raw.categoria_id,
      sin_ingredientes: raw.sin_ingredientes,
      notas_extra: raw.notas_extra,
      estado_cocina: raw.estado_cocina,
      creado_en: raw.creado_en,
    } as PedidoItemCaja;
    const existente = byPedido.get(pedido.id);

    if (existente) {
      existente.items = [...(existente.items ?? []), item];
      continue;
    }

    byPedido.set(pedido.id, { ...pedido, items: [item] });
  }

  return Array.from(byPedido.values()).sort(
    (a, b) =>
      new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime(),
  );
}

export async function marcarItemListoAction(itemId: string) {
  await requireCajaSession();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("pedido_items_caja")
    .update({ estado_cocina: "listo" })
    .eq("id", itemId);

  if (error) throw new Error(error.message);
  revalidatePath("/cocina");
}

export async function getSiguienteNumeroAction(): Promise<number> {
  await requireCajaSession();
  const supabase = createServiceClient();
  return nextNumeroPedido(supabase);
}

export async function reiniciarDiaCajaAction() {
  return cerrarOperacionCompletaAction();
}

export async function cerrarOperacionCompletaAction() {
  await requireAdmin();
  const supabase = createServiceClient();
  const fecha = fechaHoyBogota();
  const { inicio, fin } = rangoDiaBogota(fecha);
  const ahora = new Date().toISOString();

  const cierre = await getCierreDiarioCompletoAction(fecha);

  const { error: errCerrar } = await supabase
    .from("pedidos_caja")
    .update({
      estado: "cerrado",
      cerrado_en: ahora,
    })
    .eq("estado", "abierto");

  if (errCerrar) throw new Error(errCerrar.message);

  const { error: errCocina } = await supabase
    .from("pedido_items_caja")
    .update({ estado_cocina: "listo" })
    .eq("estado_cocina", "pendiente")
    .gte("creado_en", inicio)
    .lte("creado_en", fin);

  if (errCocina) throw new Error(errCocina.message);

  const { error: errMesas } = await supabase
    .from("ubicaciones")
    .update({ estado: "libre", pedido_abierto_id: null })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (errMesas) throw new Error(errMesas.message);

  const { error: errTurnos } = await supabase
    .from("turnos")
    .update({
      efectivo_entregado: 0,
      cuadrado: false,
      hora_fin: null,
    })
    .eq("fecha", fecha);

  if (errTurnos) throw new Error(errTurnos.message);

  const { error: errCierre } = await supabase.from("cierres_diarios").insert({
    fecha,
    tipo: "unificado",
    pedidos_caja_count: cierre.caja.pedidos,
    pedidos_domicilio_count: cierre.domicilios.pedidos,
    totales: {
      gran_total: cierre.granTotal,
      caja: cierre.caja,
      domicilios: cierre.domicilios,
      repartidores: cierre.repartidores,
      top_productos: cierre.topProductos,
    },
    cerrado_en: ahora,
  });

  if (
    errCierre &&
    !errCierre.message.includes("Could not find the table") &&
    !errCierre.message.includes("cierres_diarios_tipo_check")
  ) {
    throw new Error(errCierre.message);
  }

  revalidateCaja();
  revalidatePath("/caja/domicilios");
}

/** Admin: misma acción de liberar mesa */
export async function liberarUbicacionAdminAction(
  ubicacionId: string,
  pagaCon?: number,
): Promise<ResultadoLiberarUbicacion> {
  await requireAdmin();

  const supabase = createServiceClient();
  const { data: ubicacion, error: errUb } = await supabase
    .from("ubicaciones")
    .select("*")
    .eq("id", ubicacionId)
    .single();

  if (errUb) throw new Error(errUb.message);

  let cierre: {
    numeroPedido: number | null;
    total: number | null;
    devuelta: number | null;
    pagaCon: number | null;
  } = {
    numeroPedido: null,
    total: null,
    devuelta: null,
    pagaCon: null,
  };

  if (ubicacion.pedido_abierto_id) {
    cierre = await cerrarPedidoMesaAlLiberar(
      supabase,
      ubicacion.pedido_abierto_id,
      pagaCon,
    );
  }

  const { error } = await supabase
    .from("ubicaciones")
    .update({ estado: "libre", pedido_abierto_id: null })
    .eq("id", ubicacionId);

  if (error) throw new Error(error.message);
  revalidateCaja();

  return {
    label: ubicacion.label as string,
    ...cierre,
  };
}

export type { ItemPedidoCarrito, PedidoItemCaja };
