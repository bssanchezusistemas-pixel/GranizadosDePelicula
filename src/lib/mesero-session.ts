import { cookies } from "next/headers";

export const MESERO_COOKIE = "mesero_session";

export interface MeseroSession {
  id: string;
  nombre: string;
}

export async function getMeseroSession(): Promise<MeseroSession | null> {
  const jar = await cookies();
  const raw = jar.get(MESERO_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MeseroSession;
    if (parsed?.id && parsed?.nombre) return parsed;
  } catch {
    return null;
  }
  return null;
}
