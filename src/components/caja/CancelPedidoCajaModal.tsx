"use client";

import { useState } from "react";
import { formatCOP } from "@/lib/currency";
import type { PedidoCaja } from "@/data/caja";

interface CancelPedidoCajaModalProps {
  pedido: PedidoCaja;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function CancelPedidoCajaModal({
  pedido,
  onClose,
  onConfirm,
}: CancelPedidoCajaModalProps) {
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setCancelando(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo cancelar el pedido.",
      );
    } finally {
      setCancelando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-6 py-5">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-400">
            Solo admin
          </p>
          <h2 className="font-black text-xl">CANCELAR PEDIDO</h2>
        </div>

        <div className="space-y-4 px-6 py-6">
          <p className="text-sm text-zinc-300">
            ¿Cancelar el pedido{" "}
            <span className="font-bold text-white">#{pedido.numero_pedido}</span>{" "}
            por {formatCOP(Number(pedido.total))}?
          </p>
          <p className="text-xs text-zinc-500">
            Se conservará en el historial pero no contará en los totales del día.
            {pedido.estado === "abierto" && " Si está en mesa, se liberará la ubicación."}
          </p>
          {error && <p className="text-sm font-bold text-red-400">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={cancelando}
            className="flex-1 rounded-lg border border-zinc-700 py-3.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
          >
            VOLVER
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelando}
            className="flex-1 rounded-lg bg-amber-700 py-3.5 text-xs font-black tracking-wide hover:bg-amber-600 disabled:opacity-50"
          >
            {cancelando ? "CANCELANDO..." : "CANCELAR PEDIDO"}
          </button>
        </div>
      </div>
    </div>
  );
}
