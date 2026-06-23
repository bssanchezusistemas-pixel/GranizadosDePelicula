"use client";

import { formatCOP } from "@/lib/currency";
import type { ItemPedido } from "@/data/ventas";

interface CartPanelProps {
  items: ItemPedido[];
  onIncrementar: (productoId: string, nombre: string) => void;
  onDecrementar: (productoId: string, nombre: string) => void;
  onQuitar: (productoId: string, nombre: string) => void;
  onVaciar: () => void;
  /** Clave compuesta productoId+nombre para diferenciar tamaños. */
  total: number;
}

/** Clave de línea que distingue producto + tamaño (mismo nombre puede tener otro precio). */
function lineaKey(item: ItemPedido): string {
  return `${item.productoId}::${item.nombre}`;
}

export function CartPanel({
  items,
  onIncrementar,
  onDecrementar,
  onQuitar,
  onVaciar,
  total,
}: CartPanelProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-cinema-gray">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neon">
            Pedido actual
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-lg uppercase text-white">
            Carrito
          </h2>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onVaciar}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white/50 transition hover:border-red-500/50 hover:text-red-300"
          >
            Vaciar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center px-6 text-center">
            <span className="mb-2 text-3xl opacity-30">🛒</span>
            <p className="text-sm font-bold uppercase tracking-wide text-white/40">
              Carrito vacío
            </p>
            <p className="mt-1 text-xs text-white/30">
              Toca un producto para agregarlo.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <CartLine
                key={lineaKey(item)}
                item={item}
                onIncrementar={() =>
                  onIncrementar(item.productoId, item.nombre)
                }
                onDecrementar={() =>
                  onDecrementar(item.productoId, item.nombre)
                }
                onQuitar={() => onQuitar(item.productoId, item.nombre)}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-white/8 bg-cinema-black/40 px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
            Total
          </span>
          <span className="font-[family-name:var(--font-display)] text-2xl text-white">
            {formatCOP(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CartLine({
  item,
  onIncrementar,
  onDecrementar,
  onQuitar,
}: {
  item: ItemPedido;
  onIncrementar: () => void;
  onDecrementar: () => void;
  onQuitar: () => void;
}) {
  const subtotal = item.precioUnitario * item.cantidad;

  return (
    <li className="rounded-xl border border-white/8 bg-cinema-black/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold uppercase leading-tight text-white">
            {item.nombre}
          </p>
          <p className="mt-0.5 text-[11px] text-white/40">
            {formatCOP(item.precioUnitario)} c/u
          </p>
        </div>
        <p className="shrink-0 text-sm font-black text-white">
          {formatCOP(subtotal)}
        </p>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDecrementar}
            aria-label={`Quitar una unidad de ${item.nombre}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-cinema-gray text-lg font-bold text-white/70 transition hover:border-white/30 hover:text-white"
          >
            −
          </button>
          <span className="w-9 text-center text-sm font-black text-white">
            {item.cantidad}
          </span>
          <button
            type="button"
            onClick={onIncrementar}
            aria-label={`Agregar una unidad de ${item.nombre}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neon/40 bg-neon/10 text-lg font-bold text-neon transition hover:border-neon hover:bg-neon/20"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={onQuitar}
          className="rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white/30 transition hover:text-red-400"
        >
          Quitar
        </button>
      </div>
    </li>
  );
}
