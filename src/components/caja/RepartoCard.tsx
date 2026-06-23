"use client";

import { formatCOP } from "@/lib/currency";
import { formatHoraBogota } from "@/lib/dates";
import {
  FORMA_PAGO_LABEL,
  resumirItems,
  type Pedido,
} from "@/data/ventas";

interface RepartoCardProps {
  pedido: Pedido;
  onAceptar: (pedidoId: string) => void;
}

/**
 * Tarjeta de un pedido domiciliario tal como la ve el repartidor en su
 * tablero. Muestra todo lo que necesita para salir a entregar: dirección,
 * qué lleva, si está pagado o cuánto cobra y cuánto devuelve.
 */
export function RepartoCard({ pedido, onAceptar }: RepartoCardProps) {
  const pagado = pedido.formaPago === "transferencia";
  const aceptado = pedido.estadoDomicilio === "aceptado";

  const devuelta =
    pedido.formaPago === "efectivo" && pedido.pagaCon != null
      ? pedido.pagaCon - pedido.total
      : null;

  return (
    <article
      className={`overflow-hidden rounded-xl border bg-cinema-gray transition ${
        aceptado
          ? "border-emerald-700/40"
          : "border-amber-600/50 neon-border"
      }`}
    >
      {/* Cabecera: número + estado */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
        <span className="font-[family-name:var(--font-display)] text-base text-white">
          #{pedido.numeroPedido}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            aceptado
              ? "bg-emerald-900/30 text-emerald-400"
              : "bg-amber-900/30 text-amber-400"
          }`}
        >
          {aceptado ? "● En ruta" : "● Pendiente"}
        </span>
      </div>

      <div className="space-y-3 px-4 py-3.5">
        {/* Dirección */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neon">
            Entregar en
          </p>
          <p className="mt-0.5 text-sm font-bold leading-snug text-white">
            {pedido.direccion || "—"}
          </p>
        </div>

        {/* Items */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Lleva
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-white/75">
            {resumirItems(pedido.items)}
          </p>
        </div>

        {/* Hora */}
        <p className="text-[10px] text-white/35">
          Tomado a las {formatHoraBogota(pedido.creadoEn)}
        </p>

        {/* Pago */}
        <div className="rounded-lg border border-white/8 bg-cinema-black/50 p-3">
          {pagado ? (
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
                Forma de pago
              </span>
              <span className="rounded bg-blue-900/30 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                ✓ PAGADO
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  Cobra al cliente
                </span>
                <span className="rounded bg-red-900/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
                  EFECTIVO
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-xl text-white">
                    {formatCOP(pedido.total)}
                  </p>
                  {pedido.pagaCon != null && (
                    <p className="mt-0.5 text-[11px] text-white/40">
                      Cliente paga {formatCOP(pedido.pagaCon)}
                    </p>
                  )}
                </div>
                {devuelta !== null && devuelta >= 0 && (
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-amber-400">
                      Devuelves
                    </p>
                    <p className="font-[family-name:var(--font-display)] text-lg text-amber-400">
                      {formatCOP(devuelta)}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Acción */}
        {!aceptado ? (
          <button
            type="button"
            onClick={() => onAceptar(pedido.id)}
            className="w-full rounded-full bg-neon py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-neon-soft"
          >
            Aceptar pedido
          </button>
        ) : (
          <p className="rounded-full border border-emerald-700/40 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
            {FORMA_PAGO_LABEL[pedido.formaPago]} · Pedido aceptado
          </p>
        )}
      </div>
    </article>
  );
}
