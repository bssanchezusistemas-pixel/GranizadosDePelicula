"use client";

import { useEffect, useMemo, useState } from "react";
import type { DomiciliarioConResumen, Canal, FormaPago } from "@/data/domicilios";
import { calcularDevuelta, trabajaSinBase } from "@/data/domicilios";
import { formatCOP } from "@/lib/currency";
import { CurrencyInput } from "@/components/admin/CurrencyInput";

interface NewDeliveryModalProps {
  domiciliarios: DomiciliarioConResumen[];
  numerosPedidoUsados: string[];
  onClose: () => void;
  onSave: (input: {
    numero_pedido: string;
    domiciliario_id: string;
    canal: Canal;
    items?: string;
    direccion?: string;
    valor_pedido: number;
    forma_pago: FormaPago;
    paga_con?: number;
  }) => Promise<void>;
}

export function NewDeliveryModal({
  domiciliarios,
  numerosPedidoUsados,
  onClose,
  onSave,
}: NewDeliveryModalProps) {
  const [numeroPedido, setNumeroPedido] = useState("");
  const [domiciliarioId, setDomiciliarioId] = useState<string | null>(null);
  const [formaPago, setFormaPago] = useState<FormaPago>("efectivo");
  const [valorPedido, setValorPedido] = useState(0);
  const [registrarCambio, setRegistrarCambio] = useState(false);
  const [pagaCon, setPagaCon] = useState(0);
  const [direccion, setDireccion] = useState("");
  const [items, setItems] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numerosUsadosSet = useMemo(
    () => new Set(numerosPedidoUsados.map((n) => n.trim())),
    [numerosPedidoUsados],
  );

  const numeroDuplicado =
    numeroPedido.trim() !== "" && numerosUsadosSet.has(numeroPedido.trim());

  const domiciliarioSeleccionado = domiciliarios.find(
    (d) => d.id === domiciliarioId,
  );
  const sinBase = domiciliarioSeleccionado
    ? trabajaSinBase(domiciliarioSeleccionado.baseEfectivo)
    : false;
  const requierePagaCon = sinBase && formaPago === "efectivo";

  useEffect(() => {
    if (sinBase) {
      setRegistrarCambio(true);
    }
  }, [sinBase, domiciliarioId]);

  const devuelta = useMemo(
    () =>
      registrarCambio || sinBase
        ? calcularDevuelta({
            forma_pago: formaPago,
            valor_pedido: valorPedido,
            paga_con: pagaCon,
          })
        : null,
    [formaPago, valorPedido, pagaCon, registrarCambio, sinBase],
  );

  const pagaConInsuficiente =
    (registrarCambio || requierePagaCon) &&
    formaPago === "efectivo" &&
    pagaCon > 0 &&
    pagaCon < valorPedido;

  const puedeGuardar =
    numeroPedido.trim() !== "" &&
    !numeroDuplicado &&
    domiciliarioId !== null &&
    valorPedido > 0 &&
    (!requierePagaCon
      ? !registrarCambio ||
        formaPago === "transferencia" ||
        (pagaCon > 0 && !pagaConInsuficiente)
      : pagaCon > 0 && !pagaConInsuficiente);

  async function handleSave() {
    if (!puedeGuardar || !domiciliarioId) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        numero_pedido: numeroPedido.trim(),
        domiciliario_id: domiciliarioId,
        canal: "whatsapp",
        items: items.trim() || undefined,
        direccion: direccion.trim() || undefined,
        valor_pedido: valorPedido,
        forma_pago: formaPago,
        paga_con:
          formaPago === "efectivo" && (registrarCambio || sinBase) && pagaCon > 0
            ? pagaCon
            : undefined,
      });
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo guardar el domicilio.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-neon">
              Asignar entrega
            </p>
            <h2 className="font-black text-xl">NUEVO DOMICILIO</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div>
            <label className="mb-2.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Número de pedido <span className="text-neon">*</span>
              <span className="text-[11px] font-medium normal-case text-zinc-600">
                — viene de la comanda impresa
              </span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={numeroPedido}
              onChange={(e) => setNumeroPedido(e.target.value.replace(/\D/g, ""))}
              placeholder="Ej: 5752"
              className={`w-full rounded-lg border bg-zinc-800 px-4 py-3.5 text-base font-bold text-white placeholder:font-medium placeholder:text-zinc-600 focus:outline-none ${
                numeroDuplicado
                  ? "border-red-500 focus:border-red-500"
                  : "border-zinc-700 focus:border-neon"
              }`}
            />
            {numeroDuplicado && (
              <p className="mt-2 text-xs font-bold text-red-400">
                El pedido #{numeroPedido} ya existe. Cada comanda del POS debe ser
                única.
              </p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              ¿Quién lo lleva? <span className="text-neon">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {domiciliarios.length === 0 && (
                <p className="col-span-full rounded-lg border border-amber-700/40 bg-amber-900/10 px-4 py-3 text-xs text-amber-200">
                  No hay domiciliarios visibles.
                </p>
              )}
              {domiciliarios.map((dom) => {
                const selected = domiciliarioId === dom.id;
                return (
                  <button
                    key={dom.id}
                    type="button"
                    onClick={() => setDomiciliarioId(dom.id)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3.5 text-center transition ${
                      selected
                        ? "border-neon bg-neon/15"
                        : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-md font-black text-sm ${
                        selected ? "bg-neon" : "bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {dom.nombre.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold">{dom.nombre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Forma de pago <span className="text-neon">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setFormaPago("efectivo");
                }}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                  formaPago === "efectivo"
                    ? "border-neon bg-neon/15"
                    : "border-zinc-700 bg-zinc-800"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-md text-base ${
                    formaPago === "efectivo" ? "bg-neon" : "bg-zinc-700"
                  }`}
                >
                  💵
                </div>
                <div>
                  <div className="text-sm font-bold">Efectivo</div>
                  <div className="text-[11px] text-zinc-500">
                    El domiciliario lo cobra
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormaPago("transferencia");
                  setRegistrarCambio(false);
                  setPagaCon(0);
                }}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                  formaPago === "transferencia"
                    ? "border-blue-500 bg-blue-900/15"
                    : "border-zinc-700 bg-zinc-800"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-md text-base ${
                    formaPago === "transferencia" ? "bg-blue-500" : "bg-zinc-700"
                  }`}
                >
                  📲
                </div>
                <div>
                  <div className="text-sm font-bold">Transferencia</div>
                  <div className="text-[11px] text-zinc-500">Ya está pagado</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Valor del pedido <span className="text-neon">*</span>
              <span className="text-[11px] font-medium normal-case text-zinc-600">
                — el que aparece en la comanda
              </span>
            </label>
            <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3.5">
              <span className="text-lg font-bold text-zinc-500">$</span>
              <CurrencyInput
                value={valorPedido}
                onChange={setValorPedido}
                placeholder="0"
                className="w-full bg-transparent font-black text-xl text-white placeholder:text-zinc-600 focus:outline-none"
              />
            </div>
          </div>

          {formaPago === "efectivo" && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
              {sinBase && (
                <p className="mb-4 rounded-lg border border-amber-700/40 bg-amber-900/15 px-3 py-2 text-[11px] text-amber-200">
                  Sin base de cambio: debes registrar con cuánto paga el cliente
                  para calcular la devuelta que presta la tienda.
                </p>
              )}
              {!sinBase && (
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={registrarCambio}
                    onChange={(e) => {
                      setRegistrarCambio(e.target.checked);
                      if (!e.target.checked) setPagaCon(0);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-600 accent-[#ff0033]"
                  />
                  <div>
                    <span className="text-sm font-bold text-white">
                      Registrar cambio del cliente
                    </span>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                      Opcional. Actívalo si el cliente paga con billete grande o
                      si necesitas anotar cuánto cambio llevar.
                    </p>
                  </div>
                </label>
              )}

              {(registrarCambio || sinBase) && (
                <div className="mt-4 border-t border-zinc-800 pt-4">
                  <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                    ¿Con cuánto paga el cliente? <span className="text-neon">*</span>
                  </label>
                  <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3.5">
                    <span className="text-lg font-bold text-zinc-500">$</span>
                    <CurrencyInput
                      value={pagaCon}
                      onChange={setPagaCon}
                      placeholder="0"
                      className="w-full bg-transparent font-black text-xl text-white placeholder:text-zinc-600 focus:outline-none"
                    />
                  </div>

                  {pagaConInsuficiente && (
                    <p className="mt-2 text-xs font-bold text-red-400">
                      El cliente paga menos de lo que vale el pedido.
                    </p>
                  )}

                  {devuelta !== null && devuelta >= 0 && pagaCon > 0 && (
                    <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-700/40 bg-amber-900/10 px-4 py-4">
                      <div>
                        <p className="text-xs font-bold text-amber-400">
                          {sinBase
                            ? "SOLO DINERO DE LAS DEVUELTAS"
                            : "DEBE LLEVAR CAMBIO"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          {formatCOP(pagaCon)} − {formatCOP(valorPedido)} = devuelta
                        </p>
                      </div>
                      <p className="font-black text-xl text-amber-400">
                        {formatCOP(devuelta)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                Dirección (opcional)
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Cra 8 #5-18..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-neon focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                Detalle del pedido (opcional)
              </label>
              <input
                type="text"
                value={items}
                onChange={(e) => setItems(e.target.value)}
                placeholder="1x Domicilio Granizados, 4x Raspado..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-neon focus:outline-none"
              />
            </div>
          </div>

          {domiciliarioSeleccionado && valorPedido > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
              <p className="mb-3.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                Así queda registrado
              </p>
              <SummaryRow label="Pedido" value={`#${numeroPedido || "—"}`} />
              <SummaryRow
                label="Domiciliario"
                value={domiciliarioSeleccionado.nombre}
              />
              <SummaryRow
                label="Forma de pago"
                value={formaPago === "efectivo" ? "Efectivo" : "Transferencia"}
              />
              <SummaryRow label="Valor del pedido" value={formatCOP(valorPedido)} />
              {formaPago === "efectivo" && (registrarCambio || sinBase) && pagaCon > 0 && (
                <>
                  <SummaryRow label="Cliente paga con" value={formatCOP(pagaCon)} />
                  <SummaryRow
                    label={
                      sinBase ? "Solo dinero de las devueltas" : "Debe llevar de cambio"
                    }
                    value={formatCOP(devuelta ?? 0)}
                  />
                </>
              )}
              {formaPago === "efectivo" && sinBase && pagaCon > 0 && (
                <SummaryRow
                  label="Debe entregar al cierre"
                  value={formatCOP(pagaCon)}
                />
              )}
              {formaPago === "efectivo" && !sinBase && !registrarCambio && (
                <p className="mt-2 border-t border-zinc-800 pt-3 text-[11px] text-zinc-500">
                  Al cierre del día suma {formatCOP(valorPedido)} a las ventas en
                  efectivo (base + ventas).
                </p>
              )}
              {formaPago === "efectivo" && sinBase && pagaCon > 0 && (
                <p className="mt-2 border-t border-zinc-800 pt-3 text-[11px] text-zinc-500">
                  Al cierre suma {formatCOP(pagaCon)} (cobro del cliente), no solo{" "}
                  {formatCOP(valorPedido)} de venta.
                </p>
              )}
              {formaPago === "transferencia" && (
                <p className="mt-2 border-t border-zinc-800 pt-3 text-[11px] text-zinc-500">
                  Ya pagado — no suma al efectivo del cierre.
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm font-bold text-red-400">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-700 py-3.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!puedeGuardar || saving}
            className="flex-[2] rounded-lg bg-neon py-3.5 text-xs font-black tracking-wide hover:bg-neon-soft disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {saving ? "GUARDANDO..." : "ASIGNAR Y GUARDAR"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 text-[13px] text-zinc-400">
      <span>{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}
