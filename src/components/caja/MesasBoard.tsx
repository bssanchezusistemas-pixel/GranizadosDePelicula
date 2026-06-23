"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getUbicacionesAction,
  liberarUbicacionAction,
} from "@/app/caja/actions";
import type { Ubicacion } from "@/data/caja";

export function MesasBoard() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [liberandoId, setLiberandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUbicacionesAction();
      setUbicaciones(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar mesas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function liberar(id: string, label: string) {
    if (!confirm(`¿Liberar ${label}? Se cerrará el pedido abierto.`)) return;
    setLiberandoId(id);
    setError(null);
    try {
      await liberarUbicacionAction(id);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo liberar.");
    } finally {
      setLiberandoId(null);
    }
  }

  const mesas = ubicaciones.filter((u) => u.tipo === "mesa");
  const bancos = ubicaciones.filter((u) => u.tipo === "banco");
  const barra = ubicaciones.filter((u) => u.tipo === "barra");
  const ocupadas = ubicaciones.filter((u) => u.estado === "ocupada").length;

  if (loading) {
    return <p className="text-sm text-white/50">Cargando mesas...</p>;
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-xl border border-red-700/40 bg-red-900/15 px-5 py-3 text-sm font-bold text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={String(ubicaciones.length)} />
        <Stat label="Ocupadas" value={String(ocupadas)} accent="amber" />
        <Stat
          label="Libres"
          value={String(ubicaciones.length - ocupadas)}
          accent="emerald"
        />
      </div>

      <GrupoMesas titulo="Mesas" items={mesas} liberandoId={liberandoId} onLiberar={liberar} />
      <GrupoMesas titulo="Bancos" items={bancos} liberandoId={liberandoId} onLiberar={liberar} />
      <GrupoMesas titulo="Barra" items={barra} liberandoId={liberandoId} onLiberar={liberar} />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber" | "emerald";
}) {
  const color =
    accent === "amber"
      ? "text-amber-400"
      : accent === "emerald"
        ? "text-emerald-400"
        : "text-white";
  return (
    <div className="rounded-xl border border-white/8 bg-cinema-gray px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
        {label}
      </p>
      <p className={`font-[family-name:var(--font-display)] text-2xl ${color}`}>
        {value}
      </p>
    </div>
  );
}

function GrupoMesas({
  titulo,
  items,
  liberandoId,
  onLiberar,
}: {
  titulo: string;
  items: Ubicacion[];
  liberandoId: string | null;
  onLiberar: (id: string, label: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg uppercase text-white">
        {titulo}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {items.map((u) => {
          const ocupada = u.estado === "ocupada";
          return (
            <div
              key={u.id}
              className={`rounded-xl border p-4 text-center ${
                ocupada
                  ? "border-amber-600/50 bg-amber-900/15"
                  : "border-emerald-800/40 bg-emerald-900/10"
              }`}
            >
              <p className="text-sm font-black uppercase text-white">{u.label}</p>
              <p
                className={`mt-1 text-[10px] font-bold uppercase ${
                  ocupada ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {ocupada ? "Ocupada" : "Libre"}
              </p>
              {ocupada && (
                <button
                  type="button"
                  disabled={liberandoId === u.id}
                  onClick={() => onLiberar(u.id, u.label)}
                  className="mt-3 w-full rounded-lg border border-white/10 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white/70 hover:border-neon hover:text-white disabled:opacity-50"
                >
                  {liberandoId === u.id ? "..." : "Liberar"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
