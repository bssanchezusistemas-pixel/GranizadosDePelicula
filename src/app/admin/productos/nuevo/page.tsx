import { getMenuCategoriesForAdmin } from "@/lib/menu/get-menu";
import { ProductCreateForm } from "@/app/admin/productos/nuevo/ProductCreateForm";

export const dynamic = "force-dynamic";

export default async function AdminNuevoProductoPage() {
  const categories = await getMenuCategoriesForAdmin();
  return <ProductCreateForm categories={categories} />;
}
