import { loadAppEnv } from "../src/env.js";
import { printComanda } from "../src/templates/comanda.js";

loadAppEnv();
import type { OrderTicket } from "../src/types.js";

const sample: OrderTicket = {
  numeroPedido: 5750,
  hora: "8:45 p.m.",
  destino: "Mesa 5",
  mesero: "Andrea",
  formaPago: "Efectivo",
  items: [
    {
      cantidad: 2,
      nombre: "LA CHINGONA",
      precioLinea: 52000,
      modificadores: "Sin: pepinillo, salsas · Extra: doble queso",
    },
    {
      cantidad: 1,
      nombre: "Granizado Oreo",
      precioLinea: 11000,
    },
  ],
  subtotal: 63000,
  total: 63000,
  pagaCon: 70000,
  devuelta: 7000,
};

async function main() {
  console.log("Imprimiendo comanda de prueba...");
  await printComanda(sample);
  console.log("Listo.");
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
