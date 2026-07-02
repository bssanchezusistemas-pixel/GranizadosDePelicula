import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  getEffectivePrintMode,
  getPrintMode,
  type PrintMode,
} from "./printer.js";
import {
  getTcpHost,
  getTcpPort,
  isTcpPrinterReachable,
  printRawTcp,
} from "./tcp-print.js";
import { isWindowsPrinterAvailable, printRawWinSpool } from "./win-spool.js";

const execFileAsync = promisify(execFile);

export interface RawPrintTarget {
  mode: PrintMode;
  label: string;
}

export function resolveRawPrintTarget(): RawPrintTarget {
  const mode = getEffectivePrintMode();
  if (mode === "tcp") {
    return {
      mode: "tcp",
      label: `tcp:${getTcpHost()}:${getTcpPort()}`,
    };
  }
  const name = process.env.PRINTER_NAME?.trim() ?? "(sin nombre)";
  return { mode: "winspool", label: `winspool:${name}` };
}

/** Lee la IP configurada en el puerto TCP/IP de Windows para esa impresora. */
export async function detectPrinterHostFromWindows(
  printerName: string,
): Promise<string | null> {
  const safe = printerName.replace(/'/g, "''");
  const cmd = [
    `$p = Get-Printer -Name '${safe}' -ErrorAction SilentlyContinue`,
    "if (-not $p) { exit 1 }",
    `$port = Get-PrinterPort -Name $p.PortName -ErrorAction SilentlyContinue`,
    "if ($port -and $port.PrinterHostAddress) { Write-Output $port.PrinterHostAddress; exit 0 }",
    "if ($p.PortName -match 'IP[_-]?([0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+)') { Write-Output $matches[1]; exit 0 }",
    "exit 2",
  ].join("; ");

  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", cmd],
      { timeout: 10000, windowsHide: true },
    );
    const ip = stdout.trim();
    return ip || null;
  } catch {
    return null;
  }
}

export async function isRawPrinterReady(): Promise<boolean> {
  const mode = getEffectivePrintMode();
  if (mode === "tcp") {
    try {
      return await isTcpPrinterReachable();
    } catch {
      return false;
    }
  }

  if (process.platform === "win32") {
    const name = process.env.PRINTER_NAME?.trim();
    if (!name) return false;
    return isWindowsPrinterAvailable(name);
  }

  return false;
}

export async function sendRawBytes(data: Buffer): Promise<void> {
  const mode = getEffectivePrintMode();
  const target = resolveRawPrintTarget();

  if (mode === "tcp") {
    console.log(
      `[print-bridge] Enviando ${data.length} bytes por RED → ${target.label}`,
    );
    await printRawTcp(data);
    return;
  }

  const name = process.env.PRINTER_NAME?.trim();
  if (!name) {
    throw new Error("Falta PRINTER_NAME en .env");
  }

  console.log(
    `[print-bridge] Enviando ${data.length} bytes por Windows → "${name}"`,
  );
  await printRawWinSpool(name, data);
}

/** Si PRINTER_MODE=auto, elige tcp si hay IP (env o Windows) o winspool. */
export async function resolveAutoPrintMode(): Promise<PrintMode> {
  if (process.env.PRINTER_HOST?.trim()) return "tcp";

  const name = process.env.PRINTER_NAME?.trim();
  if (name && process.platform === "win32") {
    const ip = await detectPrinterHostFromWindows(name);
    if (ip) {
      process.env.PRINTER_HOST = ip;
      console.log(`[print-bridge] Auto: impresora en red ${ip} (puerto 9100)`);
      return "tcp";
    }
  }

  return "winspool";
}

export function getConfiguredPrintMode(): PrintMode {
  return getPrintMode();
}
