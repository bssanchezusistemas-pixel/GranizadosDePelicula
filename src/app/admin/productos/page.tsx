import { getMenuCategoriesForAdmin } from "@/lib/menu/get-menu";
import { ProductosList } from "@/app/admin/productos/ProductosList";

export const dynamic = "force-dynamic";

export default async function AdminProductosPage() {
  const categories = await getMenuCategoriesForAdmin();
  return <ProductosList categories={categories} />;
}
