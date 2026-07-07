import { loadAppEnv } from "./env.js";
import cors from "cors";

loadAppEnv();
import express from "express";
import { printTicket } from "./print-ticket.js";
import {
  getAllStationsHealth,
  getStationConfig,
  stationInterfaceLabel,
} from "./station-printers.js";
import type { OrderTicket, PrintStation, TicketKind } from "./types.js";

const PORT = Number(process.env.PORT ?? 9101);
const HOST = process.env.HOST ?? "127.0.0.1";

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ??
  "http://localhost:3000,http://localhost:3001"
)
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  next();
});

app.use(express.json({ limit: "256kb" }));
app.use(
  cors({
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
  }),
);

const sampleTicket: OrderTicket = {
  numeroPedido: 9999,
  hora: "prueba",
  destino: "Mesa prueba",
  formaPago: "Efectivo",
  items: [
    { cantidad: 1, nombre: "Granizado Oreo", precioLinea: 11000 },
  ],
  subtotal: 11000,
  total: 11000,
  station: "bar",
  kind: "comanda",
};

function parseStation(value: unknown): PrintStation {
  const s = String(value ?? "caja").toLowerCase();
  if (s === "bar" || s === "cocina" || s === "caja") return s;
  return "caja";
}

function parseKind(value: unknown): TicketKind {
  const k = String(value ?? "comanda").toLowerCase();
  if (k === "recibo" || k === "completo" || k === "comanda") return k;
  return "comanda";
}

app.get("/health", async (_req, res) => {
  try {
    const stations = await getAllStationsHealth();
    const barReady = stations.bar.ready;
    const cocinaReady = stations.cocina.ready;
    const printerReady = barReady && cocinaReady;

    res.json({
      ok: true,
      printer: getStationConfig("bar").name ?? getStationConfig("cocina").host,
      mode: "multi-station",
      effectiveMode: "multi-station",
      interface: `bar:${stationInterfaceLabel(getStationConfig("bar"))}; cocina:${stationInterfaceLabel(getStationConfig("cocina"))}`,
      printerReady,
      printerError: printerReady
        ? null
        : [
            !barReady ? `Bar: ${stations.bar.error}` : null,
            !cocinaReady ? `Cocina: ${stations.cocina.error}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
      stations,
      port: PORT,
      allowedOrigins,
    });
  } catch (err) {
    res.json({
      ok: true,
      printerReady: false,
      printerError:
        err instanceof Error ? err.message : "Error al comprobar impresoras",
      port: PORT,
      allowedOrigins,
    });
  }
});

app.get("/print/test", async (_req, res) => {
  try {
    await printTicket(sampleTicket, {
      station: "bar",
      kind: "comanda",
      copies: 1,
    });
    res.json({ ok: true, message: "Comanda de prueba enviada (bar)." });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error desconocido al imprimir";
    res.status(500).json({ ok: false, error: message });
  }
});

app.post("/print", async (req, res) => {
  const ticket = req.body?.ticket as OrderTicket | undefined;
  const copies = Number(req.body?.copies ?? 1);
  const station = parseStation(req.body?.station ?? ticket?.station);
  const kind = parseKind(req.body?.kind ?? ticket?.kind);
  const origin = req.headers.origin ?? "(sin origin)";

  if (!ticket?.numeroPedido || !Array.isArray(ticket.items)) {
    res.status(400).json({ ok: false, error: "Payload inválido: falta ticket" });
    return;
  }

  try {
    console.log(
      `[print-bridge] POST /print #${ticket.numeroPedido} ${station}/${kind} (${ticket.items.length} items) desde ${origin}`,
    );
    await printTicket(ticket, { station, kind, copies });
    console.log(`[print-bridge] OK #${ticket.numeroPedido} → ${station}`);
    res.json({
      ok: true,
      station,
      kind,
      copies: Math.min(5, Math.max(1, Math.floor(copies) || 1)),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error desconocido al imprimir";
    console.error("[print-bridge]", message);
    res.status(500).json({ ok: false, error: message });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`[print-bridge] http://${HOST}:${PORT} · multi-estación`);
  console.log(`  bar:    ${stationInterfaceLabel(getStationConfig("bar"))}`);
  console.log(`  cocina: ${stationInterfaceLabel(getStationConfig("cocina"))}`);
  console.log(`  caja:   ${stationInterfaceLabel(getStationConfig("caja"))}`);
  console.log(`[print-bridge] Orígenes CORS: ${allowedOrigins.join(", ")}`);
});
