import { createRequire } from "node:module";
import {
  CharacterSet,
  type ThermalPrinter,
  ThermalPrinter as Printer,
  PrinterTypes,
} from "node-thermal-printer";

const require = createRequire(import.meta.url);

function loadSystemPrinterDriver(): object {
  try {
    return require("printer") as object;
  } catch {
    throw new Error(
      "No se pudo cargar el driver de impresora. Ejecuta npm install en print-bridge o reinstala con INSTALAR.bat.",
    );
  }
}

export function resolvePrinterInterface(): string {
  const custom = process.env.PRINTER_INTERFACE?.trim();
  if (custom) return custom;

  const name = process.env.PRINTER_NAME?.trim();
  if (!name) {
    throw new Error(
      "Falta PRINTER_NAME o PRINTER_INTERFACE en .env (ver .env.example).",
    );
  }
  return `printer:${name}`;
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
  const printer = createPrinter();
  try {
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
    const label =
      process.env.PRINTER_NAME?.trim() ??
      process.env.PRINTER_INTERFACE?.trim() ??
      "(sin configurar)";
    throw new Error(
      `No se pudo conectar a la impresora "${label}". Verifica USB, encendido, driver y que PRINTER_NAME coincida exactamente con Windows.`,
    );
  }
  await fn(printer);
  await printer.execute();
}
