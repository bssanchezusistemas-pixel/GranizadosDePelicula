import { getMenuCategories } from "@/lib/menu/get-menu";
import { MenuSection } from "@/components/MenuSection";

export async function MenuSectionLoader() {
  const categories = await getMenuCategories();
  return <MenuSection categories={categories} />;
}
