import { getMenuCategoriesForAdmin } from "@/lib/menu/get-menu";
import { ProductosList } from "@/app/admin/productos/ProductosList";

export default async function AdminProductosPage() {
  const categories = await getMenuCategoriesForAdmin();
  return <ProductosList categories={categories} />;
}
