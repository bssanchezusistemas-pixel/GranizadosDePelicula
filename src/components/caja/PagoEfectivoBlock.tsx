"use client";

import { formatCOP } from "@/lib/currency";
import { calcularDevuelta } from "@/data/domicilios";

interface PagoEfectivoBlockProps {
  total: number;
  pagaCon: number;
  onPagaCon: (n: number) => void;
  showQuickButtons?: boolean;
}

export function PagoEfectivoBlock({
  total,
  pagaCon,
  onPagaCon,
  showQuickButtons = true,
}: PagoEfectivoBlockProps) {
  const pagaConInsuficiente = pagaCon > 0 && pagaCon < total;
  const devuelta =
    pagaCon > 0
      ? calcularDevuelta({
          forma_pago: "efectivo",
          valor_pedido: total,
          paga_con: pagaCon,
        })
      : null;

  return (
    <div className="mb-5">
      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/50">
        ¿Con cuánto paga el cliente?
      </label>
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-cinema-black px-4 py-3">
        <span className="text-base font-bold text-white/40">$</span>
        <input
          type="text"
          inputMode="numeric"
          value={pagaCon ? pagaCon.toLocaleString("es-CO") : ""}
          onChange={(e) =>
            onPagaCon(Number(e.target.value.replace(/\D/g, "")) || 0)
          }
          placeholder="0"
          className={`w-full bg-transparent font-black text-lg text-white placeholder:font-medium placeholder:text-white/30 focus:outline-none ${
            pagaConInsuficiente ? "text-red-400" : ""
          }`}
        />
      </div>

      {showQuickButtons && (
        <div className="mt-2 flex flex-wrap gap-2">
          <QuickAmount label="Exacto" onClick={() => onPagaCon(total)} />
          <QuickAmount label="$50.000" onClick={() => onPagaCon(50_000)} />
          <QuickAmount label="$100.000" onClick={() => onPagaCon(100_000)} />
        </div>
      )}

      {pagaConInsuficiente && (
        <p className="mt-2 text-[11px] font-bold text-red-400">
          El monto es menor al total ({formatCOP(total)}).
        </p>
      )}

      {devuelta !== null && devuelta >= 0 && pagaCon > 0 && !pagaConInsuficiente && (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-amber-700/40 bg-amber-900/10 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-400">
            Devuelta al cliente
          </p>
          <p className="font-[family-name:var(--font-display)] text-lg text-amber-400">
            {formatCOP(devuelta)}
          </p>
        </div>
      )}
    </div>
  );
}

function QuickAmount({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white/60 transition hover:border-neon/40 hover:text-white"
    >
      {label}
    </button>
  );
}

export function validarPagoEfectivo(
  total: number,
  pagaCon: number,
): { ok: boolean; insuficiente: boolean; falta: boolean } {
  const falta = !pagaCon || pagaCon < total;
  const insuficiente = pagaCon > 0 && pagaCon < total;
  return { ok: !falta, insuficiente, falta };
}
