export const MESERO_COOKIE = "mesero_session";

export type CajaRol = "mesero" | "admin";

export interface CajaSession {
  id: string;
  nombre: string;
  rol: CajaRol;
}

export function parseCajaSessionCookie(raw: string | undefined): CajaSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CajaSession;
    if (parsed?.id && parsed?.nombre && parsed?.rol) return parsed;
    if (parsed?.id && parsed?.nombre) {
      return { ...parsed, rol: "mesero" };
    }
  } catch {
    return null;
  }
  return null;
}

export function isAdminSession(session: CajaSession | null): boolean {
  return session?.rol === "admin";
}
