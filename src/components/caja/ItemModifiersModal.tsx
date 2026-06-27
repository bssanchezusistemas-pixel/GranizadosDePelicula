"use client";

import { useEffect, useState } from "react";
import { formatCOP } from "@/lib/currency";
import { SIN_INGREDIENTE_OPCIONES } from "@/data/caja";
import type { ItemPedidoCarrito } from "@/data/caja";
import type { MenuCategoryId } from "@/data/menu";

const PRESETS = new Set<string>(SIN_INGREDIENTE_OPCIONES);

interface PendingItem {
  productoId: string;
  nombre: string;
  precioUnitario: number;
  categoriaId?: MenuCategoryId;
}

interface ItemModifiersModalProps {
  item: PendingItem | null;
  onClose: () => void;
  onConfirm: (item: ItemPedidoCarrito) => void;
}

export function ItemModifiersModal({
  item,
  onClose,
  onConfirm,
}: ItemModifiersModalProps) {
  const [sinIngredientes, setSinIngredientes] = useState<string[]>([]);
  const [notasExtra, setNotasExtra] = useState("");
  const [libreSin, setLibreSin] = useState("");

  useEffect(() => {
    if (item) {
      setSinIngredientes([]);
      setNotasExtra("");
      setLibreSin("");
    }
  }, [item?.productoId, item?.nombre]);

  if (!item) return null;

  const personalizados = sinIngredientes.filter((s) => !PRESETS.has(s));

  function toggleSin(opcion: string) {
    setSinIngredientes((prev) =>
      prev.includes(opcion)
        ? prev.filter((x) => x !== opcion)
        : [...prev, opcion],
    );
  }

  function agregarLibreSin() {
    const texto = libreSin.trim();
    if (!texto || sinIngredientes.includes(texto)) return;
    setSinIngredientes((prev) => [...prev, texto]);
    setLibreSin("");
  }

  function quitarSin(opcion: string) {
    setSinIngredientes((prev) => prev.filter((x) => x !== opcion));
  }

  function handleConfirm() {
    if (!item) return;
    const finales = [...sinIngredientes];
    const libre = libreSin.trim();
    if (libre && !finales.includes(libre)) {
      finales.push(libre);
    }
    onConfirm({
      productoId: item.productoId,
      nombre: item.nombre,
      cantidad: 1,
      precioUnitario: item.precioUnitario,
      categoriaId: item.categoriaId,
      sinIngredientes: finales,
      notasExtra: notasExtra.trim() || undefined,
    });
    setSinIngredientes([]);
    setNotasExtra("");
    setLibreSin("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neon">
              Modificadores
            </p>
            <h3 className="font-[family-name:var(--font-display)] text-xl uppercase text-white">
              {item.nombre}
            </h3>
            <p className="mt-1 text-sm text-zinc-400">{formatCOP(item.precioUnitario)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1 text-xs font-bold text-white/50 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/50">
            Sin ingredientes
          </label>
          <div className="flex flex-wrap gap-2">
            {SIN_INGREDIENTE_OPCIONES.map((opcion) => {
              const activo = sinIngredientes.includes(opcion);
              return (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => toggleSin(opcion)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                    activo
                      ? "border-neon bg-neon/15 text-white"
                      : "border-white/10 text-white/55 hover:border-white/30"
                  }`}
                >
                  {opcion}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={libreSin}
              onChange={(e) => setLibreSin(e.target.value)}
              placeholder="Otro (ej. sin pepinillo)"
              className="flex-1 rounded-lg border border-white/10 bg-cinema-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-neon focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && agregarLibreSin()}
            />
            <button
              type="button"
              onClick={agregarLibreSin}
              disabled={!libreSin.trim()}
              className="rounded-lg border border-white/10 px-3 text-xs font-bold text-white/60 hover:border-neon hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>
          {personalizados.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {personalizados.map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => quitarSin(opcion)}
                  className="flex items-center gap-1.5 rounded-full border border-amber-600/50 bg-amber-900/25 px-3 py-1.5 text-[11px] font-bold text-amber-200"
                >
                  {opcion}
                  <span className="text-amber-400/80">×</span>
                </button>
              ))}
            </div>
          )}
          {libreSin.trim() && !personalizados.includes(libreSin.trim()) && (
            <p className="mt-1.5 text-[10px] text-white/40">
              Pulsa + o Enter para agregar, o confirma y se incluirá al carrito.
            </p>
          )}
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/50">
            Adicionales / notas
          </label>
          <textarea
            value={notasExtra}
            onChange={(e) => setNotasExtra(e.target.value)}
            rows={2}
            placeholder="Extra queso, papas aparte..."
            className="w-full resize-none rounded-lg border border-white/10 bg-cinema-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-neon focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-white/10 py-3 text-xs font-bold uppercase tracking-wide text-white/60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-full bg-neon py-3 text-xs font-black uppercase tracking-[0.15em] text-white"
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}
