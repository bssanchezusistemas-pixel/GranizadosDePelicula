"use server";

import { cookies } from "next/headers";
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
import { getMeseroSession, MESERO_COOKIE } from "@/lib/mesero-session";
import { createServiceClient } from "@/lib/supabase/service";

function revalidateCaja() {
  revalidatePath("/caja");
  revalidatePath("/caja/registro");
  revalidatePath("/caja/mesas");
  revalidatePath("/cocina");
  revalidatePath("/admin/mesas");
}

async function requireMesero() {
  const mesero = await getMeseroSession();
  if (!mesero) {
    throw new Error("Debes iniciar sesión como mesero.");
  }
  return mesero;
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

  const jar = await cookies();
  jar.set(
    MESERO_COOKIE,
    JSON.stringify({ id: data.id, nombre: data.nombre }),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    },
  );

  return { id: data.id, nombre: data.nombre };
}

export async function logoutMeseroAction() {
  const jar = await cookies();
  jar.delete(MESERO_COOKIE);
}

export async function getMeserosAction(): Promise<Mesero[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("meseros")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  if (error) throw new Error(error.message);
  return (data as Mesero[]) ?? [];
}

export async function getUbicacionesAction(): Promise<Ubicacion[]> {
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

function calcularTotalPedido(input: NuevoPedidoInput): number {
  const subtotal = input.items.reduce(
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

export async function confirmarPedidoAction(input: NuevoPedidoInput) {
  const mesero = await requireMesero();
  const supabase = createServiceClient();

  if (input.items.length === 0) {
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

  const total = calcularTotalPedido(input);
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
      const nuevoTotal = Number(
        (
          await supabase
            .from("pedidos_caja")
            .select("total")
            .eq("id", pedidoId)
            .single()
        ).data?.total ?? 0,
      );
      const totalActualizado =
        nuevoTotal +
        input.items.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0);

      const { error: errUpd } = await supabase
        .from("pedidos_caja")
        .update({ total: totalActualizado })
        .eq("id", pedidoId);

      if (errUpd) throw new Error(errUpd.message);
    } else {
      const numero = await nextNumeroPedido(supabase);
      const { data: pedido, error: errPed } = await supabase
        .from("pedidos_caja")
        .insert({
          numero_pedido: numero,
          mesero_id: mesero.id,
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

      const { error: errOcc } = await supabase
        .from("ubicaciones")
        .update({ estado: "ocupada", pedido_abierto_id: pedidoId })
        .eq("id", input.ubicacionId);

      if (errOcc) throw new Error(errOcc.message);
    }
  } else {
    const numero = await nextNumeroPedido(supabase);
    const { data: pedido, error: errPed } = await supabase
      .from("pedidos_caja")
      .insert({
        numero_pedido: numero,
        mesero_id: mesero.id,
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

  const filas = input.items.map((item) => ({
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
    .select("*, mesero:meseros(nombre), ubicacion:ubicaciones(label, tipo)")
    .eq("id", pedidoId)
    .single();

  return completo as PedidoCaja;
}

export async function liberarUbicacionAction(ubicacionId: string) {
  await requireMesero();
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
  const supabase = createServiceClient();
  const fecha = fechaHoyBogota();
  const { inicio, fin } = rangoDiaBogota(fecha);

  const { data, error } = await supabase
    .from("pedidos_caja")
    .select(
      "*, mesero:meseros(nombre), ubicacion:ubicaciones(label, tipo), items:pedido_items_caja(*)",
    )
    .gte("creado_en", inicio)
    .lte("creado_en", fin)
    .order("creado_en", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as PedidoCaja[]) ?? [];
}

export async function getPedidosCocinaAction(): Promise<PedidoCaja[]> {
  const supabase = createServiceClient();
  const fecha = fechaHoyBogota();
  const { inicio, fin } = rangoDiaBogota(fecha);

  const { data, error } = await supabase
    .from("pedidos_caja")
    .select(
      "*, mesero:meseros(nombre), ubicacion:ubicaciones(label, tipo), items:pedido_items_caja(*)",
    )
    .gte("creado_en", inicio)
    .lte("creado_en", fin)
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data as PedidoCaja[]) ?? []).filter((p) =>
    p.items?.some((i) => i.estado_cocina === "pendiente"),
  );
}

export async function marcarItemListoAction(itemId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("pedido_items_caja")
    .update({ estado_cocina: "listo" })
    .eq("id", itemId);

  if (error) throw new Error(error.message);
  revalidatePath("/cocina");
}

export async function getSiguienteNumeroAction(): Promise<number> {
  const supabase = createServiceClient();
  return nextNumeroPedido(supabase);
}

export async function reiniciarDiaCajaAction() {
  await requireMesero();
  const supabase = createServiceClient();
  const fecha = fechaHoyBogota();
  const { inicio, fin } = rangoDiaBogota(fecha);

  const { data: pedidosAbiertos } = await supabase
    .from("pedidos_caja")
    .select("id")
    .gte("creado_en", inicio)
    .lte("creado_en", fin);

  if (pedidosAbiertos?.length) {
    await supabase
      .from("pedidos_caja")
      .delete()
      .gte("creado_en", inicio)
      .lte("creado_en", fin);
  }

  await supabase
    .from("ubicaciones")
    .update({ estado: "libre", pedido_abierto_id: null })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  revalidateCaja();
}

/** Admin: misma acción de liberar mesa */
export async function liberarUbicacionAdminAction(ubicacionId: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión como admin.");

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
