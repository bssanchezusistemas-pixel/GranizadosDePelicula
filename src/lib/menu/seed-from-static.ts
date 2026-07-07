import { createServiceClient } from "@/lib/supabase/service";
import { MENU_CATEGORIES } from "@/data/menu";

/** Importa menu.ts estático a Supabase si las tablas están vacías. */
export async function seedMenuFromStaticIfEmpty(): Promise<boolean> {
  const supabase = createServiceClient();

  const { count, error: countError } = await supabase
    .from("menu_categories")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw countError;
  }
  if (count && count > 0) return false;

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

  return true;
}
