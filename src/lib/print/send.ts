import { getPrintBridgeUrl } from "@/lib/print/config";
import type {
  OrderTicket,
  PrintBridgeHealth,
  PrintResult,
} from "@/lib/print/types";

const PRINT_TIMEOUT_BASE_MS = 8000;
const PRINT_TIMEOUT_PER_COPY_MS = 6000;
const HEALTH_TIMEOUT_MS = 2500;

export const MAX_PRINT_COPIES = 5;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function mapFetchError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("aborted") || msg.includes("AbortError")) {
    return "Tiempo de espera agotado al imprimir. Revisa que el servicio esté activo.";
  }
  if (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("Load failed")
  ) {
    return [
      "El navegador bloqueó la conexión con la impresora local.",
      "Usa Chrome/Edge en el PC de caja, permite acceso a la red local si aparece el aviso,",
      "o prueba abrir http://127.0.0.1:9101/print/test en este mismo PC.",
    ].join(" ");
  }
  return `Error de red al imprimir: ${msg}`;
}

export async function checkPrintBridgeHealth(): Promise<PrintBridgeHealth | null> {
  const base = getPrintBridgeUrl();
  try {
    const res = await fetchWithTimeout(
      `${base}/health`,
      { method: "GET", cache: "no-store" },
      HEALTH_TIMEOUT_MS,
    );
    if (!res.ok) return null;
    return (await res.json()) as PrintBridgeHealth;
  } catch {
    return null;
  }
}

export async function sendPrintTicket(
  ticket: OrderTicket,
  copies = 1,
): Promise<PrintResult> {
  const total = Math.min(
    MAX_PRINT_COPIES,
    Math.max(1, Math.floor(copies) || 1),
  );
  const timeoutMs =
    PRINT_TIMEOUT_BASE_MS + (total - 1) * PRINT_TIMEOUT_PER_COPY_MS;
  const base = getPrintBridgeUrl();
  try {
    const res = await fetchWithTimeout(
      `${base}/print`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, copies: total }),
      },
      timeoutMs,
    );

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
    };

    if (!res.ok || !data.ok) {
      return {
        ok: false,
        error:
          data.error ??
          `No se pudo imprimir (HTTP ${res.status}). Revisa la ventana del servicio en el PC de caja.`,
      };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: mapFetchError(err),
    };
  }
}
