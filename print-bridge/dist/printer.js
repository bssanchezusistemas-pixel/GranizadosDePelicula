import { CharacterSet, ThermalPrinter as Printer, PrinterTypes, } from "node-thermal-printer";
export function createPrinter() {
    const name = process.env.PRINTER_NAME?.trim();
    if (!name) {
        throw new Error("Falta PRINTER_NAME en .env (nombre de impresora en Windows).");
    }
    return new Printer({
        type: PrinterTypes.EPSON,
        interface: `printer:${name}`,
        characterSet: CharacterSet.PC858_EURO,
        width: 48,
        removeSpecialCharacters: false,
        lineCharacter: "-",
    });
}
export async function executePrint(fn) {
    const printer = createPrinter();
    const connected = await printer.isPrinterConnected();
    if (!connected) {
        throw new Error(`No se pudo conectar a la impresora "${process.env.PRINTER_NAME}". Verifica USB y driver.`);
    }
    await fn(printer);
    await printer.execute();
}
