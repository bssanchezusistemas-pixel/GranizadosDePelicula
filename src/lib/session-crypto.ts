import type { CajaSession } from "@/lib/caja-session";

const VERSION = "v1";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET debe estar definido (mín. 16 caracteres) en producción.",
      );
    }
    return "dev-only-insecure-secret-change-me";
  }
  return secret;
}

function toBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function hmacSign(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return toBase64url(new Uint8Array(sig));
}

async function hmacVerify(message: string, signature: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(getSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64url(signature) as BufferSource,
      new TextEncoder().encode(message),
    );
  } catch {
    return false;
  }
}

export async function sealCajaSession(session: CajaSession): Promise<string> {
  const payload = toBase64url(
    new TextEncoder().encode(JSON.stringify(session)),
  );
  const sig = await hmacSign(`${VERSION}.${payload}`);
  return `${VERSION}.${payload}.${sig}`;
}

export async function unsealCajaSession(
  raw: string | undefined,
): Promise<CajaSession | null> {
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3 || parts[0] !== VERSION) return null;

  const [, payload, sig] = parts;
  if (!(await hmacVerify(`${VERSION}.${payload}`, sig))) return null;

  try {
    const json = new TextDecoder().decode(fromBase64url(payload));
    const parsed = JSON.parse(json) as CajaSession;
    if (!parsed?.id || !parsed?.nombre || !parsed?.rol) return null;
    if (parsed.rol !== "mesero" && parsed.rol !== "admin") return null;
    return parsed;
  } catch {
    return null;
  }
}
