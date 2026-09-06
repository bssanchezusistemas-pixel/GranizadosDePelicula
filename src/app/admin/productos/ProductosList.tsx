"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatCOP, getLinePrice, type MenuCategory } from "@/data/menu";
import { deleteProductAction } from "@/app/admin/productos/actions";

export function ProductosList({ categories }: { categories: MenuCategory[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente "${name}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteProductAction(id);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar producto.");
    } finally {
      setDeletingId(null);
    }
  }

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
                    <div className="flex items-start justify-between gap-1">
                      <p className="truncate font-bold text-white">{item.name}</p>
                      <button
                        type="button"
                        title="Eliminar producto"
                        disabled={deletingId === item.id}
                        onClick={(e) => handleDelete(e, item.id, item.name)}
                        className="shrink-0 rounded p-1 text-white/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50 transition"
                      >
                        {deletingId === item.id ? (
                          <span className="text-[10px] text-red-400">...</span>
                        ) : (
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
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
