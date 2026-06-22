"use client";

import { useState } from "react";
import type { PedidoDomicilio } from "@/data/domicilios";
import { formatCOP } from "@/lib/currency";

interface DeletePedidoModalProps {
  pedido: PedidoDomicilio;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeletePedidoModal({
  pedido,
  onClose,
  onConfirm,
}: DeletePedidoModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo eliminar el pedido.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-6 py-5">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-red-400">
            Acción irreversible
          </p>
          <h2 className="font-black text-xl">ELIMINAR PEDIDO</h2>
        </div>

        <div className="space-y-4 px-6 py-6">
          <p className="text-sm text-zinc-300">
            ¿Eliminar el pedido{" "}
            <span className="font-bold text-white">#{pedido.numero_pedido}</span>{" "}
            por {formatCOP(pedido.valor_pedido)}?
          </p>
          <p className="text-xs text-zinc-500">
            Se actualizarán las ventas y el cuadre de caja del domiciliario.
          </p>
          {error && <p className="text-sm font-bold text-red-400">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 rounded-lg border border-zinc-700 py-3.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 rounded-lg bg-red-600 py-3.5 text-xs font-black tracking-wide hover:bg-red-500 disabled:opacity-50"
          >
            {deleting ? "ELIMINANDO..." : "ELIMINAR"}
          </button>
        </div>
      </div>
    </div>
  );
}
