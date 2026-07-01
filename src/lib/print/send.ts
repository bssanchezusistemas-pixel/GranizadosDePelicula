import { getPrintBridgeUrl } from "@/lib/print/config";
import type {
  OrderTicket,
  PrintBridgeHealth,
  PrintResult,
} from "@/lib/print/types";

const PRINT_TIMEOUT_MS = 8000;
const HEALTH_TIMEOUT_MS = 2500;

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
): Promise<PrintResult> {
  const base = getPrintBridgeUrl();
  try {
    const res = await fetchWithTimeout(
      `${base}/print`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket }),
      },
      PRINT_TIMEOUT_MS,
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
          "No se pudo imprimir. Verifica que el servicio local esté activo.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        "Impresora offline — inicia el servicio con npm run print:bridge en el PC de caja.",
    };
  }
}
