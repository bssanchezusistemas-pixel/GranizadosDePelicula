import { loadAppEnv } from "./env.js";
import cors from "cors";
loadAppEnv();
import express from "express";
import { getEffectivePrintMode, getPrintMode, resolvePrinterInterface, setResolvedAutoMode, } from "./printer.js";
import { resolveAutoPrintMode } from "./raw-send.js";
import { isComandaPrinterReady, printComanda } from "./templates/comanda.js";
const PORT = Number(process.env.PORT ?? 9101);
const HOST = process.env.HOST ?? "127.0.0.1";
const allowedOrigins = (process.env.ALLOWED_ORIGINS ??
    "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
const app = express();
// Chrome/Edge: HTTPS (Vercel) → localhost requiere acceso a red privada
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Private-Network", "true");
    next();
});
app.use(express.json({ limit: "256kb" }));
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        console.warn("[print-bridge] CORS rechazado:", origin);
        callback(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
}));
const sampleTicket = {
    numeroPedido: 9999,
    hora: "prueba",
    destino: "Mesa prueba",
    formaPago: "Efectivo",
    items: [
        { cantidad: 1, nombre: "Granizado Oreo", precioLinea: 11000 },
    ],
    subtotal: 11000,
    total: 11000,
};
app.get("/health", async (_req, res) => {
    let printerReady = false;
    let printerError = null;
    let printerInterface = null;
    try {
        printerInterface = resolvePrinterInterface();
        printerReady = await isComandaPrinterReady();
        if (!printerReady) {
            const mode = getEffectivePrintMode();
            printerError =
                mode === "tcp"
                    ? "Impresora de red no responde. Revisa cable Ethernet, IP y PRINTER_HOST en .env."
                    : "Impresora no detectada. Ejecuta DETECTAR-CONEXION.bat.";
        }
    }
    catch (err) {
        printerError =
            err instanceof Error ? err.message : "Error al comprobar la impresora";
    }
    res.json({
        ok: true,
        printer: process.env.PRINTER_NAME ?? process.env.PRINTER_HOST ?? null,
        host: process.env.PRINTER_HOST ?? null,
        printerPort: process.env.PRINTER_PORT ?? "9100",
        mode: getPrintMode(),
        effectiveMode: getEffectivePrintMode(),
        interface: printerInterface,
        printerReady,
        printerError,
        port: PORT,
        allowedOrigins,
    });
});
/** Prueba impresión completa (abrir en el PC de caja: http://127.0.0.1:9101/print/test) */
app.get("/print/test", async (_req, res) => {
    try {
        console.log("[print-bridge] GET /print/test");
        await printComanda(sampleTicket, 1);
        res.json({ ok: true, message: "Comanda de prueba enviada a la impresora." });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido al imprimir";
        console.error("[print-bridge]", message);
        res.status(500).json({ ok: false, error: message });
    }
});
app.post("/print", async (req, res) => {
    const ticket = req.body?.ticket;
    const copies = Number(req.body?.copies ?? 1);
    const origin = req.headers.origin ?? "(sin origin)";
    if (!ticket?.numeroPedido || !Array.isArray(ticket.items)) {
        res.status(400).json({ ok: false, error: "Payload inválido: falta ticket" });
        return;
    }
    try {
        console.log(`[print-bridge] POST /print #${ticket.numeroPedido} (${ticket.items.length} items, ${copies} copia(s)) desde ${origin}`);
        await printComanda(ticket, copies);
        console.log(`[print-bridge] OK impreso #${ticket.numeroPedido}`);
        res.json({
            ok: true,
            copies: Math.min(5, Math.max(1, Math.floor(copies) || 1)),
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido al imprimir";
        console.error("[print-bridge]", message);
        res.status(500).json({ ok: false, error: message });
    }
});
app.listen(PORT, HOST, async () => {
    if (getPrintMode() === "auto") {
        const mode = await resolveAutoPrintMode();
        setResolvedAutoMode(mode);
        console.log(`[print-bridge] Modo auto → ${mode}`);
    }
    console.log(`[print-bridge] http://${HOST}:${PORT} · ${resolvePrinterInterface()}`);
    console.log(`[print-bridge] Orígenes CORS: ${allowedOrigins.join(", ")}`);
});
