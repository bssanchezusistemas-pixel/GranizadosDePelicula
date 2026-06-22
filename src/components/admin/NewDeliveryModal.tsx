// src/components/admin/NewDeliveryModal.tsx
"use client";

import { useMemo, useState } from "react";
import type { Domiciliario, Canal, FormaPago } from "@/data/domicilios";
import { calcularDevuelta } from "@/data/domicilios";

interface NewDeliveryModalProps {
  domiciliarios: Domiciliario[];
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

function formatCOP(value: number) {
  return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export function NewDeliveryModal({ domiciliarios, onClose, onSave }: NewDeliveryModalProps) {
  const [numeroPedido, setNumeroPedido] = useState("");
  const [domiciliarioId, setDomiciliarioId] = useState<string | null>(null);
  const [formaPago, setFormaPago] = useState<FormaPago>("efectivo");
  const [valorPedido, setValorPedido] = useState<number>(0);
  const [pagaCon, setPagaCon] = useState<number>(0);
  const [direccion, setDireccion] = useState("");
  const [items, setItems] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const devuelta = useMemo(
    () => calcularDevuelta({ forma_pago: formaPago, valor_pedido: valorPedido, paga_con: pagaCon }),
    [formaPago, valorPedido, pagaCon]
  );

  const pagaConInsuficiente = formaPago === "efectivo" && pagaCon > 0 && pagaCon < valorPedido;

  const puedeGuardar =
    numeroPedido.trim() !== "" &&
    domiciliarioId !== null &&
    valorPedido > 0 &&
    (formaPago === "transferencia" || (pagaCon > 0 && !pagaConInsuficiente));

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
        paga_con: formaPago === "efectivo" ? pagaCon : undefined,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el domicilio.");
    } finally {
      setSaving(false);
    }
  }

  const domiciliarioSeleccionado = domiciliarios.find((d) => d.id === domiciliarioId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-red-500">
              Asignar entrega
            </div>
            <div className="font-black text-xl">NUEVO DOMICILIO</div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          {/* Número de pedido */}
          <div>
            <label className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Número de pedido <span className="text-red-500">*</span>
              <span className="text-[11px] font-medium normal-case text-zinc-600">
                — viene de la comanda impresa
              </span>
            </label>
            <input
              type="text"
              value={numeroPedido}
              onChange={(e) => setNumeroPedido(e.target.value)}
              placeholder="Ej: 5752"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3.5 text-base font-bold text-white placeholder:font-medium placeholder:text-zinc-600 focus:border-red-600 focus:outline-none"
            />
          </div>

          {/* Domiciliario */}
          <div>
            <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              ¿Quién lo lleva? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {domiciliarios.map((dom) => {
                const selected = domiciliarioId === dom.id;
                return (
                  <button
                    key={dom.id}
                    onClick={() => setDomiciliarioId(dom.id)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3.5 text-center transition ${
                      selected
                        ? "border-red-600 bg-red-900/15"
                        : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-md font-black text-sm ${
                        selected ? "bg-red-600" : "bg-zinc-700 text-zinc-300"
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

          {/* Forma de pago */}
          <div>
            <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Forma de pago <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setFormaPago("efectivo")}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                  formaPago === "efectivo"
                    ? "border-red-600 bg-red-900/15"
                    : "border-zinc-700 bg-zinc-800"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-md text-base ${
                    formaPago === "efectivo" ? "bg-red-600" : "bg-zinc-700"
                  }`}
                >
                  💵
                </div>
                <div>
                  <div className="text-sm font-bold">Efectivo</div>
                  <div className="text-[11px] text-zinc-500">El domiciliario lo cobra</div>
                </div>
              </button>
              <button
                onClick={() => setFormaPago("transferencia")}
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

          {/* Valor del pedido */}
          <div>
            <label className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Valor del pedido <span className="text-red-500">*</span>
              <span className="text-[11px] font-medium normal-case text-zinc-600">
                — el que aparece en la comanda
              </span>
            </label>
            <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3.5">
              <input
                type="number"
                value={valorPedido || ""}
                onChange={(e) => setValorPedido(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-transparent font-black text-xl text-white placeholder:text-zinc-600 focus:outline-none"
              />
              <span className="rounded bg-zinc-700 px-2.5 py-1 text-[10px] font-bold text-zinc-400">
                MANUAL
              </span>
            </div>
          </div>

          {/* Con cuánto paga (solo efectivo) */}
          {formaPago === "efectivo" && (
            <div>
              <label className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                ¿Con cuánto paga el cliente? <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={pagaCon || ""}
                onChange={(e) => setPagaCon(Number(e.target.value))}
                placeholder="0"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3.5 font-black text-xl text-white placeholder:text-zinc-600 focus:border-red-600 focus:outline-none"
              />

              {pagaConInsuficiente && (
                <p className="mt-2 text-xs font-bold text-red-400">
                  El cliente paga menos de lo que vale el pedido. Revisa el valor.
                </p>
              )}

              {devuelta !== null && devuelta >= 0 && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-700/40 bg-amber-900/10 px-4 py-4">
                  <div>
                    <div className="text-xs font-bold text-amber-400">⚠ DEBE LLEVAR CAMBIO</div>
                    <div className="mt-0.5 text-[11px] text-zinc-500">
                      {formatCOP(pagaCon)} − {formatCOP(valorPedido)} = devuelta
                    </div>
                  </div>
                  <div className="font-black text-xl text-amber-400">{formatCOP(devuelta)}</div>
                </div>
              )}
            </div>
          )}

          {/* Dirección e items (opcionales) */}
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
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-red-600 focus:outline-none"
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
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-red-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Resumen */}
          {domiciliarioSeleccionado && valorPedido > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
              <div className="mb-3.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                Así queda registrado
              </div>
              <SummaryRow label="Pedido" value={`#${numeroPedido || "—"}`} />
              <SummaryRow label="Domiciliario" value={domiciliarioSeleccionado.nombre} />
              <SummaryRow label="Forma de pago" value={formaPago === "efectivo" ? "Efectivo" : "Transferencia"} />
              <SummaryRow label="Valor del pedido" value={formatCOP(valorPedido)} />
              {formaPago === "efectivo" && pagaCon > 0 && (
                <>
                  <SummaryRow label="Cliente paga con" value={formatCOP(pagaCon)} />
                  <SummaryRow label="Debe llevar de cambio" value={formatCOP(devuelta ?? 0)} />
                </>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-zinc-800 pt-3 text-sm">
                <span>{domiciliarioSeleccionado.nombre} debe traer al final</span>
                <span className="font-black text-red-400">
                  {formaPago === "efectivo" ? formatCOP(valorPedido) + " en efectivo" : "Nada (ya pagado)"}
                </span>
              </div>
            </div>
          )}

          {error && <p className="text-sm font-bold text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-5">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-700 py-3.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
          >
            CANCELAR
          </button>
          <button
            onClick={handleSave}
            disabled={!puedeGuardar || saving}
            className="flex-[2] rounded-lg bg-red-600 py-3.5 text-xs font-black tracking-wide hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
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
