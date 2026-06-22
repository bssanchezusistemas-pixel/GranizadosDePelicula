"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  DomiciliarioConResumen,
  Canal,
  FormaPago,
  PedidoDomicilio,
  EditarPedidoInput,
} from "@/data/domicilios";
import { calcularDevuelta, trabajaSinBase } from "@/data/domicilios";
import { formatCOP } from "@/lib/currency";
import { CurrencyInput } from "@/components/admin/CurrencyInput";

interface EditDeliveryModalProps {
  pedido: PedidoDomicilio;
  domiciliarios: DomiciliarioConResumen[];
  numerosPedidoUsados: string[];
  onClose: () => void;
  onSave: (input: EditarPedidoInput) => Promise<void>;
}

export function EditDeliveryModal({
  pedido,
  domiciliarios,
  numerosPedidoUsados,
  onClose,
  onSave,
}: EditDeliveryModalProps) {
  const [numeroPedido, setNumeroPedido] = useState(pedido.numero_pedido);
  const [domiciliarioId, setDomiciliarioId] = useState<string | null>(
    pedido.domiciliario_id,
  );
  const [formaPago, setFormaPago] = useState<FormaPago>(pedido.forma_pago);
  const [valorPedido, setValorPedido] = useState(Number(pedido.valor_pedido));
  const hadCambio =
    pedido.forma_pago === "efectivo" &&
    pedido.paga_con != null &&
    Number(pedido.paga_con) > Number(pedido.valor_pedido);
  const [registrarCambio, setRegistrarCambio] = useState(hadCambio);
  const [pagaCon, setPagaCon] = useState(Number(pedido.paga_con ?? 0));
  const [direccion, setDireccion] = useState(pedido.direccion ?? "");
  const [items, setItems] = useState(pedido.items ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numerosUsadosSet = useMemo(
    () =>
      new Set(
        numerosPedidoUsados
          .filter((n) => n.trim() !== pedido.numero_pedido.trim())
          .map((n) => n.trim()),
      ),
    [numerosPedidoUsados, pedido.numero_pedido],
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
        id: pedido.id,
        numero_pedido: numeroPedido.trim(),
        domiciliario_id: domiciliarioId,
        canal: pedido.canal as Canal,
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
        e instanceof Error ? e.message : "No se pudo actualizar el pedido.",
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
              Corregir pedido
            </p>
            <h2 className="font-black text-xl">EDITAR DOMICILIO</h2>
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
            <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Número de pedido <span className="text-neon">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={numeroPedido}
              onChange={(e) => setNumeroPedido(e.target.value.replace(/\D/g, ""))}
              className={`w-full rounded-lg border bg-zinc-800 px-4 py-3.5 text-base font-bold text-white focus:outline-none ${
                numeroDuplicado
                  ? "border-red-500"
                  : "border-zinc-700 focus:border-neon"
              }`}
            />
            {numeroDuplicado && (
              <p className="mt-2 text-xs font-bold text-red-400">
                El pedido #{numeroPedido} ya existe.
              </p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Domiciliario <span className="text-neon">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {domiciliarios.map((dom) => {
                const selected = domiciliarioId === dom.id;
                return (
                  <button
                    key={dom.id}
                    type="button"
                    onClick={() => setDomiciliarioId(dom.id)}
                    className={`rounded-lg border p-3 text-xs font-bold transition ${
                      selected
                        ? "border-neon bg-neon/15"
                        : "border-zinc-700 bg-zinc-800"
                    }`}
                  >
                    {dom.nombre}
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
              {(["efectivo", "transferencia"] as const).map((fp) => (
                <button
                  key={fp}
                  type="button"
                  onClick={() => {
                    setFormaPago(fp);
                    if (fp === "transferencia") {
                      setRegistrarCambio(false);
                      setPagaCon(0);
                    }
                  }}
                  className={`rounded-lg border py-3 text-xs font-bold ${
                    formaPago === fp
                      ? "border-neon bg-neon/15"
                      : "border-zinc-700 bg-zinc-800"
                  }`}
                >
                  {fp === "efectivo" ? "Efectivo" : "Transferencia"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Valor del pedido <span className="text-neon">*</span>
            </label>
            <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3.5">
              <span className="text-lg font-bold text-zinc-500">$</span>
              <CurrencyInput
                value={valorPedido}
                onChange={setValorPedido}
                className="w-full bg-transparent font-black text-xl text-white focus:outline-none"
              />
            </div>
          </div>

          {formaPago === "efectivo" && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
              {sinBase && (
                <p className="mb-4 rounded-lg border border-amber-700/40 bg-amber-900/15 px-3 py-2 text-[11px] text-amber-200">
                  Sin base: registra con cuánto paga el cliente.
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
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Opcional — para anotar billete y cambio a devolver.
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
                      className="w-full bg-transparent font-black text-xl text-white focus:outline-none"
                    />
                  </div>
                  {pagaConInsuficiente && (
                    <p className="mt-2 text-xs font-bold text-red-400">
                      El cliente paga menos de lo que vale el pedido.
                    </p>
                  )}
                  {devuelta !== null && devuelta > 0 && pagaCon > 0 && (
                    <p className="mt-2 text-xs text-amber-400">
                      {sinBase ? "Solo dinero de las devueltas" : "Cambio"}:{" "}
                      {formatCOP(devuelta)}
                    </p>
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
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white focus:border-neon focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                Detalle (opcional)
              </label>
              <input
                type="text"
                value={items}
                onChange={(e) => setItems(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white focus:border-neon focus:outline-none"
              />
            </div>
          </div>

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
            {saving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
          </button>
        </div>
      </div>
    </div>
  );
}
