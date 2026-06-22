"use client";

import { useState } from "react";
import type { DomiciliarioConResumen } from "@/data/domicilios";
import { formatCOP } from "@/lib/currency";
import { CurrencyInput } from "@/components/admin/CurrencyInput";

interface CuadrarCajaModalProps {
  rider: DomiciliarioConResumen;
  onClose: () => void;
  onSave: (monto: number) => Promise<void>;
}

export function CuadrarCajaModal({
  rider,
  onClose,
  onSave,
}: CuadrarCajaModalProps) {
  const falta = Math.max(rider.diferencia, 0);
  const [monto, setMonto] = useState(falta > 0 ? falta : rider.debeEntregar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quedaPendiente = Math.max(
    rider.debeEntregar - rider.efectivoEntregado - monto,
    0,
  );
  const quedaCuadrado = monto > 0 && quedaPendiente === 0;

  const pedidosEfectivo = rider.pedidos.filter((p) => p.forma_pago === "efectivo");
  const sinBase = rider.sinBase;

  async function handleSave() {
    if (monto <= 0) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(monto);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo registrar la entrega.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-neon">
              Control de caja
            </p>
            <h2 className="font-black text-xl">CUADRAR CAJA</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-sm font-bold">{rider.nombre} — Cierre del día</p>
            <div className="mt-3 space-y-2 text-sm">
              {sinBase ? (
                <>
                  <div className="flex justify-between text-zinc-400">
                    <span>Ventas netas (valor comanda)</span>
                    <span className="font-bold text-white">
                      {formatCOP(rider.ventasEfectivo)}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-200/90">
                    <span>Solo dinero de las devueltas</span>
                    <span className="font-bold text-amber-300">
                      {formatCOP(rider.devueltasEfectivo)}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-600">
                    Sin base, la tienda prestó el cambio por pedido. Al cerrar el
                    domiciliario entrega lo que cobró el cliente.
                  </p>
                  <div className="flex justify-between border-t border-zinc-800 pt-2 text-zinc-300">
                    <span className="font-bold">= Debe entregar (cobro clientes)</span>
                    <span className="font-black text-neon">
                      {formatCOP(rider.debeEntregar)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-zinc-400">
                    <span>Base inicial</span>
                    <span className="font-bold text-white">
                      {formatCOP(rider.baseEfectivo)}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>+ Ventas netas (valor comanda)</span>
                    <span className="font-bold text-white">
                      {formatCOP(rider.ventasEfectivo)}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-600">
                    Se suma el valor del pedido, no el billete del cliente. El
                    cambio ya se descontó de la base.
                  </p>
                  <div className="flex justify-between border-t border-zinc-800 pt-2 text-zinc-300">
                    <span className="font-bold">= Debe entregar</span>
                    <span className="font-black text-neon">
                      {formatCOP(rider.debeEntregar)}
                    </span>
                  </div>
                </>
              )}
              {rider.efectivoEntregado > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Ya entregó</span>
                  <span className="font-bold text-emerald-400">
                    {formatCOP(rider.efectivoEntregado)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-800 pt-2 text-zinc-400">
                <span>Falta por cuadrar</span>
                <span className="font-bold text-red-400">{formatCOP(falta)}</span>
              </div>
            </div>
          </div>

          {pedidosEfectivo.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                Pedidos en efectivo
              </p>
              <ul className="space-y-2 text-xs">
                {pedidosEfectivo.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2"
                  >
                    <div className="flex justify-between font-bold text-white">
                      <span>#{p.numero_pedido}</span>
                      <span>Venta {formatCOP(p.valor_pedido)}</span>
                    </div>
                    {p.paga_con != null && p.paga_con > 0 && (
                      <div className="mt-1 space-y-0.5 text-zinc-500">
                        <p>Cliente paga {formatCOP(p.paga_con)}</p>
                        {(p.devuelta ?? 0) > 0 && (
                          <p>Cambio devuelto {formatCOP(p.devuelta ?? 0)}</p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2 border-t border-zinc-800 pt-2 text-[11px] text-zinc-500">
                {sinBase ? (
                  <>
                    Total cobro clientes: {formatCOP(rider.cobroEfectivo)} — ventas{" "}
                    {formatCOP(rider.ventasEfectivo)} + devueltas{" "}
                    {formatCOP(rider.devueltasEfectivo)}.
                  </>
                ) : (
                  <>
                    Total ventas: {formatCOP(rider.ventasEfectivo)} — no se suman los{" "}
                    {formatCOP(
                      pedidosEfectivo.reduce(
                        (s, p) => s + Number(p.paga_con ?? 0),
                        0,
                      ),
                    )}{" "}
                    que pagaron los clientes porque parte fue cambio.
                  </>
                )}
              </p>
            </div>
          )}

          <div>
            <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              ¿Cuánto entrega ahora? <span className="text-neon">*</span>
            </label>
            <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3.5">
              <span className="text-lg font-bold text-zinc-500">$</span>
              <CurrencyInput
                value={monto}
                onChange={setMonto}
                placeholder="0"
                className="w-full bg-transparent font-black text-xl text-white placeholder:text-zinc-600 focus:outline-none"
              />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">
              Registra el efectivo que {rider.nombre} acaba de entregar en caja.
            </p>
          </div>

          {monto > 0 && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                quedaCuadrado
                  ? "border-emerald-700/40 bg-emerald-900/15 text-emerald-300"
                  : "border-amber-700/40 bg-amber-900/15 text-amber-200"
              }`}
            >
              {quedaCuadrado ? (
                <p className="font-bold">Con esto queda cuadrado ✓</p>
              ) : (
                <p>
                  Después de registrar, aún faltarían{" "}
                  <span className="font-bold">{formatCOP(quedaPendiente)}</span>
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm font-bold text-red-400">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-700 py-3.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={monto <= 0 || saving}
            className="flex-[2] rounded-lg bg-neon py-3.5 text-xs font-black tracking-wide hover:bg-neon-soft disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {saving ? "GUARDANDO..." : "REGISTRAR ENTREGA"}
          </button>
        </div>
      </div>
    </div>
  );
}
