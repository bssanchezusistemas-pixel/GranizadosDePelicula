"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  confirmAdminCajaSessionAction,
  getMeserosAction,
  loginMeseroAction,
} from "@/app/caja/actions";
import { safeRedirectPath } from "@/lib/safe-redirect";

type ModoLogin = "mesero" | "admin";

export function CajaLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirectPath(searchParams.get("next"), "/caja");
  const sinPermiso = searchParams.get("error") === "sin_permiso";
  const [modo, setModo] = useState<ModoLogin>(
    next.startsWith("/admin") ? "admin" : "mesero",
  );
  const [meseros, setMeseros] = useState<string[]>([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    getMeserosAction()
      .then((lista) => setMeseros(lista.map((m) => m.nombre)))
      .catch(() => setMeseros(["Estefani", "Andrea"]));
  }, []);

  async function handleMeseroSubmit(e: React.FormEvent) {
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

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw new Error(signInError.message);

      await confirmAdminCajaSessionAction();
      router.push(safeRedirectPath(next, "/caja"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setModo("mesero");
            setError(null);
          }}
          className={`rounded-lg border py-2.5 text-[11px] font-bold uppercase tracking-wide transition ${
            modo === "mesero"
              ? "border-neon bg-neon/15 text-white"
              : "border-white/10 text-white/55 hover:border-white/30"
          }`}
        >
          Mesero
        </button>
        <button
          type="button"
          onClick={() => {
            setModo("admin");
            setError(null);
          }}
          className={`rounded-lg border py-2.5 text-[11px] font-bold uppercase tracking-wide transition ${
            modo === "admin"
              ? "border-neon bg-neon/15 text-white"
              : "border-white/10 text-white/55 hover:border-white/30"
          }`}
        >
          Admin
        </button>
      </div>

      {modo === "mesero" ? (
        <form onSubmit={handleMeseroSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/50">
              Tu nombre
            </label>
            {meseros.length === 0 ? (
              <p className="text-sm text-white/40">Cargando meseros...</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {meseros.map((m) => (
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
            )}
          </div>

          {error && <p className="text-sm font-bold text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={!nombre.trim() || loading || meseros.length === 0}
            className="w-full rounded-full bg-neon py-4 text-sm font-black uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {loading ? "Entrando..." : "Entrar a caja"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleAdminSubmit} className="space-y-4">
          {sinPermiso && (
            <div className="rounded-lg border border-red-700/40 bg-red-900/15 px-4 py-3 text-sm text-red-200">
              Tu cuenta no tiene permisos de administrador.
            </div>
          )}

          {!configured && (
            <div className="rounded-lg border border-amber-700/40 bg-amber-900/15 px-4 py-3 text-sm text-amber-200">
              Falta configurar Supabase en <code>.env.local</code>.
            </div>
          )}

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/50">
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-white/10 bg-cinema-black px-4 py-3 text-sm text-white focus:border-neon focus:outline-none"
              placeholder="admin@tudominio.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/50">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-white/10 bg-cinema-black px-4 py-3 text-sm text-white focus:border-neon focus:outline-none"
            />
          </div>

          {error && <p className="text-sm font-bold text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !configured}
            className="w-full rounded-full bg-neon py-4 text-sm font-black uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {loading ? "Entrando..." : "Entrar como admin"}
          </button>
        </form>
      )}
    </div>
  );
}
