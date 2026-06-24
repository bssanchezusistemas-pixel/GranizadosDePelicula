"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/caja/domicilios";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cinema-black px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-neon">
            Panel interno
          </p>
          <h1 className="mt-2 font-black text-2xl text-white">
            Granizados de Película
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Inicia sesión para gestionar domicilios
          </p>
        </div>

        {!configured && (
          <div className="mb-6 rounded-lg border border-amber-700/40 bg-amber-900/15 px-4 py-3 text-sm text-amber-200">
            Falta configurar <code>.env.local</code> con las credenciales de
            Supabase.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-zinc-400"
            >
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white focus:border-neon focus:outline-none"
              placeholder="admin@tudominio.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-zinc-400"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white focus:border-neon focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-sm font-bold text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !configured}
            className="w-full rounded-full bg-neon py-3 text-sm font-black uppercase tracking-wider text-white hover:bg-neon-soft disabled:cursor-not-allowed disabled:bg-zinc-800"
          >
            {loading ? "Entrando..." : "Entrar al panel"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-zinc-500 transition hover:text-neon"
          >
            ← Volver a la landing
          </Link>
        </div>
      </div>
    </div>
  );
}
