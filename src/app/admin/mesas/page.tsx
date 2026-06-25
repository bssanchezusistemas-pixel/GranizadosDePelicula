"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatCOP } from "@/lib/currency";
import {
  getUbicacionesAction,
  liberarUbicacionAdminAction,
  type ResultadoLiberarUbicacion,
} from "@/app/caja/actions";
import { CobroMesaModal } from "@/components/caja/CobroMesaModal";
import type { Ubicacion } from "@/data/caja";

export default function AdminMesasPage() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [liberandoId, setLiberandoId] = useState<string | null>(null);
  const [ubicacionModal, setUbicacionModal] = useState<Ubicacion | null>(null);
  const [ultimaLiberacion, setUltimaLiberacion] =
    useState<ResultadoLiberarUbicacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUbicacionesAction();
      setUbicaciones(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function confirmarLiberar(pagaCon?: number) {
    if (!ubicacionModal) return;
    setLiberandoId(ubicacionModal.id);
    setError(null);
    try {
      const resultado = await liberarUbicacionAdminAction(
        ubicacionModal.id,
        pagaCon,
      );
      setUltimaLiberacion(resultado);
      setUbicacionModal(null);
      await cargar();
    } catch (e) {
      throw e;
    } finally {
      setLiberandoId(null);
    }
  }

  const ocupadas = ubicaciones.filter((u) => u.estado === "ocupada");

  return (
    <div className="min-h-screen bg-cinema-black px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-neon">
              Admin
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase">
              Mesas y bancos
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/caja/domicilios"
              className="rounded-full border border-neon/50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-neon"
            >
              Domicilios
            </Link>
            <Link
              href="/admin/mesas"
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/60 hover:border-white/30"
            >
              Mesas
            </Link>
            <Link
              href="/admin/meseros"
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/60 hover:border-white/30"
            >
              Meseros
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-700/40 bg-red-900/15 px-5 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {ultimaLiberacion && (
          <div className="mb-6 rounded-xl border border-emerald-700/40 bg-emerald-900/15 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-emerald-300">
                  ✓ {ultimaLiberacion.label} liberada
                  {ultimaLiberacion.numeroPedido
                    ? ` · Pedido #${ultimaLiberacion.numeroPedido}`
                    : ""}
                </p>
                {ultimaLiberacion.total != null && (
                  <p className="mt-1 text-sm text-white/60">
                    Total cobrado: {formatCOP(ultimaLiberacion.total)}
                    {ultimaLiberacion.pagaCon != null && (
                      <> · Paga con {formatCOP(ultimaLiberacion.pagaCon)}</>
                    )}
                  </p>
                )}
                {ultimaLiberacion.devuelta != null &&
                  ultimaLiberacion.pagaCon != null && (
                    <p className="mt-2 font-[family-name:var(--font-display)] text-xl text-amber-400">
                      Devuelta: {formatCOP(ultimaLiberacion.devuelta)}
                    </p>
                  )}
              </div>
              <button
                type="button"
                onClick={() => setUltimaLiberacion(null)}
                className="rounded-lg border border-emerald-700/50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-white/50">Cargando...</p>
        ) : (
          <>
            <p className="mb-6 text-sm text-white/40">
              {ocupadas.length} ubicaciones ocupadas de {ubicaciones.length}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {ubicaciones.map((u) => (
                <div
                  key={u.id}
                  className={`rounded-xl border p-4 text-center ${
                    u.estado === "ocupada"
                      ? "border-amber-600/50 bg-amber-900/15"
                      : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <p className="text-sm font-black">{u.label}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase text-white/40">
                    {u.estado}
                  </p>
                  {u.estado === "ocupada" && (
                    <button
                      type="button"
                      disabled={liberandoId === u.id}
                      onClick={() => setUbicacionModal(u)}
                      className="mt-2 w-full rounded-lg border border-white/10 py-1 text-[10px] font-bold uppercase hover:border-neon disabled:opacity-50"
                    >
                      Liberar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <CobroMesaModal
        ubicacion={ubicacionModal}
        onClose={() => setUbicacionModal(null)}
        onConfirm={confirmarLiberar}
        loading={liberandoId === ubicacionModal?.id}
      />
    </div>
  );
}
