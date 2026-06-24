"use client";

import { useState } from "react";

interface ReiniciarDiaModalProps {
  totalPedidos: number;
  domiciliariosEnTurno: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ReiniciarDiaModal({
  totalPedidos,
  domiciliariosEnTurno,
  onClose,
  onConfirm,
}: ReiniciarDiaModalProps) {
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setResetting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo reiniciar el día.",
      );
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-6 py-5">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-400">
            Reinicio del día
          </p>
          <h2 className="font-black text-xl">REINICIAR DÍA</h2>
        </div>

        <div className="space-y-4 px-6 py-6">
          <p className="text-sm text-zinc-300">
            Esto pondrá en cero el cuadre de caja de los{" "}
            <span className="font-bold text-white">
              {domiciliariosEnTurno} domiciliarios
            </span>{" "}
            en turno. Los{" "}
            <span className="font-bold text-white">{totalPedidos} pedidos</span>{" "}
            de hoy se conservan en el historial.
          </p>
          <p className="text-xs text-zinc-500">
            Las jornadas abiertas y la base de cambio de cada domiciliario se
            mantienen. Podrás volver a registrar pedidos de inmediato.
          </p>
          {error && <p className="text-sm font-bold text-red-400">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={resetting}
            className="flex-1 rounded-lg border border-zinc-700 py-3.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={resetting}
            className="flex-1 rounded-lg bg-amber-600 py-3.5 text-xs font-black tracking-wide hover:bg-amber-500 disabled:opacity-50"
          >
            {resetting ? "REINICIANDO..." : "REINICIAR DÍA"}
          </button>
        </div>
      </div>
    </div>
  );
}
