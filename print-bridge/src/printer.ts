import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CharacterSet,
  type ThermalPrinter,
  ThermalPrinter as Printer,
  PrinterTypes,
} from "node-thermal-printer";
import {
  isWindowsPrinterAvailable,
  printRawWinSpool,
} from "./win-spool.js";

const require = createRequire(import.meta.url);

export type PrintMode = "winspool" | "share" | "native";

export function getPrintMode(): PrintMode {
  const mode = (process.env.PRINTER_MODE ?? "winspool").trim().toLowerCase();
  if (mode === "share") return "share";
  if (mode === "native" || mode === "npm") return "native";
  return "winspool";
}

/** Modo real de impresión. En Windows, share/native se redirigen a winspool. */
export function getEffectivePrintMode(): PrintMode {
  const mode = getPrintMode();
  if (process.platform === "win32" && (mode === "share" || mode === "native")) {
    return "winspool";
  }
  return mode;
}

export function getPrinterName(): string {
  const name = process.env.PRINTER_NAME?.trim();
  if (!name) {
    throw new Error(
      "Falta PRINTER_NAME en .env. Usa el nombre exacto de Get-Printer en PowerShell.",
    );
  }
  return name;
}

function toLocalSharePath(shareName: string): string {
  let name = shareName.trim();
  const prefix = "\\\\localhost\\";
  if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
    return name;
  }
  name = name.replace(/^\\\\+/, "");
  return `${prefix}${name}`;
}

function moduleSearchPaths(): string[] {
  const distDir = path.dirname(fileURLToPath(import.meta.url));
  const appRoot = process.env.GRANIZADOS_APP_ROOT?.trim();
  const paths: string[] = [];

  if (appRoot) {
    paths.push(path.join(appRoot, "app", "node_modules"));
    paths.push(path.join(appRoot, "node_modules"));
  }

  paths.push(path.join(distDir, "..", "node_modules"));
  paths.push(path.join(distDir, "..", "..", "node_modules"));

  return paths;
}

function loadSystemPrinterDriver(): object {
  const errors: string[] = [];
  const attempts: Array<() => object> = [
    () => require("printer") as object,
    ...moduleSearchPaths().map((dir) => () => {
      return require(path.join(dir, "printer")) as object;
    }),
  ];

  for (const attempt of attempts) {
    try {
      return attempt();
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  throw new Error(
    `Modo native no disponible. ${errors[0] ?? ""} Usa PRINTER_MODE=winspool.`,
  );
}

export function resolvePrinterInterface(): string {
  const mode = getEffectivePrintMode();
  if (mode === "winspool") {
    return `winspool:${getPrinterName()}`;
  }

  const custom = process.env.PRINTER_INTERFACE?.trim();
  if (custom) return custom;

  const share = process.env.PRINTER_SHARE?.trim();
  if (share) return toLocalSharePath(share);

  const name = getPrinterName();
  if (mode === "native") {
    return `printer:${name}`;
  }

  return toLocalSharePath(name);
}

function usesSystemPrinterDriver(iface: string): boolean {
  return iface.startsWith("printer:");
}

export function createBufferPrinter(): ThermalPrinter {
  const nullDevice =
    process.platform === "win32" ? "\\\\.\\nul" : "/dev/null";

  const width = Number(process.env.PRINTER_WIDTH ?? 32);

  return new Printer({
    type: PrinterTypes.EPSON,
    interface: nullDevice,
    characterSet: CharacterSet.PC858_EURO,
    width: Number.isFinite(width) && width > 0 ? width : 32,
    removeSpecialCharacters: false,
    lineCharacter: "-",
  });
}

export function createPrinter(): ThermalPrinter {
  const iface = resolvePrinterInterface();
  const config: ConstructorParameters<typeof Printer>[0] = {
    type: PrinterTypes.EPSON,
    interface: iface,
    characterSet: CharacterSet.PC858_EURO,
    width: 48,
    removeSpecialCharacters: false,
    lineCharacter: "-",
  };

  if (usesSystemPrinterDriver(iface)) {
    config.driver = loadSystemPrinterDriver();
  }

  return new Printer(config);
}

async function printViaWinSpool(
  fn: (printer: ThermalPrinter) => Promise<void> | void,
): Promise<void> {
  const name = getPrinterName();
  const ready = await isWindowsPrinterAvailable(name);
  if (!ready) {
    throw new Error(
      `Impresora "${name}" no encontrada en Windows. Ejecuta Get-Printer y revisa PRINTER_NAME.`,
    );
  }

  const builder = createBufferPrinter();
  await fn(builder);
  const buffer = builder.getBuffer();
  if (!buffer?.length) {
    throw new Error(
      "Ticket vacío — no se generó buffer de impresión. Revisa PRINTER_WIDTH en .env.",
    );
  }
  console.log(
    `[print-bridge] Enviando ${buffer.length} bytes a "${name}"`,
  );
  await printRawWinSpool(name, buffer);
}

export async function isPrinterReady(): Promise<boolean> {
  try {
    if (getEffectivePrintMode() === "winspool" && process.platform === "win32") {
      return await isWindowsPrinterAvailable(getPrinterName());
    }

    const printer = createPrinter();
    return (await printer.isPrinterConnected()) === true;
  } catch {
    return false;
  }
}

export async function executePrint(
  fn: (printer: ThermalPrinter) => Promise<void> | void,
): Promise<void> {
  if (getEffectivePrintMode() === "winspool" && process.platform === "win32") {
    await printViaWinSpool(fn);
    return;
  }

  const printer = createPrinter();
  const connected = await isPrinterReady();
  if (!connected) {
    throw new Error(
      `No se pudo conectar (${resolvePrinterInterface()}). Prueba PRINTER_MODE=winspool.`,
    );
  }
  await fn(printer);
  await printer.execute();
}
