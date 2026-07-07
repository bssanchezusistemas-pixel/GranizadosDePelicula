"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCOP, getLinePrice, type MenuCategory } from "@/data/menu";

export function ProductosList({ categories }: { categories: MenuCategory[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase text-white">
          Productos
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Edita nombre, descripción, precio y foto. Los cambios se ven en el
          sitio web al guardar.
        </p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar producto..."
        className="w-full rounded-xl border border-white/10 bg-cinema-gray px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-neon/50 focus:outline-none"
      />

      <div className="space-y-8">
        {filtered.map((category) => (
          <section key={category.id}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-neon">
              {category.label}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {category.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/productos/${item.id}`}
                  className="flex gap-3 rounded-xl border border-white/10 bg-cinema-gray p-3 transition hover:border-white/25"
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-cinema-dark">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-white/30">
                        Sin foto
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">{item.name}</p>
                    <p className="mt-0.5 text-sm text-neon">
                      {item.sizes?.length
                        ? `${item.sizes.length} tamaños`
                        : formatCOP(getLinePrice(item))}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-white/45">
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
