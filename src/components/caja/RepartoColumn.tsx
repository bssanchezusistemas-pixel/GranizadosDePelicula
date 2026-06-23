"use client";

import { formatCOP } from "@/lib/currency";
import {
  calcularCobroEfectivo,
  calcularDevueltasEfectivo,
  calcularDebeEntregar,
  calcularVentasEfectivo,
  trabajaSinBase,
  BASE_EFECTIVO_DEFAULT,
} from "@/data/domicilios";
import {
  pedidoToDomicilioCalculo,
  type Pedido,
  type Repartidor,
} from "@/data/ventas";
import { RepartoCard } from "@/components/caja/RepartoCard";

interface RepartoColumnProps {
  repartidor: Repartidor;
  pedidos: Pedido[];
  base: number;
  onToggleBase: () => void;
  onAceptar: (pedidoId: string) => void;
}

export function RepartoColumn({
  repartidor,
  pedidos,
  base,
  onToggleBase,
  onAceptar,
}: RepartoColumnProps) {
  const sinBase = trabajaSinBase(base);
  const calculos = pedidos.map(pedidoToDomicilioCalculo);

  const ventasEfectivo = calcularVentasEfectivo(calculos);
  const cobroEfectivo = calcularCobroEfectivo(calculos);
  const devueltas = calcularDevueltasEfectivo(calculos);
  const debeEntregar = calcularDebeEntregar(base, calculos);

  const pendientes = pedidos.filter((p) => p.estadoDomicilio !== "aceptado").length;
  const aceptados = pedidos.length - pendientes;

  return (
    <section className="flex flex-col rounded-2xl border border-white/8 bg-cinema-dark/60">
      {/* Cabecera del repartidor */}
      <div className="border-b border-white/8 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon font-[family-name:var(--font-display)] text-lg text-white">
            {repartidor.nombre.charAt(0)}
          </span>
          <div className="flex-1">
            <h2 className="font-[family-name:var(--font-display)] text-lg uppercase leading-none text-white">
              {repartidor.nombre}
            </h2>
            <p className="mt-0.5 text-[11px] text-white/45">
              {aceptados} en ruta · {pendientes} pendiente{pendientes === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Toggle base / sin base */}
        <button
          type="button"
          onClick={onToggleBase}
          className={`mt-3 flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${
            sinBase
              ? "border-amber-700/50 bg-amber-900/15"
              : "border-emerald-700/40 bg-emerald-900/15"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            Base de hoy
          </span>
          <span
            className={`text-[11px] font-black uppercase tracking-wide ${
              sinBase ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {sinBase ? "Sin base" : `Con base ${formatCOP(BASE_EFECTIVO_DEFAULT)}`}
          </span>
        </button>
      </div>

      {/* Resumen financiero — depende del toggle */}
      <div className="grid grid-cols-2 gap-px bg-white/8">
        <ResumenCelda
          label={sinBase ? "Cobro clientes" : "Ventas efectivo"}
          valor={formatCOP(sinBase ? cobroEfectivo : ventasEfectivo)}
        />
        <ResumenCelda
          label="Devueltas"
          valor={formatCOP(devueltas)}
          valorClase="text-amber-400"
        />
        <ResumenCelda
          label="Debe entregar"
          valor={formatCOP(debeEntregar)}
          destacar
          pista={
            sinBase ? "lo que cobró al cliente" : "base + ventas efectivo"
          }
        />
        <ResumenCelda
          label="Pedidos"
          valor={String(pedidos.length)}
        />
      </div>

      {/* Tarjetas */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {pedidos.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center text-center">
            <span className="mb-2 text-3xl opacity-25">🏍️</span>
            <p className="text-sm font-bold uppercase tracking-wide text-white/35">
              Sin pedidos
            </p>
            <p className="mt-1 text-[11px] text-white/25">
              Los domicilios asignados aparecerán aquí.
            </p>
          </div>
        ) : (
          pedidos.map((p) => (
            <RepartoCard key={p.id} pedido={p} onAceptar={onAceptar} />
          ))
        )}
      </div>
    </section>
  );
}

function ResumenCelda({
  label,
  valor,
  valorClase = "text-white",
  destacar = false,
  pista,
}: {
  label: string;
  valor: string;
  valorClase?: string;
  destacar?: boolean;
  pista?: string;
}) {
  return (
    <div
      className={`px-4 py-3 ${destacar ? "bg-neon/5" : "bg-cinema-dark/60"}`}
    >
      <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">
        {label}
      </p>
      <p
        className={`mt-1 font-[family-name:var(--font-display)] ${
          destacar ? "text-lg text-neon" : "text-base " + valorClase
        }`}
      >
        {valor}
      </p>
      {pista && <p className="mt-0.5 text-[9px] text-white/30">{pista}</p>}
    </div>
  );
}
