/**
 * Seed one-shot: importa menu.ts estático → Supabase.
 * Uso: node scripts/seed-menu.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");

try {
  const envText = readFileSync(envPath, "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const name = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[name] = val;
  }
} catch {
  console.warn("No .env.local — usa variables de entorno del sistema.");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const { MENU_CATEGORIES } = await import(
  pathToFileURL(join(root, "src/data/menu.ts")).href
);

const supabase = createClient(url, key);

const { count } = await supabase
  .from("menu_categories")
  .select("*", { count: "exact", head: true });

if (count && count > 0) {
  console.log(`Menú ya tiene ${count} categorías.`);
  process.exit(0);
}

for (let catIndex = 0; catIndex < MENU_CATEGORIES.length; catIndex++) {
  const cat = MENU_CATEGORIES[catIndex];
  const { error: catError } = await supabase.from("menu_categories").upsert({
    id: cat.id,
    label: cat.label,
    tagline: cat.tagline,
    accent_color: cat.accentColor ?? null,
    sort_order: catIndex,
  });
  if (catError) throw catError;

  for (let itemIndex = 0; itemIndex < cat.items.length; itemIndex++) {
    const item = cat.items[itemIndex];
    const { error: itemError } = await supabase.from("menu_items").upsert({
      id: item.id,
      category_id: cat.id,
      name: item.name,
      description: item.description,
      price: item.price ?? null,
      badge: item.badge ?? null,
      image_url: item.image ?? null,
      public_only: item.publicOnly ?? false,
      sort_order: itemIndex,
      active: true,
    });
    if (itemError) throw itemError;

    if (item.sizes?.length) {
      await supabase.from("menu_item_sizes").delete().eq("item_id", item.id);
      const { error: sizeError } = await supabase.from("menu_item_sizes").insert(
        item.sizes.map((size, sizeIndex) => ({
          item_id: item.id,
          label: size.label,
          price: size.price,
          sort_order: sizeIndex,
        })),
      );
      if (sizeError) throw sizeError;
    }
  }
}

console.log(
  `Importados ${MENU_CATEGORIES.length} categorías y ${MENU_CATEGORIES.reduce((n, c) => n + c.items.length, 0)} productos.`,
);
