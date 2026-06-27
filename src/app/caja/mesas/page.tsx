import { MesasBoard } from "@/components/caja/MesasBoard";

export default function MesasPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neon">
          Mesas y pasillos
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase text-white sm:text-3xl">
          Liberar mesas
        </h1>
        <p className="mt-1.5 text-sm text-white/40">
          Al liberar se cierra el pedido abierto de esa mesa.
        </p>
      </div>
      <MesasBoard />
    </main>
  );
}
