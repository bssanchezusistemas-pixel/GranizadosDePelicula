import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { MENU_CATEGORIES, type MenuCategory, type MenuItem } from "@/data/menu";
import { seedMenuFromStaticIfEmpty } from "@/lib/menu/seed-from-static";

type MenuItemRow = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number | null;
  badge: string | null;
  image_url: string | null;
  public_only: boolean;
  sort_order: number;
  active: boolean;
};

type MenuSizeRow = {
  item_id: string;
  label: string;
  price: number;
  sort_order: number;
};

function mapItem(row: MenuItemRow, sizes: MenuSizeRow[]): MenuItem {
  const itemSizes = sizes
    .filter((s) => s.item_id === row.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({ label: s.label, price: Number(s.price) }));

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ...(row.price != null ? { price: Number(row.price) } : {}),
    ...(itemSizes.length > 0 ? { sizes: itemSizes } : {}),
    ...(row.badge ? { badge: row.badge } : {}),
    ...(row.image_url ? { image: row.image_url } : {}),
    ...(row.public_only ? { publicOnly: true } : {}),
  };
}

async function fetchMenuFromDb(includeInactive = false): Promise<MenuCategory[]> {
  const supabase = await createClient();

  const { data: categories, error: catError } = await supabase
    .from("menu_categories")
    .select("*")
    .order("sort_order");

  if (catError) throw catError;
  if (!categories?.length) return [];

  let itemsQuery = supabase
    .from("menu_items")
    .select("*")
    .order("sort_order");

  if (!includeInactive) {
    itemsQuery = itemsQuery.eq("active", true);
  }

  const { data: items, error: itemsError } = await itemsQuery;
  if (itemsError) throw itemsError;

  const itemIds = (items ?? []).map((i) => i.id);
  let sizes: MenuSizeRow[] = [];

  if (itemIds.length > 0) {
    const { data: sizeRows, error: sizeError } = await supabase
      .from("menu_item_sizes")
      .select("item_id, label, price, sort_order")
      .in("item_id", itemIds)
      .order("sort_order");
    if (sizeError) throw sizeError;
    sizes = (sizeRows ?? []) as MenuSizeRow[];
  }

  return (categories as { id: string; label: string; tagline: string; accent_color: string | null; sort_order: number }[]).map(
    (cat) => ({
      id: cat.id as MenuCategory["id"],
      label: cat.label,
      tagline: cat.tagline,
      ...(cat.accent_color ? { accentColor: cat.accent_color } : {}),
      items: (items as MenuItemRow[])
        .filter((item) => item.category_id === cat.id)
        .map((item) => mapItem(item, sizes)),
    }),
  );
}

export const getMenuCategories = cache(async (): Promise<MenuCategory[]> => {
  try {
    let categories = await fetchMenuFromDb(false);
    if (categories.length === 0) {
      await seedMenuFromStaticIfEmpty();
      categories = await fetchMenuFromDb(false);
    }
    if (categories.length > 0) return categories;
  } catch {
    // Tablas aún no migradas o Supabase no configurado
  }
  return MENU_CATEGORIES;
});

/** Para admin: incluye productos inactivos. */
export const getMenuCategoriesForAdmin = cache(async (): Promise<MenuCategory[]> => {
  try {
    let categories = await fetchMenuFromDb(true);
    if (categories.length === 0) {
      await seedMenuFromStaticIfEmpty();
      categories = await fetchMenuFromDb(true);
    }
    if (categories.length > 0) return categories;
  } catch {
    // fallback
  }
  return MENU_CATEGORIES;
});

export async function getMenuItemById(
  id: string,
): Promise<(MenuItem & { categoryId: string; active: boolean }) | null> {
  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) return null;

  const { data: sizes } = await supabase
    .from("menu_item_sizes")
    .select("item_id, label, price, sort_order")
    .eq("item_id", id)
    .order("sort_order");

  const item = mapItem(row as MenuItemRow, (sizes ?? []) as MenuSizeRow[]);
  return {
    ...item,
    categoryId: row.category_id,
    active: row.active,
  };
}

export async function buildMenuIndex(): Promise<Map<string, MenuItem>> {
  const categories = await getMenuCategories();
  const map = new Map<string, MenuItem>();
  for (const cat of categories) {
    for (const item of cat.items) {
      map.set(item.id, item);
    }
  }
  return map;
}
