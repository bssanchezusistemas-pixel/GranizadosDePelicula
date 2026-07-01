/**
 * Ejecutable empaquetado (pkg): inicia Node portable + servidor de impresión.
 * Debe vivir junto a node/, app/ y .env en la carpeta GranizadosImpresora.
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const root = path.dirname(process.execPath);
const nodeExe = path.join(root, "node", "node.exe");
const serverEntry = path.join(root, "app", "dist", "server.js");
const envFile = path.join(root, ".env");

function waitForKey(message) {
  console.log(message);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("", () => {
    rl.close();
    process.exit(1);
  });
}

if (!fs.existsSync(envFile)) {
  console.error("\nERROR: No existe .env en esta carpeta:");
  console.error(root);
  console.error("\n1. Copia .env.example a .env");
  console.error("2. Pon PRINTER_NAME con el nombre de Windows");
  waitForKey("\nPresiona Enter para cerrar...");
}

if (!fs.existsSync(nodeExe)) {
  console.error("\nERROR: Falta node\\node.exe — carpeta de instalación incompleta.");
  waitForKey("\nPresiona Enter para cerrar...");
}

if (!fs.existsSync(serverEntry)) {
  console.error("\nERROR: Falta app\\dist\\server.js — vuelve a generar el paquete.");
  waitForKey("\nPresiona Enter para cerrar...");
}

console.log("========================================");
console.log("  GRANIZADOS DE PELICULA — IMPRESORA");
console.log("========================================");
console.log("Servicio activo. NO cierre esta ventana.");
console.log("Carpeta:", root);
console.log("");

const child = spawn(nodeExe, [serverEntry], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    GRANIZADOS_APP_ROOT: root,
  },
});

child.on("exit", (code) => {
  console.log("\nServicio detenido.");
  waitForKey("Presiona Enter para cerrar...");
  process.exit(code ?? 0);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
