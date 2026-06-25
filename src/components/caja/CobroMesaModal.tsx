"use client";

import { useEffect, useState } from "react";
import { getPedidoParaCobroMesaAction } from "@/app/caja/actions";
import { formatCOP } from "@/lib/currency";
import {
  FORMA_PAGO_LABEL,
  type PedidoAbiertoResumen,
  type Ubicacion,
} from "@/data/caja";
import {
  PagoEfectivoBlock,
  validarPagoEfectivo,
} from "@/components/caja/PagoEfectivoBlock";

interface CobroMesaModalProps {
  ubicacion: Ubicacion | null;
  onClose: () => void;
  onConfirm: (pagaCon?: number) => Promise<void>;
  loading?: boolean;
}

export function CobroMesaModal({
  ubicacion,
  onClose,
  onConfirm,
  loading = false,
}: CobroMesaModalProps) {
  const [pagaCon, setPagaCon] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pedido, setPedido] = useState<PedidoAbiertoResumen | null>(null);
  const [cargandoPedido, setCargandoPedido] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const esEfectivo = pedido?.forma_pago === "efectivo";
  const total = Number(pedido?.total ?? 0);
  const pagoEfectivo = validarPagoEfectivo(total, pagaCon);

  useEffect(() => {
    if (!ubicacion) {
      setPedido(null);
      setPagaCon(0);
      setError(null);
      setFetchError(null);
      return;
    }

    setPagaCon(0);
    setError(null);
    setFetchError(null);
    setCargandoPedido(true);

    let cancelled = false;

    getPedidoParaCobroMesaAction(ubicacion.id)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setPedido(null);
          setFetchError("No hay pedido abierto en esta mesa.");
          return;
        }
        setPedido(data.pedido);
      })
      .catch((e) => {
        if (cancelled) return;
        setPedido(null);
        setFetchError(
          e instanceof Error ? e.message : "No se pudo cargar el pedido.",
        );
      })
      .finally(() => {
        if (!cancelled) setCargandoPedido(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ubicacion]);

  if (!ubicacion) return null;

  async function handleConfirm() {
    setError(null);
    try {
      await onConfirm(esEfectivo ? pagaCon : undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo liberar la mesa.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-cinema-dark p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cobro-mesa-title"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neon">
          Cobrar y liberar
        </p>
        <h2
          id="cobro-mesa-title"
          className="mt-2 font-[family-name:var(--font-display)] text-xl uppercase text-white"
        >
          {ubicacion.label}
        </h2>

        {cargandoPedido && (
          <p className="mt-6 text-sm text-white/50">Cargando pedido...</p>
        )}

        {fetchError && !cargandoPedido && (
          <>
            <p className="mt-4 text-sm font-bold text-red-400">{fetchError}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-full border border-white/15 py-3 text-xs font-bold uppercase tracking-wide text-white/70"
            >
              Cerrar
            </button>
          </>
        )}

        {pedido && !cargandoPedido && (
          <>
            <p className="mt-1 text-sm text-white/45">
              Pedido #{pedido.numero_pedido} ·{" "}
              {FORMA_PAGO_LABEL[pedido.forma_pago]}
            </p>

            <div className="my-5 flex items-center justify-between rounded-xl border border-white/10 bg-cinema-black px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wide text-white/50">
                Total a cobrar
              </span>
              <span className="font-[family-name:var(--font-display)] text-2xl text-white">
                {formatCOP(total)}
              </span>
            </div>

            {esEfectivo ? (
              <PagoEfectivoBlock
                total={total}
                pagaCon={pagaCon}
                onPagaCon={setPagaCon}
              />
            ) : (
              <p className="mb-5 rounded-lg border border-blue-800/40 bg-blue-900/10 px-4 py-3 text-sm text-blue-200">
                Pago por transferencia. Confirma para cerrar el pedido y liberar
                la mesa.
              </p>
            )}

            {error && (
              <p className="mb-4 text-sm font-bold text-red-400">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-full border border-white/15 py-3 text-xs font-bold uppercase tracking-wide text-white/70"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading || (esEfectivo && !pagoEfectivo.ok)}
                className="flex-1 rounded-full bg-neon py-3 text-xs font-black uppercase tracking-[0.15em] text-white disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {loading
                  ? "Procesando..."
                  : esEfectivo
                    ? "Cobrar y liberar"
                    : "Liberar mesa"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
