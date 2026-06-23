"use client";

import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/caja/ProductGrid";
import { CartPanel } from "@/components/caja/CartPanel";
import { CheckoutBar } from "@/components/caja/CheckoutBar";
import { useVentas } from "@/context/VentasContext";
import type {
  FormaPago,
  ItemPedido,
  Pedido,
  TipoComision,
  TipoEntrega,
} from "@/data/ventas";
import { REPARTIDORES } from "@/data/ventas";

/** Clave compuesta: mismo producto con distinto tamaño son líneas distintas. */
function itemKey(i: ItemPedido): string {
  return `${i.productoId}::${i.nombre}`;
}

export default function CajaPage() {
  const { agregarPedido, siguienteNumero } = useVentas();

  const [items, setItems] = useState<ItemPedido[]>([]);
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("local");
  const [formaPago, setFormaPago] = useState<FormaPago>("efectivo");
  const [direccion, setDireccion] = useState("");
  const [domiciliarioId, setDomiciliarioId] = useState<string | null>(null);
  const [pagaCon, setPagaCon] = useState(0);
  const [comisionPagadaPor, setComisionPagadaPor] = useState<TipoComision | null>(null);
  const [ultimoPedido, setUltimoPedido] = useState<Pedido | null>(null);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + i.precioUnitario * i.cantidad,
        0,
      ),
    [items],
  );

  function agregarAlCarrito(nuevo: ItemPedido) {
    setItems((prev) => {
      const key = itemKey(nuevo);
      const existente = prev.find((i) => itemKey(i) === key);
      if (existente) {
        return prev.map((i) =>
          itemKey(i) === key ? { ...i, cantidad: i.cantidad + 1 } : i,
        );
      }
      return [...prev, nuevo];
    });
  }

  function incrementar(productoId: string, nombre: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.productoId === productoId && i.nombre === nombre
          ? { ...i, cantidad: i.cantidad + 1 }
          : i,
      ),
    );
  }

  function decrementar(productoId: string, nombre: string) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productoId === productoId && i.nombre === nombre
            ? { ...i, cantidad: i.cantidad - 1 }
            : i,
        )
        .filter((i) => i.cantidad > 0),
    );
  }

  function quitar(productoId: string, nombre: string) {
    setItems((prev) =>
      prev.filter(
        (i) => !(i.productoId === productoId && i.nombre === nombre),
      ),
    );
  }

  function vaciar() {
    setItems([]);
  }

  function confirmar() {
    if (items.length === 0) return;
    if (tipoEntrega === "domicilio" && direccion.trim().length < 5) return;
    if (tipoEntrega === "domicilio" && !domiciliarioId) return;

    const repartidor = REPARTIDORES.find((r) => r.id === domiciliarioId);

    // Si el cliente paga la comisión, se suma al total del pedido.
    const totalPedido =
      tipoEntrega === "domicilio" && comisionPagadaPor === "cliente"
        ? total + 3000
        : total;

    const creado = agregarPedido({
      items,
      total: totalPedido,
      tipoEntrega,
      formaPago,
      direccion: tipoEntrega === "domicilio" ? direccion.trim() : undefined,
      domiciliarioId: tipoEntrega === "domicilio" ? domiciliarioId ?? undefined : undefined,
      domiciliarioNombre:
        tipoEntrega === "domicilio" ? repartidor?.nombre : undefined,
      pagaCon:
        tipoEntrega === "domicilio" && formaPago === "efectivo" && pagaCon > 0
          ? pagaCon
          : undefined,
      comisionPagadaPor:
        tipoEntrega === "domicilio" ? comisionPagadaPor ?? undefined : undefined,
    });

    // Limpieza del carrito para el siguiente cliente.
    setItems([]);
    setDireccion("");
    setDomiciliarioId(null);
    setPagaCon(0);
    setComisionPagadaPor(null);
    setUltimoPedido(creado);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neon">
            Estación de caja
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase text-white sm:text-3xl">
            Toma de pedidos
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/8 bg-cinema-gray px-4 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Próximo #
            </p>
            <p className="font-[family-name:var(--font-display)] text-xl text-neon">
              {siguienteNumero}
            </p>
          </div>
        </div>
      </div>

      {ultimoPedido && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-700/40 bg-emerald-900/15 px-5 py-3">
          <p className="text-sm font-bold text-emerald-300">
            ✓ Pedido #{ultimoPedido.numeroPedido} confirmado
          </p>
          <button
            type="button"
            onClick={() => setUltimoPedido(null)}
            className="rounded-lg border border-emerald-700/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300 hover:bg-emerald-900/30"
          >
            Cerrar aviso
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Columna izquierda: catálogo */}
        <div className="min-w-0">
          <ProductGrid onAdd={agregarAlCarrito} />
        </div>

        {/* Columna derecha: carrito + checkout (sticky en escritorio) */}
        <aside className="lg:sticky lg:top-[85px] lg:self-start">
          <div className="space-y-4">
            <div className="h-[340px] sm:h-[420px]">
              <CartPanel
                items={items}
                total={total}
                onIncrementar={incrementar}
                onDecrementar={decrementar}
                onQuitar={quitar}
                onVaciar={vaciar}
              />
            </div>
            <CheckoutBar
              total={total}
              tipoEntrega={tipoEntrega}
              formaPago={formaPago}
              direccion={direccion}
              domiciliarioId={domiciliarioId}
              pagaCon={pagaCon}
              comisionPagadaPor={comisionPagadaPor}
              carritoVacio={items.length === 0}
              onTipoEntrega={(t) => {
                setTipoEntrega(t);
                // Al salir de domicilio, limpiamos campos de reparto.
                if (t !== "domicilio") {
                  setDomiciliarioId(null);
                  setPagaCon(0);
                  setComisionPagadaPor(null);
                }
              }}
              onFormaPago={setFormaPago}
              onDireccion={setDireccion}
              onDomiciliario={setDomiciliarioId}
              onPagaCon={setPagaCon}
              onComisionPagadaPor={setComisionPagadaPor}
              onConfirmar={confirmar}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
