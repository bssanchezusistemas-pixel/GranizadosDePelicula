import { createClient } from "@supabase/supabase-js";
import { MENU_CATEGORIES } from "../src/data/menu";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

try {
  const envText = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const name = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[name] = val;
  }
} catch {
  // Ignora si no existe .env.local
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing Supabase URL or Service Role Key");
}

const supabase = createClient(url, key);

async function sync() {
  for (let catIndex = 0; catIndex < MENU_CATEGORIES.length; catIndex++) {
    const cat = MENU_CATEGORIES[catIndex];
    console.log(`Syncing category: ${cat.id}`);
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
        const sizeRows = item.sizes.map((size, sizeIndex) => ({
          item_id: item.id,
          label: size.label,
          price: size.price,
          sort_order: sizeIndex,
        }));
        const { error: sizeError } = await supabase
          .from("menu_item_sizes")
          .insert(sizeRows);
        if (sizeError) throw sizeError;
      }
    }
  }
  console.log("Menu synced successfully!");
}

sync().catch(console.error);
