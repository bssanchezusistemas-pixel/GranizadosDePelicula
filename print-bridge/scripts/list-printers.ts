import { createRequire } from "node:module";
import { loadAppEnv } from "../src/env.js";

loadAppEnv();

const require = createRequire(import.meta.url);

try {
  const printer = require("printer") as {
    getPrinters: () => Array<{ name: string; status?: string }>;
  };

  const list = printer.getPrinters();
  if (list.length === 0) {
    console.log("No se encontraron impresoras en Windows.");
    process.exit(1);
  }

  console.log("Impresoras instaladas en Windows:\n");
  for (const p of list) {
    console.log(`  • ${p.name}`);
    if (p.status) console.log(`    estado: ${p.status}`);
  }
  console.log(
    "\nCopia el nombre exacto en PRINTER_NAME del archivo .env del print-bridge.",
  );
} catch (err) {
  console.error(
    "Error:",
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
}
