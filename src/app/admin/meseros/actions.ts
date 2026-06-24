"use server";

import { revalidatePath } from "next/cache";
import type { Mesero } from "@/data/caja";
import { createServiceClient } from "@/lib/supabase/service";

async function requireAdminAuth() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión como admin.");
}

export async function getMeserosAdminAction(): Promise<Mesero[]> {
  await requireAdminAuth();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("meseros")
    .select("*")
    .order("nombre");

  if (error) throw new Error(error.message);
  return (data as Mesero[]) ?? [];
}

export async function crearMeseroAction(nombre: string) {
  await requireAdminAuth();
  const nombreNorm = nombre.trim();
  if (nombreNorm.length < 2) {
    throw new Error("Escribe un nombre válido.");
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("meseros").insert({ nombre: nombreNorm });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe un mesero con ese nombre.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/admin/meseros");
  revalidatePath("/caja/login");
}

export async function toggleMeseroActivoAction(id: string, activo: boolean) {
  await requireAdminAuth();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("meseros")
    .update({ activo })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/meseros");
  revalidatePath("/caja/login");
}
