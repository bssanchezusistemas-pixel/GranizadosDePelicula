"use client";

import {
  formatCOP,
  buildWhatsAppUrl,
  formatCartLineName,
  getLinePrice,
} from "@/data/menu";
import { useCart } from "@/context/CartContext";

export function CartDrawer() {
  const {
    lines,
    isOpen,
    totalItems,
    totalPrice,
    closeCart,
    addItem,
    removeItem,
    clearCart,
    buildOrderMessage,
  } = useCart();

  if (!isOpen) return null;

  const whatsappUrl = buildWhatsAppUrl(buildOrderMessage());

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar carrito"
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
        onClick={closeCart}
      />
      <aside className="fixed inset-x-0 bottom-0 z-[70] max-h-[85dvh] overflow-hidden rounded-t-3xl border border-white/10 bg-cinema-dark shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg uppercase text-white">
              Tu pedido
            </h2>
            <p className="text-xs text-white/50">
              {totalItems} {totalItems === 1 ? "producto" : "productos"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-wider text-white/70"
          >
            Cerrar
          </button>
        </div>

        <div className="max-h-[45dvh] overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/50">
              Agrega productos desde el menú para armar tu pedido.
            </p>
          ) : (
            <ul className="space-y-4">
              {lines.map((line) => {
                const unitPrice = getLinePrice(line.item, line.selectedSize);
                const displayName = formatCartLineName(
                  line.item,
                  line.selectedSize,
                );

                return (
                  <li
                    key={line.lineId}
                    className="flex items-center justify-between gap-3 border-b border-white/5 pb-4"
                  >
                    <div>
                      <p className="font-medium text-white">{displayName}</p>
                      <p className="text-xs text-white/45">
                        {formatCOP(unitPrice)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => removeItem(line.lineId)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white"
                        aria-label={`Quitar ${displayName}`}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm text-white">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          addItem(line.item, {
                            selectedSize: line.selectedSize,
                          })
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-neon text-neon"
                        aria-label={`Agregar ${displayName}`}
                      >
                        +
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm uppercase tracking-wider text-white/50">
              Total
            </span>
            <span className="font-[family-name:var(--font-display)] text-xl text-neon">
              {formatCOP(totalPrice)}
            </span>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-full bg-neon py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white neon-border"
          >
            Enviar pedido por WhatsApp
          </a>

          {lines.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="mt-3 w-full py-2 text-xs uppercase tracking-wider text-white/40 hover:text-white/70"
            >
              Vaciar pedido
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
