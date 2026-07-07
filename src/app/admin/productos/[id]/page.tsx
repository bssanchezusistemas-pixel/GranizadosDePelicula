import { notFound } from "next/navigation";
import { getMenuCategoriesForAdmin, getMenuItemById } from "@/lib/menu/get-menu";
import { ProductEditForm } from "@/app/admin/productos/ProductEditForm";

export default async function AdminProductoEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getMenuItemById(id);
  if (!product) notFound();

  const categories = await getMenuCategoriesForAdmin();
  const categoryLabel =
    categories.find((c) => c.id === product.categoryId)?.label ?? product.categoryId;

  return <ProductEditForm product={product} categoryLabel={categoryLabel} />;
}
