import { cookies } from "next/headers";
import { MESERO_COOKIE, type CajaSession } from "@/lib/caja-session";
import { sessionCookieOptions } from "@/lib/cookie-options";
import { sealCajaSession, unsealCajaSession } from "@/lib/session-crypto";

export { MESERO_COOKIE, isAdminSession } from "@/lib/caja-session";
export type { CajaSession, CajaRol } from "@/lib/caja-session";

export async function getCajaSession(): Promise<CajaSession | null> {
  const jar = await cookies();
  return unsealCajaSession(jar.get(MESERO_COOKIE)?.value);
}

export async function getMeseroSession(): Promise<CajaSession | null> {
  const session = await getCajaSession();
  if (!session || session.rol !== "mesero") return null;
  return session;
}

export async function setCajaSessionCookie(session: CajaSession): Promise<void> {
  const jar = await cookies();
  jar.set(MESERO_COOKIE, await sealCajaSession(session), sessionCookieOptions());
}

export async function clearCajaSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(MESERO_COOKIE);
}
