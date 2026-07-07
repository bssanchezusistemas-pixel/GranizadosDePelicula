import {
  isTcpPrinterReachable,
  printRawTcp,
} from "./tcp-print.js";
import {
  isWindowsPrinterAvailable,
  printRawWinSpool,
} from "./win-spool.js";
import type { PrintStation } from "./types.js";

export type StationPrintMode = "winspool" | "tcp";

export interface StationConfig {
  station: PrintStation;
  mode: StationPrintMode;
  name?: string;
  host?: string;
  port: number;
  width: number;
}

function envInt(key: string, fallback: number): number {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envStr(...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v) return v;
  }
  return undefined;
}

export function getStationConfig(station: PrintStation): StationConfig {
  const prefix = `PRINTER_${station.toUpperCase()}`;

  if (station === "cocina") {
    const host =
      envStr(`${prefix}_HOST`, "PRINTER_COCINA_HOST") ??
      envStr("PRINTER_HOST") ??
      "192.168.100.102";
    return {
      station,
      mode: "tcp",
      host,
      port: envInt(`${prefix}_PORT`, envInt("PRINTER_PORT", 9100)),
      width: envInt(`${prefix}_WIDTH`, 48),
    };
  }

  const legacyName = envStr("PRINTER_NAME", "PRINTER_BAR_NAME", "PRINTER_CAJA_NAME");
  const name =
    envStr(`${prefix}_NAME`) ??
    (station === "bar" ? legacyName : legacyName) ??
    "LR2000";

  return {
    station,
    mode: "winspool",
    name,
    port: 0,
    width: envInt(`${prefix}_WIDTH`, envInt("PRINTER_WIDTH", 48)),
  };
}

export function stationInterfaceLabel(config: StationConfig): string {
  if (config.mode === "tcp" && config.host) {
    return `tcp:${config.host}:${config.port}`;
  }
  return `winspool:${config.name ?? "?"}`;
}

export async function isStationReady(station: PrintStation): Promise<boolean> {
  const config = getStationConfig(station);
  if (config.mode === "tcp" && config.host) {
    try {
      return await isTcpPrinterReachable(config.host, config.port);
    } catch {
      return false;
    }
  }
  if (config.name && process.platform === "win32") {
    return isWindowsPrinterAvailable(config.name);
  }
  return false;
}

export async function sendRawBytesForStation(
  station: PrintStation,
  data: Buffer,
): Promise<void> {
  const config = getStationConfig(station);
  const label = stationInterfaceLabel(config);

  console.log(
    `[print-bridge] Enviando ${data.length} bytes → ${station} (${label})`,
  );

  if (config.mode === "tcp" && config.host) {
    await printRawTcp(data, config.host, config.port);
    return;
  }

  if (!config.name) {
    throw new Error(`Falta PRINTER_${station.toUpperCase()}_NAME en .env`);
  }

  await printRawWinSpool(config.name, data);
}

export function getLineWidthForStation(station: PrintStation): number {
  return getStationConfig(station).width;
}

export async function getAllStationsHealth(): Promise<
  Record<PrintStation, { ready: boolean; interface: string; error?: string }>
> {
  const stations: PrintStation[] = ["bar", "cocina", "caja"];
  const out = {} as Record<
    PrintStation,
    { ready: boolean; interface: string; error?: string }
  >;

  for (const station of stations) {
    const config = getStationConfig(station);
    const iface = stationInterfaceLabel(config);
    try {
      const ready = await isStationReady(station);
      out[station] = {
        ready,
        interface: iface,
        error: ready ? undefined : `No responde (${iface})`,
      };
    } catch (err) {
      out[station] = {
        ready: false,
        interface: iface,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return out;
}
