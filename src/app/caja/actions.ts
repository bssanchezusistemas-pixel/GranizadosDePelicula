"use server";

import { revalidatePath } from "next/cache";
import { calcularDevuelta } from "@/data/domicilios";
import {
  COMISION_DOMICILIO,
  PEDIDO_INICIAL,
  type ItemPedidoCarrito,
  type Mesero,
  type NuevoPedidoInput,
  type PedidoCaja,
  type PedidoItemCaja,
  type Ubicacion,
} from "@/data/caja";
import { fechaHoyBogota, rangoDiaBogota } from "@/lib/dates";
import { requireSupabaseAdmin, isSupabaseAdmin } from "@/lib/admin-auth";
import { sanitizeCartItems } from "@/lib/menu-prices";
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
  await requireSupabaseAdmin();
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

export async function getUbicacionesAction(): Promise<Ubicacion[]> {
  await requireCajaSession();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ubicaciones")
    .select("*")
    .order("tipo")
    .order("numero", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);
  return (data as Ubicacion[]) ?? [];
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

  const total = calcularTotalPedido(input, items);
  const incrementoItems = items.reduce(
    (s, i) => s + i.precioUnitario * i.cantidad,
    0,
  );
  let pagaCon = input.pagaCon ?? null;
  let devuelta: number | null = null;

  if (input.formaPago === "efectivo" && input.tipoEntrega === "domicilio") {
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
        paga_con: pagaCon,
        devuelta,
        comision_pagada_por:
          input.tipoEntrega === "domicilio" ? input.comisionPagadaPor : null,
        cerrado_en: new Date().toISOString(),
      })
      .select("id, numero_pedido")
      .single();

    if (errPed) throw new Error(errPed.message);
    pedidoId = pedido.id;
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

export async function liberarUbicacionAction(ubicacionId: string) {
  await requireCajaSession();
  const supabase = createServiceClient();

  const { data: ubicacion, error: errUb } = await supabase
    .from("ubicaciones")
    .select("*")
    .eq("id", ubicacionId)
    .single();

  if (errUb) throw new Error(errUb.message);

  if (ubicacion.pedido_abierto_id) {
    const { error: errPed } = await supabase
      .from("pedidos_caja")
      .update({
        estado: "cerrado",
        cerrado_en: new Date().toISOString(),
      })
      .eq("id", ubicacion.pedido_abierto_id);

    if (errPed) throw new Error(errPed.message);
  }

  const { error } = await supabase
    .from("ubicaciones")
    .update({ estado: "libre", pedido_abierto_id: null })
    .eq("id", ubicacionId);

  if (error) throw new Error(error.message);
  revalidateCaja();
}

export async function getPedidosDelDiaAction(): Promise<PedidoCaja[]> {
  await requireAdmin();
  const supabase = createServiceClient();
  const fecha = fechaHoyBogota();
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

    if (pedido.estado === "cerrado") continue;

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
  await requireAdmin();
  const supabase = createServiceClient();
  const fecha = fechaHoyBogota();
  const { inicio, fin } = rangoDiaBogota(fecha);

  await supabase
    .from("pedidos_caja")
    .update({
      estado: "cerrado",
      cerrado_en: new Date().toISOString(),
    })
    .eq("estado", "abierto");

  await supabase
    .from("pedidos_caja")
    .delete()
    .gte("creado_en", inicio)
    .lte("creado_en", fin);

  await supabase
    .from("ubicaciones")
    .update({ estado: "libre", pedido_abierto_id: null })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  revalidateCaja();
}

/** Admin: misma acción de liberar mesa */
export async function liberarUbicacionAdminAction(ubicacionId: string) {
  await requireSupabaseAdmin();

  const supabase = createServiceClient();
  const { data: ubicacion, error: errUb } = await supabase
    .from("ubicaciones")
    .select("*")
    .eq("id", ubicacionId)
    .single();

  if (errUb) throw new Error(errUb.message);

  if (ubicacion.pedido_abierto_id) {
    await supabase
      .from("pedidos_caja")
      .update({ estado: "cerrado", cerrado_en: new Date().toISOString() })
      .eq("id", ubicacion.pedido_abierto_id);
  }

  const { error } = await supabase
    .from("ubicaciones")
    .update({ estado: "libre", pedido_abierto_id: null })
    .eq("id", ubicacionId);

  if (error) throw new Error(error.message);
  revalidateCaja();
}

export type { ItemPedidoCarrito, PedidoItemCaja };
