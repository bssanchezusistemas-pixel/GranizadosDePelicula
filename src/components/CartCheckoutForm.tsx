"use client";

import { useState } from "react";
import { useCart, type TipoEntregaCliente } from "@/context/CartContext";
import type { FormaPago } from "@/data/domicilios";

const TIPOS: { id: TipoEntregaCliente; label: string }[] = [
  { id: "recoger", label: "Recoger en local" },
  { id: "domicilio", label: "Domicilio" },
];

const PAGOS: FormaPago[] = ["efectivo", "transferencia"];

const PAGO_LABEL: Record<FormaPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

export function CartCheckoutForm() {
  const {
    tipoEntrega,
    direccion,
    nombreRecoge,
    formaPago,
    setTipoEntrega,
    setDireccion,
    setNombreRecoge,
    setFormaPago,
  } = useCart();

  const [touched, setTouched] = useState({
    direccion: false,
    nombreRecoge: false,
  });

  const esDomicilio = tipoEntrega === "domicilio";
  const direccionInvalida = esDomicilio && direccion.trim().length < 5;
  const nombreInvalido = !esDomicilio && nombreRecoge.trim().length < 2;

  return (
    <div className="space-y-4 border-t border-white/10 pt-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">
        Entrega
      </p>

      <div className="grid grid-cols-2 gap-2">
        {TIPOS.map((tipo) => {
          const activo = tipoEntrega === tipo.id;
          return (
            <button
              key={tipo.id}
              type="button"
              onClick={() => {
                setTipoEntrega(tipo.id);
                setTouched({ direccion: false, nombreRecoge: false });
              }}
              className={`rounded-lg border px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide transition ${
                activo
                  ? "border-neon bg-neon/15 text-white"
                  : "border-white/10 text-white/55 hover:border-white/25"
              }`}
            >
              {tipo.label}
            </button>
          );
        })}
      </div>

      {esDomicilio ? (
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-white/50">
            Dirección de entrega
          </label>
          <textarea
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, direccion: true }))}
            placeholder="Calle, barrio, referencia..."
            rows={2}
            className="w-full resize-none rounded-lg border border-white/10 bg-cinema-black px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-neon focus:outline-none"
          />
          {touched.direccion && direccionInvalida && (
            <p className="mt-1 text-[11px] text-amber-400">
              Escribe la dirección completa (mín. 5 caracteres).
            </p>
          )}
        </div>
      ) : (
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-white/50">
            Nombre de quien recoge
          </label>
          <input
            type="text"
            value={nombreRecoge}
            onChange={(e) => setNombreRecoge(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, nombreRecoge: true }))}
            placeholder="Tu nombre"
            className="w-full rounded-lg border border-white/10 bg-cinema-black px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-neon focus:outline-none"
          />
          {touched.nombreRecoge && nombreInvalido && (
            <p className="mt-1 text-[11px] text-amber-400">
              Indica el nombre de quien recogerá el pedido.
            </p>
          )}
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">
          Forma de pago
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PAGOS.map((pago) => {
            const activo = formaPago === pago;
            return (
              <button
                key={pago}
                type="button"
                onClick={() => setFormaPago(pago)}
                className={`rounded-lg border px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide transition ${
                  activo
                    ? "border-neon bg-neon/15 text-white"
                    : "border-white/10 text-white/55 hover:border-white/25"
                }`}
              >
                {PAGO_LABEL[pago]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
