"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatCOP, type MenuItem } from "@/data/menu";
import {
  deleteProductAction,
  removeProductImageAction,
  updateProductAction,
  updateProductImageAction,
  type ProductSizeInput,
} from "@/app/admin/productos/actions";

type ProductEditProps = {
  product: MenuItem & { categoryId: string; active: boolean };
  categoryLabel: string;
};

export function ProductEditForm({ product, categoryLabel }: ProductEditProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(
    product.price != null ? String(product.price) : "",
  );
  const [sizes, setSizes] = useState<ProductSizeInput[]>(
    product.sizes?.map((s) => ({ label: s.label, price: s.price })) ?? [],
  );
  const [badge, setBadge] = useState(product.badge ?? "");
  const [active, setActive] = useState(product.active);
  const [imageUrl, setImageUrl] = useState(product.image ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const hasSizes = sizes.length > 0;

  async function handleDelete() {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente "${product.name}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      await deleteProductAction(product.id);
      router.push("/admin/productos");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar el producto.",
      );
      setDeleting(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      await updateProductAction({
        id: product.id,
        name,
        description,
        price: hasSizes ? null : Number(price) || 0,
        sizes: hasSizes ? sizes : [],
        badge: badge || null,
        active,
      });
      setOk("Guardado.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setOk(null);
    try {
      const formData = new FormData();
      formData.set("image", file);
      const url = await updateProductImageAction(product.id, formData);
      setImageUrl(url);
      setOk("Foto actualizada.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir foto.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemoveImage() {
    setUploading(true);
    setError(null);
    try {
      await removeProductImageAction(product.id);
      setImageUrl("");
      setOk("Foto eliminada.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al quitar foto.");
    } finally {
      setUploading(false);
    }
  }

  function updateSize(index: number, field: "label" | "price", value: string) {
    setSizes((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: field === "price" ? Number(value) || 0 : value,
            }
          : row,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/productos"
            className="text-xs uppercase tracking-wide text-white/45 hover:text-white"
          >
            ← Volver a productos
          </Link>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl uppercase text-white">
            {product.name}
          </h1>
          <p className="text-sm text-white/45">{categoryLabel}</p>
        </div>
        <button
          type="button"
          disabled={deleting || saving}
          onClick={handleDelete}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition"
        >
          {deleting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-xl bg-cinema-dark sm:mx-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="220px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white/30">
              Sin foto
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-neon/40 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-neon/10 disabled:opacity-50"
          >
            {uploading ? "Subiendo..." : "Cambiar foto"}
          </button>
          {imageUrl ? (
            <button
              type="button"
              disabled={uploading}
              onClick={handleRemoveImage}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/55 hover:border-white/25"
            >
              Quitar foto
            </button>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-white/50">
            Nombre
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-cinema-gray px-3 py-2.5 text-white"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-white/50">
            Descripción
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-cinema-gray px-3 py-2.5 text-white"
          />
        </label>

        {!hasSizes ? (
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-white/50">
              Precio (COP)
            </span>
            <input
              type="number"
              min={0}
              step={100}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-cinema-gray px-3 py-2.5 text-white"
            />
          </label>
        ) : (
          <div>
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/50">
              Tamaños y precios
            </span>
            <div className="space-y-2">
              {sizes.map((size, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={size.label}
                    onChange={(e) => updateSize(index, "label", e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-cinema-gray px-3 py-2 text-sm text-white"
                  />
                  <input
                    type="number"
                    min={0}
                    value={size.price}
                    onChange={(e) => updateSize(index, "price", e.target.value)}
                    className="w-28 rounded-lg border border-white/10 bg-cinema-gray px-3 py-2 text-sm text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-white/50">
            Etiqueta (opcional)
          </span>
          <input
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="Estrella, De la casa..."
            className="w-full rounded-lg border border-white/10 bg-cinema-gray px-3 py-2.5 text-white"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="rounded"
          />
          Visible en el menú público
        </label>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {ok ? <p className="text-sm text-green-400">{ok}</p> : null}

        <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
          <button
            type="submit"
            disabled={saving || deleting}
            className="w-full rounded-full border border-neon bg-neon/15 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-neon/25 disabled:opacity-50 transition"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          <button
            type="button"
            disabled={saving || deleting}
            onClick={handleDelete}
            className="w-full rounded-full border border-red-500/40 bg-red-500/10 py-3 text-xs font-bold uppercase tracking-[0.2em] text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition"
          >
            {deleting ? "Eliminando..." : "Eliminar producto"}
          </button>
        </div>
      </form>
    </div>
  );
}
