"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  formatCOP,
  getLinePrice,
  MENU_CATEGORIES,
  type MenuCategory,
  type MenuItem,
  type MenuItemSize,
  type MenuCategoryId,
} from "@/data/menu";
import type { ItemPedidoCarrito } from "@/data/caja";
import { ItemModifiersModal } from "@/components/caja/ItemModifiersModal";

interface PendingProduct {
  productoId: string;
  nombre: string;
  precioUnitario: number;
  categoriaId?: MenuCategoryId;
}

interface ProductGridProps {
  onAdd: (item: ItemPedidoCarrito) => void;
}

export function ProductGrid({ onAdd }: ProductGridProps) {
  const [categoriaActiva, setCategoriaActiva] = useState<string>(
    MENU_CATEGORIES[0].id,
  );
  const [pending, setPending] = useState<PendingProduct | null>(null);

  return (
    <div>
      <nav
        aria-label="Categorías"
        className="sticky top-[61px] z-30 -mx-4 mb-6 border-b border-white/5 bg-cinema-black/95 px-4 py-3 backdrop-blur-md sm:top-[65px]"
      >
        <div className="flex flex-wrap gap-2">
          {MENU_CATEGORIES.map((cat) => {
            const activa = categoriaActiva === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaActiva(cat.id)}
                className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition ${
                  activa
                    ? "border-neon bg-neon/15 text-white neon-border"
                    : "border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="space-y-10">
        {MENU_CATEGORIES.filter((cat) => cat.id === categoriaActiva).map(
          (cat) => (
            <CategoryBlock
              key={cat.id}
              category={cat}
              onRequestAdd={setPending}
            />
          ),
        )}
      </div>

      <ItemModifiersModal
        item={pending}
        onClose={() => setPending(null)}
        onConfirm={onAdd}
      />
    </div>
  );
}

function CategoryBlock({
  category,
  onRequestAdd,
}: {
  category: MenuCategory;
  onRequestAdd: (item: PendingProduct) => void;
}) {
  const accent = category.accentColor ?? "#ff0033";

  return (
    <section>
      <div
        className="mb-5 flex items-end justify-between gap-4 border-b pb-3"
        style={{ borderColor: `${accent}33` }}
      >
        <div>
          <h3
            className="font-[family-name:var(--font-display)] text-xl uppercase sm:text-2xl"
            style={{ color: category.accentColor ? accent : "#fff" }}
          >
            {category.label}
          </h3>
          <p className="mt-0.5 text-xs text-white/45">{category.tagline}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {category.items.map((item) => (
          <ProductCard
            key={item.id}
            item={item}
            categoriaId={category.id}
            accentColor={accent}
            onRequestAdd={onRequestAdd}
          />
        ))}
      </div>
    </section>
  );
}

function ProductCard({
  item,
  categoriaId,
  accentColor,
  onRequestAdd,
}: {
  item: MenuItem;
  categoriaId: MenuCategoryId;
  accentColor: string;
  onRequestAdd: (item: PendingProduct) => void;
}) {
  const [selectedSize, setSelectedSize] = useState<MenuItemSize | undefined>(
    item.sizes?.[0],
  );

  const displayPrice = useMemo(
    () => getLinePrice(item, selectedSize),
    [item, selectedSize],
  );
  const hasSizes = Boolean(item.sizes?.length);

  function handleAdd() {
    if (hasSizes && !selectedSize) return;
    const nombre = selectedSize
      ? `${item.name} (${selectedSize.label})`
      : item.name;
    onRequestAdd({
      productoId: item.id,
      nombre,
      precioUnitario: displayPrice,
      categoriaId,
    });
  }

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-cinema-gray transition hover:border-white/20"
      style={{ "--item-accent": accentColor } as CSSProperties}
    >
      <div
        className="h-1.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}66)`,
        }}
      />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h4 className="font-[family-name:var(--font-display)] text-base uppercase leading-tight text-white">
            {item.name}
          </h4>
          <span
            className="shrink-0 rounded-md px-2.5 py-1 font-[family-name:var(--font-display)] text-sm text-white"
            style={{ backgroundColor: accentColor }}
          >
            {formatCOP(displayPrice)}
          </span>
        </div>

        {hasSizes && item.sizes && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {item.sizes.map((size) => {
              const isActive = selectedSize?.label === size.label;
              return (
                <button
                  key={size.label}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${
                    isActive
                      ? "border-transparent text-white"
                      : "border-white/15 text-white/55"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: accentColor, borderColor: accentColor }
                      : undefined
                  }
                >
                  {size.label}
                </button>
              );
            })}
          </div>
        )}

        <p className="mb-4 flex-1 text-xs leading-relaxed text-white/45">
          {item.description}
        </p>

        <button
          type="button"
          onClick={handleAdd}
          disabled={hasSizes && !selectedSize}
          className="mt-auto w-full rounded-full border py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white disabled:opacity-40"
          style={{ borderColor: `${accentColor}66` }}
        >
          + Agregar
        </button>
      </div>
    </article>
  );
}
