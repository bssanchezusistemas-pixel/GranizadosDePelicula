"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginMeseroAction } from "@/app/caja/actions";

const MESEROS = ["Estefani", "Andrea"];

export function MeseroLoginForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await loginMeseroAction(nombre.trim());
      router.push("/caja");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/50">
          Tu nombre
        </label>
        <div className="grid grid-cols-2 gap-2">
          {MESEROS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setNombre(m)}
              className={`rounded-lg border py-3 text-sm font-bold transition ${
                nombre === m
                  ? "border-neon bg-neon/15 text-white"
                  : "border-white/10 text-white/60 hover:border-white/30"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm font-bold text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={!nombre.trim() || loading}
        className="w-full rounded-full bg-neon py-4 text-sm font-black uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
      >
        {loading ? "Entrando..." : "Entrar a caja"}
      </button>
    </form>
  );
}
