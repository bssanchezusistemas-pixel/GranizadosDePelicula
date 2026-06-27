"use client";

import type { Ubicacion } from "@/data/caja";

interface UbicacionSelectorProps {
  ubicaciones: Ubicacion[];
  seleccionadaId: string | null;
  onSelect: (id: string | null) => void;
}

export function UbicacionSelector({
  ubicaciones,
  seleccionadaId,
  onSelect,
}: UbicacionSelectorProps) {
  const mesas = ubicaciones.filter((u) => u.tipo === "mesa");
  const pasillos = ubicaciones.filter((u) => u.tipo === "pasillo");

  return (
    <div className="space-y-4">
      <UbicacionGrupo
        titulo="Mesas"
        items={mesas}
        seleccionadaId={seleccionadaId}
        onSelect={onSelect}
      />
      <UbicacionGrupo
        titulo="Pasillos"
        items={pasillos}
        seleccionadaId={seleccionadaId}
        onSelect={onSelect}
      />
    </div>
  );
}

function UbicacionGrupo({
  titulo,
  items,
  seleccionadaId,
  onSelect,
}: {
  titulo: string;
  items: Ubicacion[];
  seleccionadaId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-white/50">
        {titulo}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((u) => {
          const activo = seleccionadaId === u.id;
          const ocupada = u.estado === "ocupada";
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => onSelect(activo ? null : u.id)}
              title={
                ocupada
                  ? "Ocupada — puedes agregar más productos al pedido abierto"
                  : "Libre"
              }
              className={`min-w-[3.5rem] rounded-lg border px-3 py-2 text-[11px] font-bold uppercase transition ${
                activo
                  ? "border-neon bg-neon/15 text-white"
                  : ocupada
                    ? "border-amber-600/50 bg-amber-900/20 text-amber-300 hover:border-amber-500"
                    : "border-white/10 text-white/60 hover:border-white/30"
              }`}
            >
              {u.label.replace(/^(Mesa|Pasillo) /, "")}
              {ocupada && !activo && (
                <span className="ml-1 text-[9px] opacity-70">●</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
