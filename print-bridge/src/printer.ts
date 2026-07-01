import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CharacterSet,
  type ThermalPrinter,
  ThermalPrinter as Printer,
  PrinterTypes,
} from "node-thermal-printer";

const require = createRequire(import.meta.url);

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
    [
      "Modo native no disponible (falta módulo printer).",
      errors[0] ? `Detalle: ${errors[0]}` : "",
      "Usa PRINTER_MODE=share en .env (recomendado) y ejecuta INSTALAR.bat.",
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function resolvePrinterInterface(): string {
  const custom = process.env.PRINTER_INTERFACE?.trim();
  if (custom) return custom;

  const share = process.env.PRINTER_SHARE?.trim();
  if (share) return toLocalSharePath(share);

  const name = process.env.PRINTER_NAME?.trim();
  if (!name) {
    throw new Error(
      "Falta PRINTER_NAME en .env. Pon el nombre exacto de la impresora en Windows.",
    );
  }

  const mode = (process.env.PRINTER_MODE ?? "share").trim().toLowerCase();
  if (mode === "native" || mode === "npm") {
    return `printer:${name}`;
  }

  // Por defecto: impresora compartida (no requiere módulo printer nativo)
  return toLocalSharePath(name);
}

function usesSystemPrinterDriver(iface: string): boolean {
  return iface.startsWith("printer:");
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

export async function isPrinterReady(): Promise<boolean> {
  try {
    const printer = createPrinter();
    return (await printer.isPrinterConnected()) === true;
  } catch {
    return false;
  }
}

export async function executePrint(
  fn: (printer: ThermalPrinter) => Promise<void> | void,
): Promise<void> {
  const printer = createPrinter();
  const connected = await isPrinterReady();
  if (!connected) {
    const iface = resolvePrinterInterface();
    throw new Error(
      [
        `No se pudo conectar a la impresora (${iface}).`,
        "Verifica: impresora encendida, USB conectado, PRINTER_NAME correcto.",
        "Si usas modo share: ejecuta INSTALAR.bat para compartir la impresora,",
        "o en Windows → Propiedades de impresora → Compartir.",
      ].join(" "),
    );
  }
  await fn(printer);
  await printer.execute();
}
