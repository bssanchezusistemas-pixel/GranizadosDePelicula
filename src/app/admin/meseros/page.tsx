"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Mesero } from "@/data/caja";
import {
  crearMeseroAction,
  getMeserosAdminAction,
  toggleMeseroActivoAction,
} from "@/app/admin/meseros/actions";

export default function AdminMeserosPage() {
  const [meseros, setMeseros] = useState<Mesero[]>([]);
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMeserosAdminAction();
      setMeseros(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar meseros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      await crearMeseroAction(nombre.trim());
      setNombre("");
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el mesero.");
    } finally {
      setGuardando(false);
    }
  }

  async function toggleActivo(m: Mesero) {
    setError(null);
    try {
      await toggleMeseroActivoAction(m.id, !m.activo);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar.");
    }
  }

  return (
    <div className="min-h-screen bg-cinema-black px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-neon">
              Admin
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase">
              Meseros
            </h1>
            <p className="mt-1 text-sm text-white/40">
              Aparecen en el login de caja para tomar pedidos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/caja/domicilios"
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/60 hover:border-white/30"
            >
              Domicilios
            </Link>
            <Link
              href="/admin/mesas"
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/60 hover:border-white/30"
            >
              Mesas
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-700/40 bg-red-900/15 px-5 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleCrear}
          className="mb-8 flex flex-col gap-3 rounded-xl border border-white/8 bg-zinc-900 p-5 sm:flex-row"
        >
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del mesero"
            className="flex-1 rounded-lg border border-white/10 bg-cinema-black px-4 py-3 text-sm text-white focus:border-neon focus:outline-none"
          />
          <button
            type="submit"
            disabled={guardando || !nombre.trim()}
            className="rounded-full bg-neon px-6 py-3 text-xs font-black uppercase tracking-wide disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Agregar mesero"}
          </button>
        </form>

        {loading ? (
          <p className="text-white/50">Cargando...</p>
        ) : (
          <ul className="space-y-2">
            {meseros.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-white/8 bg-zinc-900 px-5 py-4"
              >
                <div>
                  <p className="font-bold text-white">{m.nombre}</p>
                  <p
                    className={`text-[11px] font-bold uppercase ${
                      m.activo ? "text-emerald-400" : "text-zinc-500"
                    }`}
                  >
                    {m.activo ? "Activo" : "Inactivo"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActivo(m)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-white/70 hover:border-neon"
                >
                  {m.activo ? "Desactivar" : "Activar"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
