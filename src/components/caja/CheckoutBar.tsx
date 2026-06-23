"use client";

import { formatCOP } from "@/lib/currency";
import { calcularDevuelta } from "@/data/domicilios";
import {
  COMISION_REPARTIDOR,
  FORMA_PAGO_LABEL,
  REPARTIDORES,
  TIPO_COMISION_LABEL,
  TIPO_ENTREGA_LABEL,
  type FormaPago,
  type TipoComision,
  type TipoEntrega,
} from "@/data/ventas";

interface CheckoutBarProps {
  total: number;
  tipoEntrega: TipoEntrega;
  formaPago: FormaPago;
  direccion: string;
  /** id del repartidor seleccionado (solo domicilio). */
  domiciliarioId: string | null;
  /** Con cuánto paga el cliente en efectivo (domicilio + efectivo). */
  pagaCon: number;
  /** Quién paga la comisión del domiciliario (solo domicilio). */
  comisionPagadaPor: TipoComision | null;
  carritoVacio: boolean;
  onTipoEntrega: (t: TipoEntrega) => void;
  onFormaPago: (f: FormaPago) => void;
  onDireccion: (d: string) => void;
  onDomiciliario: (id: string | null) => void;
  onPagaCon: (n: number) => void;
  onComisionPagadaPor: (t: TipoComision) => void;
  onConfirmar: () => void;
}

const TIPOS: TipoEntrega[] = ["local", "recoge", "domicilio"];
const PAGOS: FormaPago[] = ["efectivo", "transferencia"];
const COMISION_OPCIONES: TipoComision[] = ["cliente", "restaurante"];

export function CheckoutBar({
  total,
  tipoEntrega,
  formaPago,
  direccion,
  domiciliarioId,
  pagaCon,
  comisionPagadaPor,
  carritoVacio,
  onTipoEntrega,
  onFormaPago,
  onDireccion,
  onDomiciliario,
  onPagaCon,
  onComisionPagadaPor,
  onConfirmar,
}: CheckoutBarProps) {
  const esDomicilio = tipoEntrega === "domicilio";
  const direccionInvalida = esDomicilio && direccion.trim().length < 5;
  const sinRepartidor = esDomicilio && !domiciliarioId;
  const sinComision = esDomicilio && !comisionPagadaPor;

  // Si el cliente paga la comisión, se suma al total.
  const totalConComision =
    esDomicilio && comisionPagadaPor === "cliente"
      ? total + COMISION_REPARTIDOR
      : total;

  const pagaConInsuficiente =
    esDomicilio &&
    formaPago === "efectivo" &&
    pagaCon > 0 &&
    pagaCon < totalConComision;

  const devuelta =
    esDomicilio && formaPago === "efectivo" && pagaCon > 0
      ? calcularDevuelta({ forma_pago: formaPago, valor_pedido: totalConComision, paga_con: pagaCon })
      : null;

  const puedeConfirmar =
    !carritoVacio &&
    !direccionInvalida &&
    !sinRepartidor &&
    !sinComision &&
    !pagaConInsuficiente;

  return (
    <div className="rounded-2xl border border-white/8 bg-cinema-gray p-5">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-neon">
        Cerrar venta
      </p>

      {/* Tipo de entrega */}
      <div className="mb-4">
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/50">
          Tipo de entrega
        </label>
        <div className="grid grid-cols-3 gap-2">
          {TIPOS.map((t) => {
            const activo = tipoEntrega === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onTipoEntrega(t)}
                aria-pressed={activo}
                className={`rounded-lg border px-2 py-2.5 text-[11px] font-bold uppercase tracking-wide transition ${
                  activo
                    ? "border-neon bg-neon/15 text-white"
                    : "border-white/10 text-white/55 hover:border-white/30"
                }`}
              >
                {TIPO_ENTREGA_LABEL[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Forma de pago */}
      <div className="mb-4">
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/50">
          Forma de pago
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PAGOS.map((f) => {
            const activo = formaPago === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => onFormaPago(f)}
                aria-pressed={activo}
                className={`flex items-center justify-center gap-2 rounded-lg border px-2 py-3 text-[11px] font-bold uppercase tracking-wide transition ${
                  activo
                    ? "border-neon bg-neon/15 text-white"
                    : "border-white/10 text-white/55 hover:border-white/30"
                }`}
              >
                <span>{f === "efectivo" ? "💵" : "📲"}</span>
                {FORMA_PAGO_LABEL[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dirección — solo cuando es domicilio */}
      {esDomicilio && (
        <div className="mb-4">
          <label className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-white/50">
            Dirección de entrega <span className="text-neon">*</span>
          </label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => onDireccion(e.target.value)}
            placeholder="Cra 8 #5-18, barrio Centro..."
            className={`w-full rounded-lg border bg-cinema-black px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none ${
              direccionInvalida
                ? "border-red-500 focus:border-red-500"
                : "border-white/10 focus:border-neon"
            }`}
          />
          {direccionInvalida && (
            <p className="mt-1.5 text-[11px] font-bold text-red-400">
              Escribe la dirección del domicilio para continuar.
            </p>
          )}
        </div>
      )}

      {/* Domiciliario — solo cuando es domicilio */}
      {esDomicilio && (
        <div className="mb-4">
          <label className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-white/50">
            ¿Quién lo entrega? <span className="text-neon">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {REPARTIDORES.map((r) => {
              const activo = domiciliarioId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onDomiciliario(activo ? null : r.id)}
                  aria-pressed={activo}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left transition ${
                    activo
                      ? "border-neon bg-neon/15 text-white"
                      : "border-white/10 text-white/60 hover:border-white/30"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-black ${
                      activo ? "bg-neon" : "bg-cinema-black text-white/60"
                    }`}
                  >
                    {r.nombre.charAt(0)}
                  </span>
                  <span className="text-xs font-bold uppercase leading-tight">
                    {r.nombre}
                  </span>
                </button>
              );
            })}
          </div>
          {/*
            // TODO: conectar con el flujo de admin/domicilios cuando se
            // implemente Supabase. Al confirmar un pedido con tipoEntrega
            // "domicilio", deberá crearse un PedidoDomicilio (estado
            // "pendiente") para asignarle repartidor desde
            // /admin/domicilios. La estructura de Pedido ya es compatible:
            // usar pedidoToDomicilioInput(pedido) para el mapeo de campos.
            // De momento el pedido queda en el tablero /caja/reparto para
            // que el repartidor lo acepte.
          */}
        </div>
      )}

      {/* Comisión del domiciliario — solo cuando es domicilio */}
      {esDomicilio && (
        <div className="mb-4">
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/50">
            Comisión domiciliario ({formatCOP(COMISION_REPARTIDOR)})
          </label>
          <div className="grid grid-cols-2 gap-2">
            {COMISION_OPCIONES.map((opcion) => {
              const activo = comisionPagadaPor === opcion;
              return (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => onComisionPagadaPor(opcion)}
                  aria-pressed={activo}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-[11px] font-bold uppercase tracking-wide transition ${
                    activo
                      ? "border-neon bg-neon/15 text-white"
                      : "border-white/10 text-white/55 hover:border-white/30"
                  }`}
                >
                  <span>{opcion === "cliente" ? "🧾" : "🏪"}</span>
                  {TIPO_COMISION_LABEL[opcion]}
                </button>
              );
            })}
          </div>
          {comisionPagadaPor === "cliente" && (
            <p className="mt-1.5 text-[11px] text-amber-400">
              Se suma {formatCOP(COMISION_REPARTIDOR)} al total del pedido.
            </p>
          )}
          {comisionPagadaPor === "restaurante" && (
            <p className="mt-1.5 text-[11px] text-white/35">
              El restaurante absorbe la comisión. No afecta al cliente.
            </p>
          )}
        </div>
      )}

      {/* Paga con + devuelta — solo domicilio en efectivo */}
      {esDomicilio && formaPago === "efectivo" && (
        <div className="mb-5">
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/50">
            ¿Con cuánto paga el cliente?
          </label>
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-cinema-black px-4 py-3">
            <span className="text-base font-bold text-white/40">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={pagaCon ? pagaCon.toLocaleString("es-CO") : ""}
              onChange={(e) => onPagaCon(Number(e.target.value.replace(/\D/g, "")) || 0)}
              placeholder="0"
              className={`w-full bg-transparent font-black text-lg text-white placeholder:font-medium placeholder:text-white/30 focus:outline-none ${
                pagaConInsuficiente ? "text-red-400" : ""
              }`}
            />
          </div>
          {pagaConInsuficiente && (
            <p className="mt-1.5 text-[11px] font-bold text-red-400">
              El cliente paga menos de lo que vale el pedido.
            </p>
          )}
          {devuelta !== null && devuelta >= 0 && pagaCon > 0 && (
            <div className="mt-2 flex items-center justify-between rounded-lg border border-amber-700/40 bg-amber-900/10 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-400">
                  Devuelta al cliente
                </p>
                <p className="mt-0.5 text-[10px] text-white/40">
                  {formatCOP(pagaCon)} − {formatCOP(totalConComision)}
                </p>
              </div>
              <p className="font-[family-name:var(--font-display)] text-lg text-amber-400">
                {formatCOP(devuelta)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Desglose del total */}
      {esDomicilio && comisionPagadaPor === "cliente" && (
        <div className="mb-3 flex items-center justify-between border-t border-white/8 pt-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Subtotal productos
            </p>
          </div>
          <p className="text-sm text-white/60">{formatCOP(total)}</p>
        </div>
      )}
      {esDomicilio && comisionPagadaPor === "cliente" && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Comisión domiciliario
          </p>
          <p className="text-sm text-amber-400">{formatCOP(COMISION_REPARTIDOR)}</p>
        </div>
      )}

      {/* Total + confirmar */}
      <div className="mb-4 flex items-center justify-between border-t border-white/8 pt-4">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
          Total a cobrar
        </span>
        <span className="font-[family-name:var(--font-display)] text-2xl text-white">
          {formatCOP(totalConComision)}
        </span>
      </div>

      <button
        type="button"
        onClick={onConfirmar}
        disabled={!puedeConfirmar}
        className="w-full rounded-full bg-neon py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-neon-soft disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
      >
        {carritoVacio
          ? "Carrito vacío"
          : sinRepartidor
            ? "Selecciona un repartidor"
            : sinComision
              ? "Elige quién paga comisión"
              : `Confirmar pedido · ${formatCOP(totalConComision)}`}
      </button>
    </div>
  );
}
