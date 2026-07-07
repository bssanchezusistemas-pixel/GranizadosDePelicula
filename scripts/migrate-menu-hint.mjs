/**
 * Muestra el proyecto Supabase y cómo aplicar sql/013_menu_cms.sql
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");

for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) continue;
  const url = trimmed.slice("NEXT_PUBLIC_SUPABASE_URL=".length).trim();
  const ref = url.match(/https:\/\/([^.]+)/)?.[1];
  console.log("\nAplica la migración del menú CMS en Supabase:\n");
  console.log(`  1. Abre https://supabase.com/dashboard/project/${ref}/sql/new`);
  console.log("  2. Pega el contenido de sql/013_menu_cms.sql");
  console.log("  3. Ejecuta el script");
  console.log("  4. Corre: npm run menu:seed\n");
  break;
}
