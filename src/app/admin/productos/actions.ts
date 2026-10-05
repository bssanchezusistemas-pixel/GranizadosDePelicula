"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { requireSupabaseAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/service";

export type ProductSizeInput = {
  label: string;
  price: number;
};

export type UpdateProductInput = {
  id: string;
  name: string;
  description: string;
  price: number | null;
  sizes: ProductSizeInput[];
  badge: string | null;
  active: boolean;
  categoryId?: string;
};

export type CreateProductInput = {
  categoryId: string;
  name: string;
  description: string;
  price: number | null;
  sizes: ProductSizeInput[];
  badge: string | null;
  active: boolean;
  imageUrl?: string | null;
};

export async function createProductAction(
  input: CreateProductInput,
): Promise<string> {
  await requireSupabaseAdmin();
  const supabase = createServiceClient();

  const name = input.name.trim();
  if (!name) {
    throw new Error("El nombre del producto es obligatorio.");
  }
  const categoryId = input.categoryId.trim();
  if (!categoryId) {
    throw new Error("La categoría es obligatoria.");
  }

  const validSizes = (input.sizes ?? [])
    .map((s) => ({ label: s.label.trim(), price: Number(s.price) || 0 }))
    .filter((s) => s.label.length > 0);

  const hasSizes = validSizes.length > 0;

  if (hasSizes) {
    const labelSet = new Set<string>();
    for (const size of validSizes) {
      const lower = size.label.toLowerCase();
      if (labelSet.has(lower)) {
        throw new Error(
          `El tamaño "${size.label}" está duplicado. Cada tamaño debe tener un nombre único.`,
        );
      }
      labelSet.add(lower);

      if (size.price <= 0) {
        throw new Error(
          `El tamaño "${size.label}" debe tener un precio mayor a 0.`,
        );
      }
    }
  } else {
    if (input.price == null || isNaN(input.price) || input.price <= 0) {
      throw new Error("Debes indicar un precio válido mayor a 0.");
    }
  }

  // Obtener el mayor sort_order para ubicar el nuevo producto al final de la categoría
  const { data: maxItem } = await supabase
    .from("menu_items")
    .select("sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = (maxItem?.sort_order ?? -1) + 1;

  // Generar ID único basado en prefijo de categoría, nombre y sufijo aleatorio
  const catPrefix = categoryId
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 4);

  const cleanName = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/, "");

  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const productId = `${catPrefix || "prod"}-${cleanName || "item"}-${randomSuffix}`;

  const { error: itemError } = await supabase.from("menu_items").insert({
    id: productId,
    category_id: categoryId,
    name,
    description: (input.description || "").trim(),
    price: hasSizes ? null : Math.round(Number(input.price)),
    badge: input.badge?.trim() || null,
    image_url: input.imageUrl?.trim() || null,
    public_only: false,
    sort_order: sortOrder,
    active: input.active,
    updated_at: new Date().toISOString(),
  });

  if (itemError) throw new Error(itemError.message);

  if (hasSizes) {
    const rows = validSizes.map((size, index) => ({
      item_id: productId,
      label: size.label,
      price: Math.round(size.price),
      sort_order: index,
    }));
    const { error: sizeError } = await supabase
      .from("menu_item_sizes")
      .insert(rows);
    if (sizeError) throw new Error(sizeError.message);
  }

  revalidatePath("/");
  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productId}`);

  return productId;
}

export async function updateProductAction(input: UpdateProductInput) {
  await requireSupabaseAdmin();
  const supabase = createServiceClient();

  const name = input.name.trim();
  if (!name) {
    throw new Error("El nombre del producto es obligatorio.");
  }

  const validSizes = (input.sizes ?? [])
    .map((s) => ({ label: s.label.trim(), price: Number(s.price) || 0 }))
    .filter((s) => s.label.length > 0);

  const hasSizes = validSizes.length > 0;

  if (hasSizes) {
    const labelSet = new Set<string>();
    for (const size of validSizes) {
      const lower = size.label.toLowerCase();
      if (labelSet.has(lower)) {
        throw new Error(
          `El tamaño "${size.label}" está duplicado. Cada tamaño debe tener un nombre único.`,
        );
      }
      labelSet.add(lower);

      if (size.price <= 0) {
        throw new Error(
          `El tamaño "${size.label}" debe tener un precio mayor a 0.`,
        );
      }
    }
  } else {
    if (input.price == null || isNaN(input.price) || input.price <= 0) {
      throw new Error("Debes indicar un precio válido mayor a 0.");
    }
  }

  const updatePayload: Record<string, unknown> = {
    name,
    description: (input.description || "").trim(),
    price: hasSizes ? null : Math.round(Number(input.price)),
    badge: input.badge?.trim() || null,
    active: input.active,
    updated_at: new Date().toISOString(),
  };

  if (input.categoryId) {
    updatePayload.category_id = input.categoryId.trim();
  }

  const { error: itemError } = await supabase
    .from("menu_items")
    .update(updatePayload)
    .eq("id", input.id);

  if (itemError) throw new Error(itemError.message);

  const { error: deleteError } = await supabase
    .from("menu_item_sizes")
    .delete()
    .eq("item_id", input.id);

  if (deleteError) throw new Error(deleteError.message);

  if (hasSizes) {
    const rows = validSizes.map((size, index) => ({
      item_id: input.id,
      label: size.label,
      price: Math.round(size.price),
      sort_order: index,
    }));
    const { error: sizeError } = await supabase
      .from("menu_item_sizes")
      .insert(rows);
    if (sizeError) throw new Error(sizeError.message);
  }

  revalidatePath("/");
  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${input.id}`);
}

export async function uploadProductImageFile(
  formData: FormData,
): Promise<string> {
  await requireSupabaseAdmin();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona una imagen válida.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const compressed = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer();

  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const path = `prod-${Date.now()}-${randomSuffix}.webp`;
  const supabase = createServiceClient();

  const { error: uploadError } = await supabase.storage
    .from("menu-images")
    .upload(path, compressed, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("menu-images").getPublicUrl(path);

  return publicUrl;
}

export async function updateProductImageAction(
  productId: string,
  formData: FormData,
) {
  const publicUrl = await uploadProductImageFile(formData);
  const supabase = createServiceClient();

  const { error: updateError } = await supabase
    .from("menu_items")
    .update({
      image_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/");
  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productId}`);

  return publicUrl;
}

export async function removeProductImageAction(productId: string) {
  await requireSupabaseAdmin();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("menu_items")
    .update({
      image_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productId}`);
}

export async function deleteProductAction(productId: string) {
  await requireSupabaseAdmin();
  const supabase = createServiceClient();

  // Eliminar tamaños asociados si existen
  const { error: deleteSizesError } = await supabase
    .from("menu_item_sizes")
    .delete()
    .eq("item_id", productId);

  if (deleteSizesError) throw new Error(deleteSizesError.message);

  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", productId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productId}`);
}

