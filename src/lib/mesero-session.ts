import { cookies } from "next/headers";
import {
  MESERO_COOKIE,
  type CajaSession,
  parseCajaSessionCookie,
} from "@/lib/caja-session";

export { MESERO_COOKIE, parseCajaSessionCookie, isAdminSession } from "@/lib/caja-session";
export type { CajaSession, CajaRol } from "@/lib/caja-session";

export async function getCajaSession(): Promise<CajaSession | null> {
  const jar = await cookies();
  return parseCajaSessionCookie(jar.get(MESERO_COOKIE)?.value);
}

export async function getMeseroSession(): Promise<CajaSession | null> {
  const session = await getCajaSession();
  if (!session || session.rol !== "mesero") return null;
  return session;
}
