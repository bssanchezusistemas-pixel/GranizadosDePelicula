import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

/** Carpeta donde vive .env (raíz de GranizadosImpresora en caja, o print-bridge en dev). */
export function resolveAppRoot(): string {
  if (process.env.GRANIZADOS_APP_ROOT) {
    return process.env.GRANIZADOS_APP_ROOT;
  }
  if (existsSync(path.join(process.cwd(), ".env"))) {
    return process.cwd();
  }
  const devRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  if (existsSync(path.join(devRoot, ".env"))) {
    return devRoot;
  }
  if (existsSync(path.join(devRoot, ".env.example"))) {
    return devRoot;
  }
  return process.cwd();
}

export function loadAppEnv(): string {
  const root = resolveAppRoot();
  const envPath = path.join(root, ".env");
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
  process.env.GRANIZADOS_APP_ROOT = root;
  return root;
}
