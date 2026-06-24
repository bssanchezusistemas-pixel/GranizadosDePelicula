import Link from "next/link";
import { CajaLoginForm } from "./CajaLoginForm";

export default function CajaLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cinema-black px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-neon">
          Granizados de Película
        </p>
        <h1 className="font-black text-2xl text-white">CAJA</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Meseros o admin — elige cómo entras.
        </p>
        <div className="mt-8">
          <CajaLoginForm />
        </div>
        <Link
          href="/"
          className="mt-6 block text-center text-xs text-zinc-500 hover:text-zinc-300"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
