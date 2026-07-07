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

interface FlatProduct {
  item: MenuItem;
  categoriaId: MenuCategoryId;
  accentColor: string;
  categoryLabel: string;
}

interface ProductGridProps {
  onAdd: (item: ItemPedidoCarrito) => void;
}

export function ProductGrid({ onAdd }: ProductGridProps) {
  const [categoriaActiva, setCategoriaActiva] = useState<string>(
    MENU_CATEGORIES[0].id,
  );
  const [pending, setPending] = useState<PendingProduct | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const todosLosProductos = useMemo<FlatProduct[]>(
    () =>
      MENU_CATEGORIES.flatMap((cat) =>
        cat.items
          .filter((item) => !item.publicOnly)
          .map((item) => ({
            item,
            categoriaId: cat.id,
            accentColor: cat.accentColor ?? "#ff0033",
            categoryLabel: cat.label,
          })),
      ),
    [],
  );

  const resultadosBusqueda = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return todosLosProductos.filter(
      (p) =>
        p.item.name.toLowerCase().includes(q) ||
        p.item.description.toLowerCase().includes(q),
    );
  }, [busqueda, todosLosProductos]);

  const hayBusqueda = busqueda.trim().length > 0;

  return (
    <div>
      <nav
        aria-label="Categorías"
        className="sticky top-[61px] z-30 -mx-4 mb-4 border-b border-white/5 bg-cinema-black/95 backdrop-blur-md sm:top-[65px]"
      >
        <div className="px-4 pt-2.5 sm:pt-3">
          <div className="relative mb-2.5">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full rounded-full border border-white/10 bg-cinema-gray py-2.5 pl-4 pr-10 text-sm text-white placeholder:text-white/35 focus:border-neon focus:outline-none"
            />
            {hayBusqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-white/40 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        </div>
        {!hayBusqueda && (
          <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-2.5 sm:flex-wrap sm:overflow-visible sm:pb-3">
            {MENU_CATEGORIES.map((cat) => {
              const activa = categoriaActiva === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaActiva(cat.id)}
                  aria-current={activa ? "true" : undefined}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[10px] uppercase tracking-[0.15em] transition sm:px-5 sm:py-2.5 sm:text-[11px] ${
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
        )}
      </nav>

      <div className="space-y-10">
        {hayBusqueda ? (
          <section>
            <div className="mb-5 border-b border-white/10 pb-3">
              <h3 className="font-[family-name:var(--font-display)] text-xl uppercase text-white sm:text-2xl">
                Resultados
              </h3>
              <p className="mt-0.5 text-xs text-white/45">
                {resultadosBusqueda.length === 0
                  ? "Sin coincidencias"
                  : `${resultadosBusqueda.length} producto${resultadosBusqueda.length === 1 ? "" : "s"}`}
              </p>
            </div>
            {resultadosBusqueda.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {resultadosBusqueda.map((p) => (
                  <ProductCard
                    key={p.item.id}
                    item={p.item}
                    categoriaId={p.categoriaId}
                    accentColor={p.accentColor}
                    categoryLabel={p.categoryLabel}
                    onRequestAdd={setPending}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">
                Prueba con otro nombre o descripción.
              </p>
            )}
          </section>
        ) : (
          MENU_CATEGORIES.filter((cat) => cat.id === categoriaActiva).map(
            (cat) => (
              <CategoryBlock
                key={cat.id}
                category={{
                  ...cat,
                  items: cat.items.filter((item) => !item.publicOnly),
                }}
                onRequestAdd={setPending}
              />
            ),
          )
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
  categoryLabel,
  onRequestAdd,
}: {
  item: MenuItem;
  categoriaId: MenuCategoryId;
  accentColor: string;
  categoryLabel?: string;
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
          <div>
            {categoryLabel && (
              <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-white/35">
                {categoryLabel}
              </p>
            )}
            <h4 className="font-[family-name:var(--font-display)] text-base uppercase leading-tight text-white">
              {item.name}
            </h4>
          </div>
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
