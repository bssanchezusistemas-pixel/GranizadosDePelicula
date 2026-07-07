import { getPrintBridgeUrl } from "@/lib/print/config";
import type {
  OrderTicket,
  PrintBridgeHealth,
  PrintJob,
  PrintResult,
  PrintStation,
  TicketKind,
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
      "Usa Chrome/Edge en el PC de caja y permite acceso a la red local.",
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

export async function sendPrintJob(
  ticket: OrderTicket,
  options: {
    station?: PrintStation;
    kind?: TicketKind;
    copies?: number;
  } = {},
): Promise<PrintResult> {
  const station = options.station ?? ticket.station ?? "caja";
  const kind = options.kind ?? ticket.kind ?? "comanda";
  const total = Math.min(
    MAX_PRINT_COPIES,
    Math.max(1, Math.floor(options.copies ?? 1) || 1),
  );
  const timeoutMs =
    PRINT_TIMEOUT_BASE_MS + (total - 1) * PRINT_TIMEOUT_PER_COPY_MS;
  const base = getPrintBridgeUrl();

  const bodyTicket = { ...ticket, station, kind };

  try {
    const res = await fetchWithTimeout(
      `${base}/print`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket: bodyTicket,
          station,
          kind,
          copies: total,
        }),
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
        station,
        error:
          data.error ??
          `No se pudo imprimir (HTTP ${res.status}). Revisa el servicio en caja.`,
      };
    }

    return { ok: true, station };
  } catch (err) {
    return {
      ok: false,
      station,
      error: mapFetchError(err),
    };
  }
}

export async function sendPrintJobs(jobs: PrintJob[]): Promise<PrintResult[]> {
  const results: PrintResult[] = [];
  for (const job of jobs) {
    const result = await sendPrintJob(job.ticket, {
      station: job.station,
      kind: job.kind,
      copies: job.copies ?? 1,
    });
    results.push(result);
  }
  return results;
}

/** @deprecated Usar sendPrintJob con station/kind */
export async function sendPrintTicket(
  ticket: OrderTicket,
  copies = 1,
): Promise<PrintResult> {
  return sendPrintJob(ticket, {
    station: ticket.station ?? "caja",
    kind: ticket.kind ?? "comanda",
    copies,
  });
}
