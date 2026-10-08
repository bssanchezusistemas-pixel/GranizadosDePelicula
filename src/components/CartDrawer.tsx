"use client";

import {
  formatCOP,
  buildWhatsAppUrl,
  formatCartLineName,
  getLinePrice,
} from "@/data/menu";
import { CartCheckoutForm } from "@/components/CartCheckoutForm";
import { useCart } from "@/context/CartContext";

export function CartDrawer() {
  const {
    lines,
    isOpen,
    totalItems,
    subtotalPrice,
    costoDomicilio,
    totalPrice,
    tipoEntrega,
    closeCart,
    addItem,
    removeItem,
    clearCart,
    isCheckoutValid,
    buildOrderMessage,
  } = useCart();

  if (!isOpen) return null;

  const puedeEnviar = isCheckoutValid();
  const whatsappUrl = puedeEnviar
    ? buildWhatsAppUrl(buildOrderMessage())
    : undefined;

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar carrito"
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
        onClick={closeCart}
      />
      <aside className="cart-drawer-enter fixed inset-x-0 bottom-0 z-[70] max-h-[90dvh] overflow-hidden rounded-t-3xl border border-white/10 bg-cinema-dark shadow-2xl">
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

        <div className="max-h-[50dvh] overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/50">
              Agrega productos desde el menú para armar tu pedido.
            </p>
          ) : (
            <>
              <ul className="space-y-4">
                {lines.map((line) => {
                  const unitPrice = getLinePrice(
                    line.item,
                    line.selectedSize,
                    line.adiciones,
                  );
                  const displayName = formatCartLineName(
                    line.item,
                    line.selectedSize,
                  );

                  return (
                    <li
                      key={line.lineId}
                      className="flex items-start justify-between gap-3 border-b border-white/5 pb-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white break-words">{displayName}</p>
                        <p className="text-xs text-white/45">
                          {formatCOP(unitPrice)} c/u
                        </p>

                        {((line.adiciones && line.adiciones.length > 0) ||
                          (line.exclusiones && line.exclusiones.length > 0) ||
                          (line.notas && line.notas.trim().length > 0)) && (
                          <div className="mt-2 space-y-1 rounded-xl border border-white/5 bg-white/[0.03] p-2.5 text-xs">
                            {line.adiciones && line.adiciones.length > 0 && (
                              <p className="text-white/80 break-words">
                                <span className="font-semibold text-neon">+ Adiciones: </span>
                                {line.adiciones
                                  .map((a) =>
                                    a.price > 0
                                      ? `${a.name} (+${formatCOP(a.price)})`
                                      : a.name,
                                  )
                                  .join(", ")}
                              </p>
                            )}
                            {line.exclusiones && line.exclusiones.length > 0 && (
                              <p className="text-white/80 break-words">
                                <span className="font-semibold text-amber-400">Sin: </span>
                                {line.exclusiones.join(", ")}
                              </p>
                            )}
                            {line.notas && line.notas.trim().length > 0 && (
                              <p className="text-white/70 italic break-words whitespace-pre-line">
                                <span className="font-semibold not-italic text-white/80">Nota: </span>
                                &ldquo;{line.notas.trim().replace(/^["'“”«»]+|["'“”«»]+$/g, "").trim()}&rdquo;
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => removeItem(line.lineId)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-white/40"
                          aria-label={`Quitar ${displayName}`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-white">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            addItem(line.item, {
                              selectedSize: line.selectedSize,
                              adiciones: line.adiciones,
                              exclusiones: line.exclusiones,
                              notas: line.notas,
                            })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-neon text-neon transition hover:bg-neon hover:text-white"
                          aria-label={`Agregar ${displayName}`}
                        >
                          +
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <CartCheckoutForm />
            </>
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-5">
          {tipoEntrega === "domicilio" && lines.length > 0 && (
            <div className="mb-3 space-y-1.5 rounded-xl border border-white/8 bg-cinema-black/40 p-3 text-xs text-white/60">
              <div className="flex items-center justify-between">
                <span>Subtotal productos:</span>
                <span className="text-white/80">{formatCOP(subtotalPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-neon">
                <span>Adicional domicilio:</span>
                <span className="font-bold">+{formatCOP(costoDomicilio)}</span>
              </div>
            </div>
          )}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm uppercase tracking-wider text-white/50">
              Total
            </span>
            <span className="font-[family-name:var(--font-display)] text-xl text-neon">
              {formatCOP(totalPrice)}
            </span>
          </div>

          {puedeEnviar && whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded-full bg-neon py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white neon-border"
            >
              Enviar pedido por WhatsApp
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center rounded-full bg-neon/40 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white/60"
            >
              Completa los datos de entrega
            </button>
          )}

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
