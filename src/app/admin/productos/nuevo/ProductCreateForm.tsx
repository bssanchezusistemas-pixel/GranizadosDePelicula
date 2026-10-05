"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MenuCategory } from "@/data/menu";
import {
  createProductAction,
  uploadProductImageFile,
  type ProductSizeInput,
} from "@/app/admin/productos/actions";

type SizeFormRow = {
  label: string;
  price: string | number;
};

type ProductCreateProps = {
  categories: MenuCategory[];
};

export function ProductCreateForm({ categories }: ProductCreateProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [categoryId, setCategoryId] = useState<string>(
    categories[0]?.id ?? "",
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceMode, setPriceMode] = useState<"single" | "sizes">("single");
  const [price, setPrice] = useState("");
  const [sizes, setSizes] = useState<SizeFormRow[]>([
    { label: "Pequeño", price: "" },
    { label: "Grande", price: "" },
  ]);
  const [badge, setBadge] = useState("");
  const [active, setActive] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveFile() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function addSizeRow() {
    setSizes((prev) => [...prev, { label: "", price: "" }]);
  }

  function removeSizeRow(index: number) {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSize(index: number, field: "label" | "price", value: string) {
    setSizes((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("El nombre del producto es obligatorio.");
      return;
    }

    if (!categoryId) {
      setError("Debes seleccionar una categoría.");
      return;
    }

    let validSizes: ProductSizeInput[] = [];

    if (priceMode === "sizes") {
      validSizes = sizes
        .map((s) => ({ label: s.label.trim(), price: Number(s.price) || 0 }))
        .filter((s) => s.label.length > 0);

      if (validSizes.length === 0) {
        setError("Debes agregar al menos un tamaño con su nombre.");
        return;
      }

      const labelSet = new Set<string>();
      for (const s of validSizes) {
        const lower = s.label.toLowerCase();
        if (labelSet.has(lower)) {
          setError(
            `El tamaño "${s.label}" está duplicado. Cada tamaño debe tener un nombre único.`,
          );
          return;
        }
        labelSet.add(lower);

        if (s.price <= 0) {
          setError(`El tamaño "${s.label}" debe tener un precio mayor a 0.`);
          return;
        }
      }
    } else {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        setError("Debes ingresar un precio válido mayor a 0.");
        return;
      }
    }

    setSaving(true);
    try {
      let uploadedImageUrl: string | null = null;
      if (imageFile) {
        const formData = new FormData();
        formData.set("image", imageFile);
        uploadedImageUrl = await uploadProductImageFile(formData);
      }

      await createProductAction({
        categoryId,
        name: trimmedName,
        description,
        price: priceMode === "single" ? Number(price) : null,
        sizes: priceMode === "sizes" ? validSizes : [],
        badge: badge || null,
        active,
        imageUrl: uploadedImageUrl,
      });

      setSuccess("Producto creado exitosamente.");
      router.push("/admin/productos");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear el producto.",
      );
      setSaving(false);
    }
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
            Agregar Nuevo Producto
          </h1>
          <p className="mt-0.5 text-sm text-white/45">
            Registra un nuevo ítem en el menú público y en caja.
          </p>
        </div>
      </div>

      {/* Selector de foto */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[200px] overflow-hidden rounded-xl bg-cinema-dark sm:mx-0 border border-white/10">
          {imagePreview ? (
            <Image
              src={imagePreview}
              alt="Vista previa"
              fill
              className="object-cover"
              sizes="200px"
              unoptimized
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center text-xs text-white/35">
              <svg
                className="mb-2 h-8 w-8 text-white/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Sin foto seleccionada</span>
              <span className="text-[10px] text-white/25 mt-0.5">
                (Opcional)
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-neon/40 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-neon/10 transition"
          >
            {imagePreview ? "Cambiar foto" : "Subir foto"}
          </button>
          {imagePreview ? (
            <button
              type="button"
              onClick={handleRemoveFile}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/55 hover:border-white/25 transition"
            >
              Quitar foto
            </button>
          ) : null}
          <p className="text-[11px] text-white/35">
            Formatos recomendados: WebP, PNG o JPG (máx. 5 MB).
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Categoría */}
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-white/50">
            Categoría <span className="text-neon">*</span>
          </span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-cinema-gray px-3 py-2.5 text-white focus:border-neon/50 focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-cinema-black">
                {cat.label}
              </option>
            ))}
          </select>
        </label>

        {/* Nombre */}
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-white/50">
            Nombre del producto <span className="text-neon">*</span>
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Megacholado Especial, Granizado de Café..."
            required
            className="w-full rounded-lg border border-white/10 bg-cinema-gray px-3 py-2.5 text-white placeholder:text-white/30 focus:border-neon/50 focus:outline-none"
          />
        </label>

        {/* Descripción */}
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-white/50">
            Descripción
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Ingredientes, preparación o detalles de presentación..."
            className="w-full rounded-lg border border-white/10 bg-cinema-gray px-3 py-2.5 text-white placeholder:text-white/30 focus:border-neon/50 focus:outline-none"
          />
        </label>

        {/* Selector de modo de precio */}
        <div>
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/50">
            Esquema de precios <span className="text-neon">*</span>
          </span>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-cinema-dark p-1.5">
            <button
              type="button"
              onClick={() => {
                setPriceMode("single");
                if (!price && sizes.length > 0 && Number(sizes[0].price) > 0) {
                  setPrice(String(sizes[0].price));
                }
              }}
              className={`rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                priceMode === "single"
                  ? "bg-neon text-cinema-black shadow-md shadow-neon/20"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              Precio único
            </button>
            <button
              type="button"
              onClick={() => {
                setPriceMode("sizes");
                if (sizes.length === 0) {
                  setSizes([
                    { label: "Pequeño", price: price || "" },
                    { label: "Grande", price: price ? String(Number(price) + 2000) : "" },
                  ]);
                } else if (price && sizes.every((s) => s.price === "" || s.price === 0)) {
                  setSizes([
                    { label: sizes[0]?.label || "Pequeño", price: price },
                    { label: sizes[1]?.label || "Grande", price: String(Number(price) + 2000) },
                    ...sizes.slice(2),
                  ]);
                }
              }}
              className={`rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                priceMode === "sizes"
                  ? "bg-neon text-cinema-black shadow-md shadow-neon/20"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              Varios tamaños
            </button>
          </div>
        </div>

        {/* Modo Precio Único */}
        {priceMode === "single" ? (
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-white/50">
              Precio (COP) <span className="text-neon">*</span>
            </span>
            <input
              type="number"
              min={0}
              step={100}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ej: 12000"
              required={priceMode === "single"}
              className="w-full rounded-lg border border-white/10 bg-cinema-gray px-3 py-2.5 text-white placeholder:text-white/30 focus:border-neon/50 focus:outline-none"
            />
          </label>
        ) : (
          /* Modo Varios Tamaños */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wide text-white/50">
                  Tamaños y precios <span className="text-neon">*</span>
                </span>
                <span className="text-[11px] text-white/40">
                  Agrega los tamaños disponibles con su respectivo precio.
                </span>
              </div>
              <button
                type="button"
                onClick={addSizeRow}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neon/40 bg-neon/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neon hover:bg-neon/25 transition"
              >
                <span>+</span> Agregar tamaño
              </button>
            </div>

            {sizes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 p-5 text-center">
                <p className="text-xs text-white/40 mb-2">
                  No has agregado tamaños todavía.
                </p>
                <button
                  type="button"
                  onClick={addSizeRow}
                  className="rounded-lg bg-neon/15 px-3 py-1.5 text-xs font-semibold text-neon hover:bg-neon/25"
                >
                  + Agregar primer tamaño
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {sizes.map((size, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ej: Pequeño, Mediano, 12 oz..."
                      value={size.label}
                      onChange={(e) =>
                        updateSize(index, "label", e.target.value)
                      }
                      required={priceMode === "sizes"}
                      className="flex-1 rounded-lg border border-white/10 bg-cinema-gray px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-neon/50 focus:outline-none"
                    />
                    <div className="relative w-32 sm:w-40">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/40 font-mono">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        placeholder="0"
                        value={size.price}
                        onChange={(e) =>
                          updateSize(index, "price", e.target.value)
                        }
                        required={priceMode === "sizes"}
                        className="w-full rounded-lg border border-white/10 bg-cinema-gray pl-7 pr-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-neon/50 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      title="Eliminar este tamaño"
                      onClick={() => removeSizeRow(index)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Etiqueta */}
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-white/50">
            Etiqueta destacada (opcional)
          </span>
          <input
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="Estrella, Popular, Recomendado, De la casa..."
            className="w-full rounded-lg border border-white/10 bg-cinema-gray px-3 py-2.5 text-white placeholder:text-white/30 focus:border-neon/50 focus:outline-none"
          />
        </label>

        {/* Visibilidad */}
        <label className="flex items-center gap-2 text-sm text-white/70 pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-cinema-gray text-neon focus:ring-neon/30"
          />
          Visible en el menú público
        </label>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
            {success}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 pt-4 border-t border-white/10 sm:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-full border border-neon bg-neon/15 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-neon/25 disabled:opacity-50 transition shadow-lg shadow-neon/10"
          >
            {saving ? "Creando producto..." : "Crear Producto"}
          </button>
          <Link
            href="/admin/productos"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-cinema-gray py-3 px-6 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:border-white/25 transition"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
