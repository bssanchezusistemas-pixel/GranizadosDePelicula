import { loadAppEnv } from "./env.js";
import cors from "cors";
loadAppEnv();
import express from "express";
import { isPrinterReady, resolvePrinterInterface } from "./printer.js";
import { printComanda } from "./templates/comanda.js";
const PORT = Number(process.env.PORT ?? 9101);
const HOST = process.env.HOST ?? "127.0.0.1";
const allowedOrigins = (process.env.ALLOWED_ORIGINS ??
    "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
const app = express();
app.use(express.json({ limit: "256kb" }));
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
}));
app.get("/health", async (_req, res) => {
    let printerReady = false;
    let printerError = null;
    let printerInterface = null;
    try {
        printerInterface = resolvePrinterInterface();
        printerReady = await isPrinterReady();
        if (!printerReady) {
            printerError =
                "Impresora no detectada. Revisa USB, encendido y PRINTER_NAME en .env.";
        }
    }
    catch (err) {
        printerError =
            err instanceof Error ? err.message : "Error al comprobar la impresora";
    }
    res.json({
        ok: true,
        printer: process.env.PRINTER_NAME ?? null,
        interface: printerInterface,
        printerReady,
        printerError,
        port: PORT,
    });
});
app.post("/print", async (req, res) => {
    const ticket = req.body?.ticket;
    if (!ticket?.numeroPedido || !Array.isArray(ticket.items)) {
        res.status(400).json({ ok: false, error: "Payload inválido: falta ticket" });
        return;
    }
    try {
        await printComanda(ticket);
        res.json({ ok: true });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido al imprimir";
        console.error("[print-bridge]", message);
        res.status(500).json({ ok: false, error: message });
    }
});
app.listen(PORT, HOST, () => {
    console.log(`[print-bridge] http://${HOST}:${PORT} · impresora: ${process.env.PRINTER_NAME ?? "(sin PRINTER_NAME)"}`);
});
