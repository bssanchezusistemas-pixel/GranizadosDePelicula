"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  formatCOP,
  getLinePrice,
  MENU_CATEGORIES,
  type MenuCategory,
  type MenuItem,
  type MenuItemSize,
} from "@/data/menu";
import type { ItemPedido } from "@/data/ventas";

interface ProductGridProps {
  /** Se llama cada vez que se agrega un producto (con tamaño opcional). */
  onAdd: (item: ItemPedido) => void;
}

/**
 * Grilla de productos para caja: mismas categorías y estilo visual que el
 * MenuSection de la landing, pero optimizada para toque rápido en tablet/PC.
 */
export function ProductGrid({ onAdd }: ProductGridProps) {
  const [categoriaActiva, setCategoriaActiva] = useState<string>(
    MENU_CATEGORIES[0].id,
  );

  const categorias = MENU_CATEGORIES;

  return (
    <div>
      {/* Chips de categoría — sticky debajo de la cabecera */}
      <nav
        aria-label="Categorías"
        className="sticky top-[61px] z-30 -mx-4 mb-6 border-b border-white/5 bg-cinema-black/95 px-4 py-3 backdrop-blur-md sm:top-[65px]"
      >
        <div className="flex flex-wrap gap-2">
          {categorias.map((cat) => {
            const activa = categoriaActiva === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaActiva(cat.id)}
                aria-current={activa ? "true" : undefined}
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
        {categorias
          .filter((cat) => cat.id === categoriaActiva)
          .map((cat) => (
            <CategoryBlock key={cat.id} category={cat} onAdd={onAdd} />
          ))}
      </div>
    </div>
  );
}

function CategoryBlock({
  category,
  onAdd,
}: {
  category: MenuCategory;
  onAdd: (item: ItemPedido) => void;
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
        <span
          className="shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          {category.items.length} platos
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {category.items.map((item) => (
          <ProductCard
            key={item.id}
            item={item}
            accentColor={accent}
            onAdd={onAdd}
          />
        ))}
      </div>
    </section>
  );
}

function ProductCard({
  item,
  accentColor,
  onAdd,
}: {
  item: MenuItem;
  accentColor: string;
  onAdd: (item: ItemPedido) => void;
}) {
  const [selectedSize, setSelectedSize] = useState<MenuItemSize | undefined>(
    item.sizes?.[0],
  );

  const displayPrice = getLinePrice(item, selectedSize);
  const hasSizes = Boolean(item.sizes?.length);

  function handleAdd() {
    if (hasSizes && !selectedSize) return;
    const nombre = selectedSize
      ? `${item.name} (${selectedSize.label})`
      : item.name;
    onAdd({
      productoId: item.id,
      nombre,
      cantidad: 1,
      precioUnitario: displayPrice,
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
            className="shrink-0 -rotate-1 rounded-md px-2.5 py-1 font-[family-name:var(--font-display)] text-sm text-white"
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
                  aria-pressed={isActive}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                    isActive
                      ? "border-transparent text-white"
                      : "border-white/15 text-white/55 hover:border-white/30"
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: accentColor,
                          borderColor: accentColor,
                        }
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
          className="mt-auto w-full rounded-full py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          style={{ borderColor: `${accentColor}66`, border: `1px solid ${accentColor}66` }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${accentColor}22`;
            e.currentTarget.style.borderColor = accentColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = `${accentColor}66`;
          }}
        >
          + Agregar
        </button>
      </div>
    </article>
  );
}
