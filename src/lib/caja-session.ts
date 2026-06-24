export const MESERO_COOKIE = "mesero_session";

export type CajaRol = "mesero" | "admin";

export interface CajaSession {
  id: string;
  nombre: string;
  rol: CajaRol;
}

export function isAdminSession(session: CajaSession | null): boolean {
  return session?.rol === "admin";
}
