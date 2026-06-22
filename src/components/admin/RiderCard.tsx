import type { DomiciliarioConResumen } from "@/data/domicilios";
import { formatCOP } from "@/lib/currency";

interface RiderCardProps {
  rider: DomiciliarioConResumen;
  onVerPedidos: (riderId: string) => void;
  onCuadrarCaja: (riderId: string) => void;
  onIniciarJornada: (riderId: string) => void;
  onEditarBase: (riderId: string) => void;
}

export function RiderCard({
  rider,
  onVerPedidos,
  onCuadrarCaja,
  onIniciarJornada,
  onEditarBase,
}: RiderCardProps) {
  const totalPedidos = rider.pedidos.length;
  const cuadrado = rider.cuadrado;
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
            <div
              className={`flex items-center gap-1.5 text-[11px] font-bold ${
                rider.jornadaIniciada ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  rider.jornadaIniciada ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              {rider.jornadaIniciada ? "En turno" : "Jornada no iniciada"}
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300">
          {totalPedidos} pedidos
        </div>
      </div>

      {!rider.jornadaIniciada ? (
        <div className="mb-4 rounded-lg border border-amber-700/40 bg-amber-900/15 px-4 py-4 text-sm text-amber-200">
          <p className="font-bold">Sin jornada abierta</p>
          <p className="mt-1 text-xs text-amber-200/80">
            Inicia la jornada y entrega la base de cambio antes de asignar
            pedidos.
          </p>
        </div>
      ) : (
        <>
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
            <span className="text-zinc-400">Base de cambio</span>
            <div className="flex items-center gap-2">
              <span className="font-bold">{formatCOP(rider.baseEfectivo)}</span>
              <button
                type="button"
                onClick={() => onEditarBase(rider.id)}
                className="rounded-md border border-zinc-600 px-2 py-0.5 text-[10px] font-bold text-zinc-300 hover:border-neon hover:text-neon"
              >
                EDITAR
              </button>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between rounded-lg bg-zinc-800/60 px-3.5 py-3 text-sm">
            <span className="text-zinc-400">Ventas netas (comanda)</span>
            <span className="font-bold">{formatCOP(rider.ventasEfectivo)}</span>
          </div>

          <div className="mb-2 flex items-center justify-between rounded-lg bg-zinc-800/60 px-3.5 py-3 text-sm">
            <span className="text-zinc-400">Debe entregar</span>
            <span className="font-bold text-neon">
              {formatCOP(rider.debeEntregar)}
            </span>
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
                ? `${formatCOP(rider.efectivoEntregado)} · cuadrado ✓`
                : `${formatCOP(rider.efectivoEntregado)} · faltan ${formatCOP(Math.max(rider.diferencia, 0))}`}
            </span>
          </div>
        </>
      )}

      <div className="flex gap-2.5">
        {!rider.jornadaIniciada ? (
          <button
            type="button"
            onClick={() => onIniciarJornada(rider.id)}
            className="flex-1 rounded-lg bg-neon py-2.5 text-xs font-bold transition hover:bg-neon-soft"
          >
            INICIAR JORNADA
          </button>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
