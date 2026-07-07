"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { confirmAdminCajaSessionAction } from "@/app/caja/actions";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      router.push("/admin/productos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          className="w-full rounded-lg border border-white/10 bg-cinema-gray px-3 py-2.5 text-white"
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
          className="w-full rounded-lg border border-white/10 bg-cinema-gray px-3 py-2.5 text-white"
        />
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full border border-neon bg-neon/15 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
      <p className="text-center text-xs text-white/40">
        <Link href="/" className="hover:text-white">
          Volver al sitio
        </Link>
      </p>
    </form>
  );
}
