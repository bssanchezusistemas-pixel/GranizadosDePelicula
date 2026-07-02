import net from "node:net";
export function getTcpHost() {
    const host = process.env.PRINTER_HOST?.trim();
    if (!host) {
        throw new Error("Falta PRINTER_HOST en .env (IP de la impresora en red). Ejecuta DETECTAR-CONEXION.bat.");
    }
    return host;
}
export function getTcpPort() {
    const port = Number(process.env.PRINTER_PORT ?? 9100);
    return Number.isFinite(port) && port > 0 ? port : 9100;
}
export async function isTcpPrinterReachable(host = getTcpHost(), port = getTcpPort(), timeoutMs = 3000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        const done = (ok) => {
            socket.destroy();
            resolve(ok);
        };
        socket.setTimeout(timeoutMs);
        socket.once("connect", () => done(true));
        socket.once("timeout", () => done(false));
        socket.once("error", () => done(false));
        socket.connect(port, host);
    });
}
/** Envío directo a impresora de red — puerto 9100 (sin Windows spooler). */
export async function printRawTcp(data, host = getTcpHost(), port = getTcpPort()) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(15000);
        socket.connect(port, host, () => {
            socket.write(data, (err) => {
                socket.end();
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        socket.on("timeout", () => {
            socket.destroy();
            reject(new Error(`Tiempo agotado conectando a ${host}:${port}. ¿Cable de red bien conectado?`));
        });
        socket.on("error", (err) => {
            reject(new Error(`No se pudo conectar a ${host}:${port}. ${err.message}. Revisa IP con DETECTAR-CONEXION.bat.`));
        });
    });
}
