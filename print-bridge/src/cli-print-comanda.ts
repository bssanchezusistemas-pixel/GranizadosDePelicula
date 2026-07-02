import { loadAppEnv } from "./env.js";
import { buildComandaRaw } from "./templates/comanda.js";
import { getPrintMode, setResolvedAutoMode } from "./printer.js";
import { resolveAutoPrintMode, sendRawBytes } from "./raw-send.js";
import type { OrderTicket } from "./types.js";

loadAppEnv();

const sample: OrderTicket = {
  numeroPedido: 9998,
  hora: "prueba",
  destino: "Mesa prueba",
  formaPago: "Efectivo",
  items: [
    { cantidad: 1, nombre: "Granizado Oreo", precioLinea: 11000 },
    { cantidad: 2, nombre: "LA CHINGONA", precioLinea: 52000 },
  ],
  subtotal: 63000,
  total: 63000,
};

async function main() {
  if (getPrintMode() === "auto") {
    setResolvedAutoMode(await resolveAutoPrintMode());
  }

  const buffer = buildComandaRaw(sample);
  console.log(`Imprimiendo comanda de prueba (${buffer.length} bytes)...`);
  await sendRawBytes(buffer);
  console.log("OK.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
