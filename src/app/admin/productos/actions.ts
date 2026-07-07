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
};

export async function updateProductAction(input: UpdateProductInput) {
  await requireSupabaseAdmin();
  const supabase = createServiceClient();

  const hasSizes = input.sizes.length > 0;
  const { error: itemError } = await supabase
    .from("menu_items")
    .update({
      name: input.name.trim(),
      description: input.description.trim(),
      price: hasSizes ? null : input.price,
      badge: input.badge?.trim() || null,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (itemError) throw new Error(itemError.message);

  await supabase.from("menu_item_sizes").delete().eq("item_id", input.id);

  if (hasSizes) {
    const rows = input.sizes.map((size, index) => ({
      item_id: input.id,
      label: size.label.trim(),
      price: size.price,
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

export async function updateProductImageAction(
  productId: string,
  formData: FormData,
) {
  await requireSupabaseAdmin();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona una imagen.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const compressed = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer();

  const path = `${productId}-${Date.now()}.webp`;
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
