import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CharacterSet, ThermalPrinter as Printer, PrinterTypes, } from "node-thermal-printer";
const require = createRequire(import.meta.url);
function moduleSearchPaths() {
    const distDir = path.dirname(fileURLToPath(import.meta.url));
    const appRoot = process.env.GRANIZADOS_APP_ROOT?.trim();
    const paths = [];
    if (appRoot) {
        paths.push(path.join(appRoot, "app", "node_modules"));
        paths.push(path.join(appRoot, "node_modules"));
    }
    paths.push(path.join(distDir, "..", "node_modules"));
    paths.push(path.join(distDir, "..", "..", "node_modules"));
    return paths;
}
function loadSystemPrinterDriver() {
    const errors = [];
    const attempts = [
        () => require("printer"),
        ...moduleSearchPaths().map((dir) => () => {
            const modPath = path.join(dir, "printer");
            return require(modPath);
        }),
    ];
    for (const attempt of attempts) {
        try {
            return attempt();
        }
        catch (err) {
            errors.push(err instanceof Error ? err.message : String(err));
        }
    }
    throw new Error([
        "No se pudo cargar el driver de impresora.",
        errors[0] ? `Detalle: ${errors[0]}` : "",
        "Solución: ejecuta INSTALAR.bat en esta carpeta.",
        "Alternativa en .env: comparte la impresora en Windows y usa",
        "PRINTER_INTERFACE=\\\\localhost\\NombreCompartido",
    ]
        .filter(Boolean)
        .join(" "));
}
export function resolvePrinterInterface() {
    const custom = process.env.PRINTER_INTERFACE?.trim();
    if (custom)
        return custom;
    const share = process.env.PRINTER_SHARE?.trim();
    if (share) {
        let name = share;
        const prefix = "\\\\localhost\\";
        if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
            name = name.slice(prefix.length);
        }
        name = name.replace(/^\\\\+/, "");
        return `${prefix}${name}`;
    }
    const name = process.env.PRINTER_NAME?.trim();
    if (!name) {
        throw new Error("Falta PRINTER_NAME o PRINTER_INTERFACE en .env (ver .env.example).");
    }
    return `printer:${name}`;
}
function usesSystemPrinterDriver(iface) {
    return iface.startsWith("printer:");
}
export function createPrinter() {
    const iface = resolvePrinterInterface();
    const config = {
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
export async function isPrinterReady() {
    try {
        const printer = createPrinter();
        return (await printer.isPrinterConnected()) === true;
    }
    catch {
        return false;
    }
}
export async function executePrint(fn) {
    const printer = createPrinter();
    const connected = await isPrinterReady();
    if (!connected) {
        const label = process.env.PRINTER_NAME?.trim() ??
            process.env.PRINTER_INTERFACE?.trim() ??
            process.env.PRINTER_SHARE?.trim() ??
            "(sin configurar)";
        throw new Error(`No se pudo conectar a la impresora "${label}". Verifica USB, encendido, driver y que PRINTER_NAME coincida exactamente con Windows.`);
    }
    await fn(printer);
    await printer.execute();
}
