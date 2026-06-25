"use client";

import Link from "next/link";
import { formatCOP } from "@/lib/currency";
import {
  PagoEfectivoBlock,
  validarPagoEfectivo,
} from "@/components/caja/PagoEfectivoBlock";
import {
  COMISION_DOMICILIO,
  FORMA_PAGO_LABEL,
  TIPO_COMISION_LABEL,
  TIPO_ENTREGA_LABEL,
  type DomiciliarioConJornada,
  type TipoComision,
  type TipoEntrega,
} from "@/data/caja";
import type { FormaPago } from "@/data/domicilios";
import type { Ubicacion } from "@/data/caja";
import { UbicacionSelector } from "@/components/caja/UbicacionSelector";

interface CheckoutBarProps {
  total: number;
  tipoEntrega: TipoEntrega;
  formaPago: FormaPago;
  ubicaciones: Ubicacion[];
  ubicacionId: string | null;
  nombreRecoge: string;
  direccion: string;
  pagaCon: number;
  comisionPagadaPor: TipoComision | null;
  domiciliarios: DomiciliarioConJornada[];
  domiciliarioId: string | null;
  cargandoDomiciliarios: boolean;
  carritoVacio: boolean;
  confirmando: boolean;
  onTipoEntrega: (t: TipoEntrega) => void;
  onFormaPago: (f: FormaPago) => void;
  onUbicacion: (id: string | null) => void;
  onNombreRecoge: (n: string) => void;
  onDireccion: (d: string) => void;
  onPagaCon: (n: number) => void;
  onComisionPagadaPor: (t: TipoComision) => void;
  onDomiciliario: (id: string | null) => void;
  onConfirmar: () => void;
}

const TIPOS: TipoEntrega[] = ["mesa", "recoger", "domicilio"];
const PAGOS: FormaPago[] = ["efectivo", "transferencia"];
const COMISION_OPCIONES: TipoComision[] = ["cliente", "restaurante"];

export function CheckoutBar({
  total,
  tipoEntrega,
  formaPago,
  ubicaciones,
  ubicacionId,
  nombreRecoge,
  direccion,
  pagaCon,
  comisionPagadaPor,
  domiciliarios,
  domiciliarioId,
  cargandoDomiciliarios,
  carritoVacio,
  confirmando,
  onTipoEntrega,
  onFormaPago,
  onUbicacion,
  onNombreRecoge,
  onDireccion,
  onPagaCon,
  onComisionPagadaPor,
  onDomiciliario,
  onConfirmar,
}: CheckoutBarProps) {
  const esMesa = tipoEntrega === "mesa";
  const esRecoger = tipoEntrega === "recoger";
  const esDomicilio = tipoEntrega === "domicilio";

  const sinUbicacion = esMesa && !ubicacionId;
  const sinNombreRecoge = esRecoger && nombreRecoge.trim().length < 2;
  const direccionInvalida = esDomicilio && direccion.trim().length < 5;
  const sinComision = esDomicilio && !comisionPagadaPor;
  const sinDomiciliario = esDomicilio && !domiciliarioId;
  const sinJornadaDomicilio =
    esDomicilio && !cargandoDomiciliarios && domiciliarios.length === 0;

  const totalACobrar =
    esDomicilio && comisionPagadaPor === "cliente"
      ? total + COMISION_DOMICILIO
      : total;

  const requierePagoEfectivo =
    formaPago === "efectivo" && (esDomicilio || esRecoger);

  const pagoEfectivo = validarPagoEfectivo(totalACobrar, pagaCon);

  const puedeConfirmar =
    !carritoVacio &&
    !sinUbicacion &&
    !sinNombreRecoge &&
    !direccionInvalida &&
    !sinComision &&
    !sinDomiciliario &&
    !sinJornadaDomicilio &&
    (!requierePagoEfectivo || pagoEfectivo.ok) &&
    !confirmando;

  return (
    <div className="rounded-2xl border border-white/8 bg-cinema-gray p-5">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-neon">
        Cerrar venta
      </p>

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

      {esMesa && (
        <div className="mb-4">
          <label className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-white/50">
            Mesa, banco o barra <span className="text-neon">*</span>
          </label>
          <UbicacionSelector
            ubicaciones={ubicaciones}
            seleccionadaId={ubicacionId}
            onSelect={onUbicacion}
          />
          {sinUbicacion && (
            <p className="mt-2 text-[11px] font-bold text-red-400">
              Selecciona dónde se sirve el pedido.
            </p>
          )}
          {ubicacionId &&
            ubicaciones.find((u) => u.id === ubicacionId)?.estado ===
              "ocupada" && (
              <p className="mt-2 text-[11px] text-amber-400">
                Mesa ocupada — se agregarán productos al pedido abierto.
              </p>
            )}
        </div>
      )}

      {esRecoger && (
        <div className="mb-4">
          <label className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-white/50">
            Nombre de quien recoge <span className="text-neon">*</span>
          </label>
          <input
            type="text"
            value={nombreRecoge}
            onChange={(e) => onNombreRecoge(e.target.value)}
            placeholder="Ej. Juan Pérez"
            className={`w-full rounded-lg border bg-cinema-black px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none ${
              sinNombreRecoge
                ? "border-red-500 focus:border-red-500"
                : "border-white/10 focus:border-neon"
            }`}
          />
        </div>
      )}

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

      {esDomicilio && (
        <div className="mb-4">
          <label className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-white/50">
            Repartidor <span className="text-neon">*</span>
          </label>
          {cargandoDomiciliarios ? (
            <p className="text-sm text-white/40">Cargando repartidores...</p>
          ) : domiciliarios.length === 0 ? (
            <div className="rounded-lg border border-amber-700/40 bg-amber-900/10 px-4 py-3 text-sm text-amber-200">
              <p className="font-bold">No hay repartidores con jornada iniciada.</p>
              <p className="mt-1 text-amber-200/80">
                El admin debe iniciar jornada en{" "}
                <Link href="/caja/domicilios" className="underline">
                  Domicilios
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {domiciliarios.map((d) => {
                const activo = domiciliarioId === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onDomiciliario(d.id)}
                    aria-pressed={activo}
                    className={`rounded-lg border py-3 text-sm font-bold transition ${
                      activo
                        ? "border-neon bg-neon/15 text-white"
                        : "border-white/10 text-white/60 hover:border-white/30"
                    }`}
                  >
                    {d.nombre}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

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
        </div>
      )}

      {esDomicilio && (
        <div className="mb-4">
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/50">
            Comisión domicilio ({formatCOP(COMISION_DOMICILIO)})
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
                  {TIPO_COMISION_LABEL[opcion]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {requierePagoEfectivo && (
        <PagoEfectivoBlock
          total={totalACobrar}
          pagaCon={pagaCon}
          onPagaCon={onPagaCon}
        />
      )}

      <div className="mb-4 flex items-center justify-between border-t border-white/8 pt-4">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
          Total a cobrar
        </span>
        <span className="font-[family-name:var(--font-display)] text-2xl text-white">
          {formatCOP(totalACobrar)}
        </span>
      </div>

      <button
        type="button"
        onClick={onConfirmar}
        disabled={!puedeConfirmar}
        className="w-full rounded-full bg-neon py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-neon-soft disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
      >
        {confirmando
          ? "Enviando..."
          : carritoVacio
            ? "Carrito vacío"
            : sinUbicacion
              ? "Selecciona mesa"
              : sinJornadaDomicilio
              ? "Inicia jornada en Domicilios"
              : sinDomiciliario
                ? "Selecciona repartidor"
                : sinComision
                  ? "Elige quién paga comisión"
                  : `Confirmar pedido · ${formatCOP(totalACobrar)}`}
      </button>
    </div>
  );
}
