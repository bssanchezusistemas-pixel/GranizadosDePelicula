"use client";

import { useState } from "react";
import type { DomiciliarioConResumen } from "@/data/domicilios";
import { formatCOP } from "@/lib/currency";
import { CurrencyInput } from "@/components/admin/CurrencyInput";

interface EditarBaseModalProps {
  rider: DomiciliarioConResumen;
  onClose: () => void;
  onSave: (baseEfectivo: number) => Promise<void>;
}

export function EditarBaseModal({
  rider,
  onClose,
  onSave,
}: EditarBaseModalProps) {
  const [base, setBase] = useState(rider.baseEfectivo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (base <= 0) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(base);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo actualizar la base.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-neon">
              Ajuste de turno
            </p>
            <h2 className="font-black text-xl">EDITAR BASE</h2>
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
            <p className="text-sm font-bold">{rider.nombre}</p>
            <p className="mt-2 text-xs text-zinc-500">
              Base actual: {formatCOP(rider.baseEfectivo)}. Al guardar se
              recalcula lo que debe entregar y el estado del cuadre.
            </p>
          </div>

          <div>
            <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Nueva base de cambio <span className="text-neon">*</span>
            </label>
            <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3.5">
              <span className="text-lg font-bold text-zinc-500">$</span>
              <CurrencyInput
                value={base}
                onChange={setBase}
                placeholder="0"
                className="w-full bg-transparent font-black text-xl text-white placeholder:text-zinc-600 focus:outline-none"
              />
            </div>
          </div>

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
            disabled={base <= 0 || saving}
            className="flex-[2] rounded-lg bg-neon py-3.5 text-xs font-black tracking-wide hover:bg-neon-soft disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {saving ? "GUARDANDO..." : "GUARDAR BASE"}
          </button>
        </div>
      </div>
    </div>
  );
}
