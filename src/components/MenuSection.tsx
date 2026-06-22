"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  formatCOP,
  getLinePrice,
  MENU_CATEGORIES,
  type MenuCategory,
  type MenuCategoryId,
  type MenuItem,
  type MenuItemSize,
} from "@/data/menu";
import { useCart } from "@/context/CartContext";

const NAV_OFFSET = 112;

export function MenuSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const categoryRefs = useRef<Partial<Record<MenuCategoryId, HTMLElement>>>({});
  const [activeCategory, setActiveCategory] = useState<MenuCategoryId>(
    MENU_CATEGORIES[0].id,
  );
  const { addItem } = useCart();

  const scrollToCategory = useCallback((id: MenuCategoryId) => {
    const el = categoryRefs.current[id];
    if (!el) return;

    const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveCategory(id);
  }, []);

  useEffect(() => {
    const setupObserver = () => {
      const section = sectionRef.current;
      if (!section) return;

      const elements = section.querySelectorAll<HTMLElement>("[id^='menu-']");
      if (elements.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

          if (visible[0]?.target.id) {
            const id = visible[0].target.id.replace("menu-", "") as MenuCategoryId;
            setActiveCategory(id);
          }
        },
        {
          rootMargin: `-${NAV_OFFSET}px 0px -55% 0px`,
          threshold: [0, 0.15, 0.35, 0.5],
        },
      );

      elements.forEach((el) => observer.observe(el));
      return observer;
    };

    const observer = setupObserver();
    return () => observer?.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="menu"
      className="relative bg-cinema-dark py-20"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/40 to-transparent" />

      <div className="mx-auto max-w-6xl px-4">
        <div className="menu-intro mb-8 animate-[fadeUp_0.6s_ease-out_both]">
          <p className="text-[11px] uppercase tracking-[0.35em] text-neon">
            Cartelera del sabor
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,7vw,3.5rem)] uppercase leading-none text-white">
            Nuestro menú
          </h2>
          <p className="mt-4 max-w-lg text-sm text-white/55">
            Desliza por categorías o salta directo con los filtros. Todos los
            precios en COP.
          </p>
        </div>

        <nav
          aria-label="Categorías del menú"
          className="sticky top-[68px] z-40 -mx-4 mb-10 border-b border-white/5 bg-cinema-dark/95 px-4 py-3 backdrop-blur-md sm:top-[72px]"
        >
          <div className="flex flex-wrap gap-2">
            {MENU_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => scrollToCategory(cat.id)}
                aria-current={activeCategory === cat.id ? "true" : undefined}
                className={`rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.15em] transition sm:px-5 sm:py-2.5 sm:text-[11px] ${
                  activeCategory === cat.id
                    ? "border-neon bg-neon/15 text-white neon-border"
                    : "border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="space-y-16 sm:space-y-20">
          {MENU_CATEGORIES.map((category, index) => (
            <MenuCategoryBlock
              key={category.id}
              category={category}
              index={index}
              ref={(el) => {
                if (el) categoryRefs.current[category.id] = el;
              }}
              onAddItem={addItem}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function MenuCategoryBlock({
  category,
  index,
  ref,
  onAddItem,
}: {
  category: MenuCategory;
  index: number;
  ref: (el: HTMLElement | null) => void;
  onAddItem: ReturnType<typeof useCart>["addItem"];
}) {
  const accent = category.accentColor ?? "#ff0033";

  return (
    <div
      id={`menu-${category.id}`}
      ref={ref}
      className="scroll-mt-28 sm:scroll-mt-32"
    >
      <div
        className="mb-6 flex items-end justify-between gap-4 border-b pb-4"
        style={{ borderColor: `${accent}33` }}
      >
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.3em]"
            style={{ color: `${accent}99` }}
          >
            Sección {String(index + 1).padStart(2, "0")}
          </p>
          <h3
            className="mt-1 font-[family-name:var(--font-display)] text-2xl uppercase sm:text-3xl"
            style={{ color: category.accentColor ? accent : "#fff" }}
          >
            {category.label}
          </h3>
          <p className="mt-1 text-sm text-white/50">{category.tagline}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest"
          style={{
            backgroundColor: `${accent}18`,
            color: accent,
          }}
        >
          {category.items.length} platos
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {category.items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            accentColor={accent}
            onAdd={(selectedSize) => onAddItem(item, { selectedSize })}
          />
        ))}
      </div>
    </div>
  );
}

function MenuItemCard({
  item,
  accentColor,
  onAdd,
}: {
  item: MenuItem;
  accentColor: string;
  onAdd: (selectedSize?: MenuItemSize) => void;
}) {
  const [selectedSize, setSelectedSize] = useState<MenuItemSize | undefined>(
    item.sizes?.[0],
  );

  const displayPrice = getLinePrice(item, selectedSize);
  const hasSizes = Boolean(item.sizes?.length);

  return (
    <article
      className="menu-item-card group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-cinema-gray transition hover:border-white/20"
      style={
        {
          "--item-accent": accentColor,
        } as CSSProperties
      }
    >
      <div
        className="h-1.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}66)`,
        }}
      />

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-[family-name:var(--font-display)] text-base uppercase leading-tight text-white sm:text-lg">
                {item.name}
              </h4>
              {item.badge && (
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {item.badge}
                </span>
              )}
            </div>
          </div>
          <span
            className="shrink-0 -rotate-2 rounded-md px-2.5 py-1 font-[family-name:var(--font-display)] text-sm text-white shadow-md"
            style={{ backgroundColor: accentColor }}
          >
            {formatCOP(displayPrice)}
          </span>
        </div>

        <p className="mb-4 flex-1 text-xs leading-relaxed text-white/55">
          {item.description}
        </p>

        {hasSizes && item.sizes && (
          <div className="mb-4">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
              Tamaño
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.sizes.map((size) => {
                const isActive = selectedSize?.label === size.label;
                return (
                  <button
                    key={size.label}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={isActive}
                    className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wide transition ${
                      isActive
                        ? "border-transparent text-white"
                        : "border-white/15 text-white/55 hover:border-white/30"
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
          </div>
        )}

        <button
          type="button"
          onClick={() => onAdd(selectedSize)}
          disabled={hasSizes && !selectedSize}
          className="mt-auto w-full rounded-full border py-2.5 text-[11px] uppercase tracking-[0.2em] text-white transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            borderColor: `${accentColor}66`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${accentColor}22`;
            e.currentTarget.style.borderColor = accentColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = `${accentColor}66`;
          }}
        >
          Agregar al pedido
        </button>
      </div>
    </article>
  );
}
