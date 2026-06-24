import type { User } from "@supabase/supabase-js";

export function isSupabaseAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.app_metadata?.role === "admin") return true;

  const allowlist =
    process.env.ADMIN_EMAILS?.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? [];

  const email = user.email?.toLowerCase();
  return Boolean(email && allowlist.includes(email));
}

export async function requireSupabaseAdmin() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión como admin.");
  }
  if (!isSupabaseAdmin(user)) {
    throw new Error("No tienes permisos de administrador.");
  }
  return user;
}
