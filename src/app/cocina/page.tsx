import { CocinaBoard } from "@/components/cocina/CocinaBoard";
import { BUSINESS } from "@/data/menu";

export const metadata = {
  title: "Cocina — Granizados de Película",
};

export default function CocinaPage() {
  return (
    <div className="min-h-screen bg-cinema-black text-white">
      <header className="border-b border-white/8 bg-cinema-dark/95 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neon">
              {BUSINESS.name}
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase text-white">
              Cocina
            </h1>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">
            Pantalla unificada
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <CocinaBoard />
      </main>
    </div>
  );
}
