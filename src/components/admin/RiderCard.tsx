import type { DomiciliarioConResumen } from "@/data/domicilios";

interface RiderCardProps {
  rider: DomiciliarioConResumen;
  onVerPedidos: (riderId: string) => void;
  onCuadrarCaja: (riderId: string) => void;
}

function formatCOP(value: number) {
  return value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export function RiderCard({ rider, onVerPedidos, onCuadrarCaja }: RiderCardProps) {
  const totalPedidos = rider.pedidos.length;
  const cuadrado = rider.diferencia <= 0 && totalPedidos > 0;
  const inicial = rider.nombre.charAt(0).toUpperCase();

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon font-black text-sm">
            {inicial}
          </div>
          <div>
            <div className="text-sm font-bold">{rider.nombre}</div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              En turno
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300">
          {totalPedidos} pedidos
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-lg bg-zinc-800/60 p-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
            Entregados
          </div>
          <div className="font-black text-lg">
            {rider.entregados} / {totalPedidos}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-800/60 p-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
            En camino
          </div>
          <div
            className={`font-black text-lg ${rider.enCamino > 0 ? "text-red-400" : "text-zinc-600"}`}
          >
            {rider.enCamino}
          </div>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between rounded-lg bg-zinc-800/60 px-3.5 py-3 text-sm">
        <span className="text-zinc-400">Efectivo esperado</span>
        <span className="font-bold">{formatCOP(rider.efectivoEsperado)}</span>
      </div>

      <div
        className={`mb-4 flex items-center justify-between rounded-lg px-3.5 py-3 text-sm ${
          cuadrado
            ? "border border-emerald-700/40 bg-emerald-900/20"
            : "border border-red-700/40 bg-red-900/20"
        }`}
      >
        <span className={cuadrado ? "text-emerald-300" : "text-red-300"}>
          {cuadrado ? "Entregó" : "Entregó hasta ahora"}
        </span>
        <span
          className={`font-bold ${cuadrado ? "text-emerald-400" : "text-red-400"}`}
        >
          {cuadrado
            ? `${formatCOP(rider.efectivoEsperado)} · cuadrado ✓`
            : `faltan ${formatCOP(Math.max(rider.diferencia, 0))}`}
        </span>
      </div>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => onVerPedidos(rider.id)}
          className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800"
        >
          VER PEDIDOS
        </button>
        <button
          type="button"
          onClick={() => onCuadrarCaja(rider.id)}
          disabled={cuadrado}
          className="flex-1 rounded-lg bg-neon py-2.5 text-xs font-bold transition hover:bg-neon-soft disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {cuadrado ? "CUADRADO" : "CUADRAR CAJA"}
        </button>
      </div>
    </div>
  );
}
